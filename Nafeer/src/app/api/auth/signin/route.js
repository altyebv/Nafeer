import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { signToken, setAuthCookie, buildTokenPayload } from '@/lib/auth';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier?.trim() || !password) {
      return NextResponse.json(
        { message: 'اسم المستخدم وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    await connectDB();

    // Accept username OR email — detect by presence of '@'
    const isEmail = identifier.includes('@');
    const query   = isEmail
      ? { email: identifier.toLowerCase().trim() }
      : { username: identifier.trim() };

    const contributor = await Contributor.findOne(query).select('+passwordHash');

    if (!contributor) {
      return NextResponse.json(
        { message: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    if (contributor.status !== 'approved') {
      return NextResponse.json(
        { message: 'حسابك لم يُعتمد بعد. سنتواصل معك قريباً.' },
        { status: 403 }
      );
    }

    if (!contributor.passwordHash) {
      return NextResponse.json(
        { message: 'لم يتم تفعيل حسابك بعد. تحقق من بريدك للحصول على رابط التأهيل.' },
        { status: 403 }
      );
    }

    const isValid = await contributor.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { message: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Stamp last sign-in time (fire-and-forget)
    Contributor.findByIdAndUpdate(contributor._id, { lastSignedInAt: new Date() }).catch(() => {});

    const token = await signToken(buildTokenPayload(contributor));
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
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
    console.error('Sign in error:', err);
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
