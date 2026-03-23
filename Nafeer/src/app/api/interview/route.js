import { NextResponse }    from 'next/server';
import { connectDB }        from '@/lib/db';
import { Contributor }      from '@/lib/models/Contributor';
import { ContributorRole }  from '@/lib/models/ContributorRole';

const MIN_LENGTH = 80;

// ─── GET /api/interview?token=xxx ─────────────────────────────────────────────
// Validates the token and returns contributor info + role questions.

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

  // Block re-submission — check both dynamic and legacy paths
  const alreadySubmitted =
    contributor.dynamicAnswersSubmittedAt ||
    contributor.interviewAnswers?.submittedAt;

  if (alreadySubmitted) {
    return NextResponse.json(
      { ok: false, error: 'لقد أرسلت إجاباتك بالفعل. شكراً على تقديمك!' },
      { status: 409 }
    );
  }

  // If the contributor has a roleId, fetch that role's questions
  let questions = [];
  let microTask = null;
  let roleName  = null;

  if (contributor.roleId) {
    const role = await ContributorRole.findById(contributor.roleId);
    if (role) {
      roleName  = role.name;
      questions = (role.interviewQuestions || [])
        .sort((a, b) => a.order - b.order);
      microTask = role.microTask?.prompt
        ? { prompt: role.microTask.prompt, minChars: role.microTask.minChars ?? MIN_LENGTH }
        : null;
    }
  }

  return NextResponse.json({
    ok: true,
    data: {
      name:               contributor.name,
      subjectsOfInterest: contributor.subjectsOfInterest || [],
      roleName,
      questions,
      microTask,
    },
  });
}

// ─── POST /api/interview ───────────────────────────────────────────────────────
// Saves interview answers. Handles both dynamic (role-based) and legacy flows.

export async function POST(request) {
  try {
    const { token, answers, microTask } = await request.json();

    if (!token) {
      return NextResponse.json({ ok: false, error: 'رابط غير صالح' }, { status: 400 });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ ok: false, error: 'لم يتم إرسال أي إجابات' }, { status: 400 });
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

    const alreadySubmitted =
      contributor.dynamicAnswersSubmittedAt ||
      contributor.interviewAnswers?.submittedAt;

    if (alreadySubmitted) {
      return NextResponse.json(
        { ok: false, error: 'تم إرسال إجاباتك بالفعل.' },
        { status: 409 }
      );
    }

    // Fetch role questions for validation + text snapshots
    let roleQuestions = [];
    if (contributor.roleId) {
      const role = await ContributorRole.findById(contributor.roleId);
      if (role) {
        roleQuestions = role.interviewQuestions || [];
        // Validate each answer meets the role's minChars
        for (const q of roleQuestions) {
          const match    = answers.find((a) => String(a.questionId) === String(q._id));
          const minChars = q.minChars ?? MIN_LENGTH;
          if (!match?.answer?.trim() || match.answer.trim().length < minChars) {
            return NextResponse.json(
              { ok: false, error: `إجابة غير مكتملة: ${q.text}` },
              { status: 400 }
            );
          }
        }
        // Validate micro task if role has one
        if (role.microTask?.prompt) {
          const minChars = role.microTask.minChars ?? MIN_LENGTH;
          if (!microTask?.trim() || microTask.trim().length < minChars) {
            return NextResponse.json(
              { ok: false, error: 'يرجى إكمال المهمة التطبيقية' },
              { status: 400 }
            );
          }
        }
      }
    }

    // Build dynamic answers with question text snapshots
    const questionMap = Object.fromEntries(
      roleQuestions.map((q) => [String(q._id), q.text])
    );

    contributor.dynamicAnswers = answers.map((a) => ({
      questionId: a.questionId,
      question:   questionMap[String(a.questionId)] || '',
      answer:     a.answer.trim(),
    }));

    contributor.dynamicMicroTask          = (microTask || '').trim();
    contributor.dynamicAnswersSubmittedAt = new Date();

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