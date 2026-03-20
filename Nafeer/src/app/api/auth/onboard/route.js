import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { signToken, setAuthCookie, buildTokenPayload } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// ─── GET /api/auth/onboard?token=xxx ─────────────────────────────────────────
// Validates the magic link token.
// Returns contributor name/username so the page can greet them.

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

  return NextResponse.json({
    ok:   true,
    data: {
      name:     contributor.name,
      username: contributor.username,
      subject:  contributor.subject,
    },
  });
}

// ─── POST /api/auth/onboard ───────────────────────────────────────────────────
// Completes the onboarding: sets password + bio, marks onboarded, issues JWT.
// Body: { token, password, bio }

export async function POST(request) {
  try {
    const { token, password, bio } = await request.json();

    if (!token || !password) {
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

    // Set password, bio, mark onboarded, clear token
    contributor.passwordHash        = await bcrypt.hash(password, 12);
    contributor.bio                 = (bio || '').trim().slice(0, 280);
    contributor.onboarded           = true;
    contributor.onboardingToken     = null;
    contributor.onboardingExpiresAt = null;
    contributor.lastSignedInAt      = new Date();

    await contributor.save();

    // Issue session cookie
    const jwtToken = await signToken(buildTokenPayload(contributor));
    await setAuthCookie(jwtToken);

    return NextResponse.json({
      ok: true,
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
