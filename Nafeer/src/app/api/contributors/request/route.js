import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

const USERNAME_RE = /^[\w\u0600-\u06FF._-]{3,20}$/;

export async function POST(request) {
  try {
    const { name, gender, email, username, subject } = await request.json();

    // Validate required fields
    if (!name?.trim() || !gender || !email?.trim() || !username?.trim() || !subject?.trim()) {
      return NextResponse.json(
        { message: 'يرجى تعبئة جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    if (!['male', 'female'].includes(gender)) {
      return NextResponse.json({ message: 'قيمة الجنس غير صالحة' }, { status: 400 });
    }

    if (!USERNAME_RE.test(username.trim())) {
      return NextResponse.json(
        { message: 'اسم المستخدم يجب أن يكون 3-20 حرفاً ويحتوي على أحرف أو أرقام أو _ . -' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check for duplicate email or username
    const existing = await Contributor.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: username.trim() },
      ],
    });

    if (existing) {
      if (existing.email === email.toLowerCase().trim()) {
        return NextResponse.json({ message: 'هذا البريد الإلكتروني مسجّل بالفعل' }, { status: 409 });
      }
      return NextResponse.json({ message: 'اسم المستخدم هذا محجوز بالفعل' }, { status: 409 });
    }

    const contributor = await Contributor.create({
      name:     name.trim(),
      gender,
      email:    email.toLowerCase().trim(),
      username: username.trim(),
      subject:  subject.trim(),
      status:   'pending',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'تم استلام طلبك بنجاح. سنتواصل معك قريباً.',
        id: contributor._id,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ message: 'البريد الإلكتروني أو اسم المستخدم مسجّل بالفعل' }, { status: 409 });
    }
    console.error('Contributor request error:', err);
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
