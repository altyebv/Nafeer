import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { Contributor } from '@/lib/models/Contributor';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export async function POST(request) {
  const limited = await rateLimit(request, 'passwordResetConfirm');
  if (limited) return limited;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const { token, password } = body || {};
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ ok: false, error: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ ok: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
    }

    await connectDB();
    const resetFilter = {
      passwordResetTokenHash: hashToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
      status: 'approved',
      onboarded: true,
      passwordHash: { $exists: true, $ne: null },
    };
    if (!await Contributor.exists(resetFilter)) {
      return NextResponse.json({ ok: false, error: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية' }, { status: 400 });
    }

    const passwordHash = await Contributor.hashPassword(password);
    const contributor = await Contributor.findOneAndUpdate(
      resetFilter,
      {
        $set: { passwordHash },
        $inc: { sessionVersion: 1 },
        $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
      },
      { new: true }
    );

    if (!contributor) {
      return NextResponse.json({ ok: false, error: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: 'تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.' });
  } catch (err) {
    console.error('[passwordReset:confirm]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
