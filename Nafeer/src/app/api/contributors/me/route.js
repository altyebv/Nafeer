import { NextResponse } from 'next/server';
import { getCurrentUser, signToken, setAuthCookie, buildTokenPayload } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

// ─── GET /api/contributors/me ─────────────────────────────────────────────────
// Returns the current contributor's full profile (including stats).

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  await connectDB();
  const contributor = await Contributor.findById(user.id).lean();
  if (!contributor) return NextResponse.json({ ok: false, error: 'المساهم غير موجود' }, { status: 404 });

  const { passwordHash, onboardingToken, avatarPath, ...safe } = contributor;
  return NextResponse.json({ ok: true, data: { ...safe, id: safe._id.toString() } });
}

// ─── PATCH /api/contributors/me ───────────────────────────────────────────────
// Updates mutable profile fields: bio, username (if not taken).
// Avatar is handled separately via /api/contributors/me/avatar.

export async function PATCH(request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();
  const update = {};

  if (typeof body.bio === 'string') {
    update.bio = body.bio.trim().slice(0, 280);
  }

  if (typeof body.username === 'string') {
    const USERNAME_RE = /^[\w\u0600-\u06FF._-]{3,20}$/;
    const u = body.username.trim();
    if (!USERNAME_RE.test(u)) {
      return NextResponse.json(
        { ok: false, error: 'اسم المستخدم غير صالح. يجب أن يكون 3-20 حرفاً.' },
        { status: 400 }
      );
    }
    update.username = u;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: 'لا يوجد تحديثات' }, { status: 400 });
  }

  await connectDB();

  try {
    const contributor = await Contributor.findByIdAndUpdate(
      user.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!contributor) return NextResponse.json({ ok: false, error: 'المساهم غير موجود' }, { status: 404 });

    // Re-issue JWT so the new username/avatar reflects immediately
    const token = await signToken(buildTokenPayload(contributor));
    await setAuthCookie(token);

    return NextResponse.json({ ok: true, data: { username: contributor.username, bio: contributor.bio } });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ ok: false, error: 'اسم المستخدم مستخدم بالفعل' }, { status: 409 });
    }
    console.error('[PATCH /api/contributors/me]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
