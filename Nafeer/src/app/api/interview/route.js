import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

const MIN_LENGTH = 80; // chars — prevents empty submissions

// ─── GET /api/interview?token=xxx ─────────────────────────────────────────────
// Validates the interview token and returns enough info to greet the applicant.

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) {
    return NextResponse.json({ ok: false, error: 'رابط غير صالح' }, { status: 400 });
  }

  await connectDB();

  const contributor = await Contributor
    .findOne({ interviewToken: token })
    .select('+interviewToken');

  if (!contributor) {
    return NextResponse.json(
      { ok: false, error: 'الرابط غير صالح أو منتهي الصلاحية' },
      { status: 404 }
    );
  }

  if (contributor.interviewExpiresAt && contributor.interviewExpiresAt < new Date()) {
    return NextResponse.json(
      { ok: false, error: 'انتهت صلاحية الرابط. تواصل معنا للحصول على رابط جديد.' },
      { status: 410 }
    );
  }

  if (contributor.interviewAnswers?.submittedAt) {
    return NextResponse.json(
      { ok: false, error: 'لقد أرسلت إجاباتك بالفعل. شكراً على تقديمك!' },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      name:               contributor.name,
      subjectsOfInterest: contributor.subjectsOfInterest || [],
    },
  });
}

// ─── POST /api/interview ───────────────────────────────────────────────────────
// Saves interview answers. Token consumed after submission (remains for lookup
// but interviewAnswers.submittedAt prevents re-submission).

export async function POST(request) {
  try {
    const {
      token,
      motivation,
      educationCritique,
      teachingMoment,
      weeklyCommitment,
      microTask,
    } = await request.json();

    if (!token) {
      return NextResponse.json({ ok: false, error: 'رابط غير صالح' }, { status: 400 });
    }

    // Validate required fields
    const missing = [];
    if (!motivation?.trim() || motivation.trim().length < MIN_LENGTH)       missing.push('الدوافع');
    if (!educationCritique?.trim() || educationCritique.trim().length < MIN_LENGTH) missing.push('رأيك في التعليم');
    if (!teachingMoment?.trim() || teachingMoment.trim().length < MIN_LENGTH) missing.push('لحظة التعليم');
    if (!weeklyCommitment?.trim())                                            missing.push('الالتزام الأسبوعي');
    if (!microTask?.trim() || microTask.trim().length < MIN_LENGTH)          missing.push('المهمة الصغيرة');

    if (missing.length > 0) {
      return NextResponse.json(
        { ok: false, error: `يرجى إكمال: ${missing.join('، ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    const contributor = await Contributor
      .findOne({ interviewToken: token })
      .select('+interviewToken');

    if (!contributor) {
      return NextResponse.json(
        { ok: false, error: 'الرابط غير صالح أو منتهي الصلاحية' },
        { status: 404 }
      );
    }

    if (contributor.interviewExpiresAt && contributor.interviewExpiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, error: 'انتهت صلاحية الرابط.' },
        { status: 410 }
      );
    }

    if (contributor.interviewAnswers?.submittedAt) {
      return NextResponse.json(
        { ok: false, error: 'تم إرسال إجاباتك بالفعل.' },
        { status: 409 }
      );
    }

    contributor.interviewAnswers = {
      motivation:        motivation.trim(),
      educationCritique: educationCritique.trim(),
      teachingMoment:    teachingMoment.trim(),
      weeklyCommitment:  weeklyCommitment.trim(),
      microTask:         microTask.trim(),
      submittedAt:       new Date(),
    };

    await contributor.save();

    return NextResponse.json({
      ok:      true,
      message: 'وصلت إجاباتك. سنتواصل معك قريباً.',
    });
  } catch (err) {
    console.error('[POST /api/interview]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}