import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

export async function POST(request) {
  try {
    const { name, email, subject, background, motivation } = await request.json();

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !background?.trim()) {
      return NextResponse.json(
        { message: 'يرجى تعبئة جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check for duplicate email
    const existing = await Contributor.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { message: 'هذا البريد الإلكتروني مسجّل بالفعل' },
        { status: 409 }
      );
    }

    // Create pending request
    const contributor = await Contributor.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      background: background.trim(),
      motivation: motivation?.trim() || '',
      status: 'pending',
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
    console.error('Contributor request error:', err);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
