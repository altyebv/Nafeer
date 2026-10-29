import { createHash, randomBytes } from 'node:crypto';
import { NextResponse, after } from 'next/server';
import { connectDB } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { Contributor } from '@/lib/models/Contributor';
import { sendEmail } from '@/lib/email/emailService';
import { appUrl } from '@/lib/appUrl';

const TOKEN_TTL_MS = 60 * 60 * 1000;
const GENERIC_RESPONSE = {
  ok: true,
  message: 'إذا كان لهذا البريد حساب مؤهل، فستصلك رسالة برابط إعادة التعيين.',
};

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export async function POST(request) {
  const limited = await rateLimit(request, 'passwordResetRequest');
  if (limited) return limited;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    await connectDB();
    const contributor = await Contributor.findOne({
      email,
      status: 'approved',
      onboarded: true,
      passwordHash: { $exists: true, $ne: null },
    }).select('name email');

    if (!contributor) return NextResponse.json(GENERIC_RESPONSE);

    const token = randomBytes(32).toString('hex');
    contributor.passwordResetTokenHash = hashToken(token);
    contributor.passwordResetExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    await contributor.save();

    after(async () => {
      try {
        const result = await sendEmail({
          to: contributor.email,
          template: 'password_reset',
          data: {
            name: contributor.name,
            link: appUrl(`/reset-password#token=${encodeURIComponent(token)}`),
            expiresIn: 'ساعة واحدة',
          },
        });
        if (!result.ok) console.error('[passwordReset] Email delivery failed:', result.error);
      } catch (err) {
        console.error('[passwordReset] Email delivery failed:', err);
      }
    });

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (err) {
    console.error('[passwordReset:request]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
