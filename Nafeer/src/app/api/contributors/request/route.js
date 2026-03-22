import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

export async function POST(request) {
  try {
    const {
      name,
      email,
      background,
      fieldOfStudy,
      subjectsOfInterest,
    } = await request.json();

    // Required field validation
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { message: 'يرجى تعبئة الاسم والبريد الإلكتروني' },
        { status: 400 }
      );
    }

    if (!subjectsOfInterest?.length) {
      return NextResponse.json(
        { message: 'يرجى اختيار مادة واحدة على الأقل' },
        { status: 400 }
      );
    }

    await connectDB();

    // Duplicate email check
    const existing = await Contributor.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existing) {
      return NextResponse.json(
        { message: 'هذا البريد الإلكتروني مسجّل بالفعل' },
        { status: 409 }
      );
    }

    const contributor = await Contributor.create({
      name:               name.trim(),
      email:              email.toLowerCase().trim(),
      background:         background?.trim() || '',
      fieldOfStudy:       fieldOfStudy?.trim() || '',
      subjectsOfInterest: subjectsOfInterest || [],
      status:             'pending',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'تم استلام طلبك. سنتواصل معك قريباً للخطوة التالية.',
        id: contributor._id,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { message: 'هذا البريد الإلكتروني مسجّل بالفعل' },
        { status: 409 }
      );
    }
    console.error('Contributor request error:', err);
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}