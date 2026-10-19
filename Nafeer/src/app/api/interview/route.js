import { NextResponse }    from 'next/server';
import { connectDB }        from '@/lib/db';
import { Contributor }      from '@/lib/models/Contributor';
import { ContributorRole }  from '@/lib/models/ContributorRole';
import { MIN_ANSWER_LENGTH as MIN_LENGTH, questionsFor } from '@/lib/interview';

// The questions come from the snapshot taken when the invite went out
// (lib/interview.js), so the page and the submit check always agree, whatever
// a lead edits in the meantime. Invites sent before snapshots existed resolve
// from the role, as before.

// Reads the role only when there is no snapshot to read instead.
async function questionsOf(contributor) {
  const role = !contributor.interviewSnapshot?.takenAt && contributor.roleId
    ? await ContributorRole.findById(contributor.roleId)
    : null;
  return questionsFor(contributor, role);
}

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
    .select('+interviewToken +statusToken');

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

  const alreadySubmitted =
    contributor.dynamicAnswersSubmittedAt ||
    contributor.interviewAnswers?.submittedAt;

  if (alreadySubmitted) {
    return NextResponse.json(
      { ok: false, error: 'لقد أرسلت إجاباتك بالفعل. شكراً على تقديمك!' },
      { status: 409 }
    );
  }

  const { questions, microTask, roleName, isSubjectSpecific } = await questionsOf(contributor);

  return NextResponse.json({
    ok: true,
    data: {
      name:               contributor.name,
      // The applicant's lasting link (/join/status) — the page offers it on
      // "later" and after sending.
      statusToken:        contributor.statusToken || null,
      subjectsOfInterest: contributor.subjectsOfInterest || [],
      roleName,
      questions,
      microTask,
      isSubjectSpecific,
    },
  });
}

// ─── POST /api/interview ───────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const { token, answers, microTask } = await request.json();

    // Must be a string: it goes straight into a Mongo filter, where an object
    // such as { "$ne": null } would match another applicant's interview.
    if (typeof token !== 'string' || !token) {
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

    // The same questions the page showed.
    const { questions: resolvedQuestions, microTask: resolvedMicroTask } = await questionsOf(contributor);

    // Validate each answer meets its minChars requirement
    for (const q of resolvedQuestions) {
      const match    = answers.find((a) => String(a.questionId) === String(q._id));
      const minChars = q.minChars ?? MIN_LENGTH;
      if (!match?.answer?.trim() || match.answer.trim().length < minChars) {
        return NextResponse.json(
          { ok: false, error: `إجابة غير مكتملة: ${q.text}` },
          { status: 400 }
        );
      }
    }

    if (resolvedMicroTask?.prompt) {
      const minChars = resolvedMicroTask.minChars ?? MIN_LENGTH;
      if (!microTask?.trim() || microTask.trim().length < minChars) {
        return NextResponse.json(
          { ok: false, error: 'يرجى إكمال المهمة التطبيقية' },
          { status: 400 }
        );
      }
    }

    // Build dynamic answers with question text snapshots
    const questionMap = Object.fromEntries(
      resolvedQuestions.map((q) => [String(q._id), q.text])
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
