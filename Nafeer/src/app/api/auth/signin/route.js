import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find contributor with passwordHash included
    const contributor = await Contributor.findOne({ email: email.toLowerCase() })
      .select('+passwordHash');

    if (!contributor) {
      return NextResponse.json(
        { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
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
        { message: 'لم يتم تفعيل حسابك بعد. تواصل مع المسؤول.' },
        { status: 403 }
      );
    }

    const isValid = await contributor.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Issue JWT
    const token = await signToken({
      id: contributor._id.toString(),
      email: contributor.email,
      name: contributor.name,
      subject: contributor.subject,
      role: contributor.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      contributor: {
        id: contributor._id,
        name: contributor.name,
        email: contributor.email,
        subject: contributor.subject,
        role: contributor.role,
      },
    });
  } catch (err) {
    console.error('Sign in error:', err);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
