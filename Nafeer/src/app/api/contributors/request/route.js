import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
import { Contributor }  from '@/lib/models/Contributor';

export async function POST(request) {
  try {
    const {
      name,
      email,
      gender,
      age,
      town,
      background,
      fieldOfStudy,
      subjectsOfInterest,
      hasPcOrTablet,
      hasStableInternet,
      usesAiTools,
      aiToolsList,
      roleId,
    } = await request.json();

    // Required field validation
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { message: 'يرجى تعبئة الاسم والبريد الإلكتروني' },
        { status: 400 }
      );
    }

    if (!subjectsOfInterest?.length && !roleId) {
      return NextResponse.json(
        { message: 'يرجى اختيار مجال المساهمة' },
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
      gender:             gender || '',
      age:                age || '',
      town:               town?.trim() || '',
      background:         background?.trim() || '',
      fieldOfStudy:       fieldOfStudy?.trim() || '',
      subjectsOfInterest: subjectsOfInterest || [],
      hasPcOrTablet:      hasPcOrTablet ?? null,
      hasStableInternet:  hasStableInternet ?? null,
      usesAiTools:        usesAiTools ?? null,
      aiToolsList:        aiToolsList || [],
      roleId:             roleId || null,
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