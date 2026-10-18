import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { signToken, setAuthCookie, buildTokenPayload } from '@/lib/auth';
import { SUBJECT_IDS } from '@/shared/curriculum';
import { Unit } from '@/lib/models/Unit';
import { Lesson } from '@/lib/models/Lesson';
import { Section } from '@/lib/models/Section';
import bcrypt from 'bcryptjs';

// ─── helpers ──────────────────────────────────────────────────────────────────

const USERNAME_RE = /^[\w؀-ۿ._-]{3,20}$/; // same rule as models/Contributor.js

// The first lesson of the subject, in unit then lesson order, with no section yet.
async function firstEmptyLesson(subjectId) {
  if (!subjectId) return null;
  const [units, lessons, started] = await Promise.all([
    Unit.find({ subjectId }, 'contentId order').sort({ order: 1 }).lean(),
    Lesson.find({ subjectId, status: 'draft' }, 'contentId unitContentId order').sort({ order: 1 }).lean(),
    Section.distinct('lessonContentId', { subjectId }),
  ]);
  const busy = new Set(started);
  for (const u of units) {
    const hit = lessons.find((l) => l.unitContentId === u.contentId && !busy.has(l.contentId));
    if (hit) return hit.contentId;
  }
  return null;
}

async function generateUsername(name) {
  // Build a base slug from the first two words of the name (Arabic or Latin)
  const base = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('_')
    .toLowerCase()
    .replace(/[^a-z0-9_\u0600-\u06FF]/g, '') // keep latin, digits, Arabic chars
    .slice(0, 20) || 'contributor';

  // Try the plain base first, then append a random suffix until unique
  let candidate = base;
  let attempts  = 0;
  while (attempts < 10) {
    const exists = await Contributor.exists({ username: candidate });
    if (!exists) return candidate;
    candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
    attempts++;
  }
  // Absolute fallback
  return `${base}_${Date.now()}`;
}

// ─── GET /api/auth/onboard?token=xxx ─────────────────────────────────────────
// Validates the magic link token.
// Returns contributor name/username/subject so the page can greet them.
//
// Also returns `subjectsOfInterest` and a `needsSubjectChoice` boolean so the
// onboard page can render a subject-picker step when the admin has not yet
// assigned a canonical subject and the contributor expressed interest in more
// than one subject during the join flow.

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) {
    return NextResponse.json({ ok: false, error: 'رابط غير صالح' }, { status: 400 });
  }

  await connectDB();

  const contributor = await Contributor
    .findOne({ onboardingToken: token })
    .select('+onboardingToken');

  if (!contributor) {
    return NextResponse.json(
      { ok: false, error: 'الرابط غير صالح أو منتهي الصلاحية' },
      { status: 404 }
    );
  }

  if (contributor.status !== 'approved') {
    return NextResponse.json(
      { ok: false, error: 'هذا الحساب غير معتمد' },
      { status: 403 }
    );
  }

  if (contributor.onboardingExpiresAt && contributor.onboardingExpiresAt < new Date()) {
    return NextResponse.json(
      { ok: false, error: 'انتهت صلاحية الرابط. تواصل مع المسؤول للحصول على رابط جديد.' },
      { status: 410 }
    );
  }

  // Determine whether the onboard page needs to show a subject-choice step.
  // Needed when the admin has not assigned a subject AND the contributor picked
  // more than one at join time. If exactly one exists, POST will auto-resolve it.
  const interests          = contributor.subjectsOfInterest || [];
  const needsSubjectChoice = !contributor.subject && interests.length > 1;

  return NextResponse.json({
    ok:   true,
    data: {
      name:               contributor.name,
      username:           contributor.username,
      // Shown and editable before it is created (it becomes a public URL).
      suggestedUsername:  contributor.username || await generateUsername(contributor.name),
      subject:            contributor.subject,
      subjectsOfInterest: interests,
      needsSubjectChoice,
    },
  });
}

// ─── POST /api/auth/onboard ───────────────────────────────────────────────────
// Completes the onboarding: sets password + bio, marks onboarded, issues JWT.
// Body: { token, password, bio, chosenSubject? }
//
// Subject resolution order (first match wins):
//   1. Admin has already assigned contributor.subject   → use it as-is
//   2. Body includes a valid chosenSubject              → use it
//   3. subjectsOfInterest has exactly one entry        → auto-resolve silently
//   4. Multiple interests and no chosenSubject          → 422, frontend must ask

export async function POST(request) {
  try {
    const { token, password, bio, chosenSubject, username } = await request.json();

    // Both must be strings: the token goes straight into a Mongo filter, where
    // an object such as { "$ne": null } would match any pending contributor.
    if (typeof token !== 'string' || !token || typeof password !== 'string' || !password) {
      return NextResponse.json(
        { ok: false, error: 'الرابط وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      );
    }

    await connectDB();

    const contributor = await Contributor
      .findOne({ onboardingToken: token })
      .select('+onboardingToken');

    if (!contributor) {
      return NextResponse.json(
        { ok: false, error: 'الرابط غير صالح أو منتهي الصلاحية' },
        { status: 404 }
      );
    }

    if (contributor.status !== 'approved') {
      return NextResponse.json({ ok: false, error: 'هذا الحساب غير معتمد' }, { status: 403 });
    }

    if (contributor.onboardingExpiresAt && contributor.onboardingExpiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, error: 'انتهت صلاحية الرابط. تواصل مع المسؤول للحصول على رابط جديد.' },
        { status: 410 }
      );
    }

    // ── Subject resolution ────────────────────────────────────────────────────
    const interests = contributor.subjectsOfInterest || [];

    if (!contributor.subject) {
      if (chosenSubject) {
        // Validate: must be a real subject ID and must be from the contributor's
        // interest list (fall back to allowing any valid ID if list is empty).
        const allowedPool = interests.length > 0 ? interests : SUBJECT_IDS;
        if (!SUBJECT_IDS.includes(chosenSubject) || !allowedPool.includes(chosenSubject)) {
          return NextResponse.json(
            { ok: false, error: 'المادة المختارة غير صالحة' },
            { status: 400 }
          );
        }
        contributor.subject = chosenSubject;
      } else if (interests.length === 1) {
        // Exactly one interest — resolve silently, no friction for the user.
        contributor.subject = interests[0];
      } else if (interests.length > 1) {
        // Multiple interests and no choice provided — the frontend must show the
        // picker before re-submitting. Return the options in the error body so
        // the page can render them without an extra round-trip.
        return NextResponse.json(
          {
            ok:                 false,
            error:              'يرجى اختيار المادة التي ستساهم فيها',
            needsSubjectChoice: true,
            subjectsOfInterest: interests,
          },
          { status: 422 }
        );
      }
      // interests.length === 0 and no chosenSubject: leave subject blank.
      // The admin will assign it later; the card warning will prompt them.
    }

    // ── Username: the one they chose, else a generated one ────────────────────
    if (typeof username === 'string' && username.trim() && username.trim() !== contributor.username) {
      const wanted = username.trim();
      if (!USERNAME_RE.test(wanted)) {
        return NextResponse.json({ ok: false, error: 'اسم المستخدم 3–20 حرفاً: أحرف أو أرقام أو _ . -', field: 'username' }, { status: 400 });
      }
      if (await Contributor.exists({ username: wanted, _id: { $ne: contributor._id } })) {
        return NextResponse.json({ ok: false, error: 'هذا الاسم مأخوذ — جرّب غيره', field: 'username' }, { status: 409 });
      }
      contributor.username = wanted;
    }
    if (!contributor.username) {
      contributor.username = await generateUsername(contributor.name);
    }

    // ── Persist ───────────────────────────────────────────────────────────────
    contributor.passwordHash        = await bcrypt.hash(password, 12);
    contributor.bio                 = (bio || '').trim().slice(0, 280);
    contributor.onboarded           = true;
    contributor.onboardingToken     = null;
    contributor.onboardingExpiresAt = null;
    contributor.lastSignedInAt      = new Date();

    await contributor.save();

    // Issue session cookie — subject is now correctly baked into the JWT.
    const jwtToken = await signToken(buildTokenPayload(contributor));
    await setAuthCookie(jwtToken);

    return NextResponse.json({
      ok: true,
      // Onboarding ends inside the work: the first lesson nobody has started.
      firstLessonId: await firstEmptyLesson(contributor.subject),
      contributor: {
        id:        contributor._id,
        name:      contributor.name,
        username:  contributor.username,
        email:     contributor.email,
        subject:   contributor.subject,
        role:      contributor.role,
        avatarUrl: contributor.avatarUrl,
        onboarded: contributor.onboarded,
      },
    });
  } catch (err) {
    console.error('[POST /api/auth/onboard]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}