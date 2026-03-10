import { requireSubjectAccess, requireContributor, ok, err } from '@/lib/api/guard';
import {
  getQuestionsForSubject, createQuestion, updateQuestion,
  updateQuestionStatus, deleteQuestion,
  getExamsForSubject, createExam, updateExam, deleteExam,
} from '@/lib/api/questions';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── Questions Collection ─────────────────────────────────────────────────────

// GET /api/content/questions?subjectId=PHYSICS[&lessonContentId=...][&status=...]
export async function GET(request) {
  try {
    const params    = new URL(request.url).searchParams;
    const subjectId = params.get('subjectId');
    if (!subjectId) return err('subjectId مطلوب');

    await requireSubjectAccess(subjectId);

    const questions = await getQuestionsForSubject(subjectId, {
      lessonContentId: params.get('lessonContentId') || undefined,
      unitContentId:   params.get('unitContentId')   || undefined,
      status:          params.get('status')          || undefined,
      type:            params.get('type')            || undefined,
    });

    return ok(questions, { total: questions.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/questions]', e);
    return err('خطأ في الخادم', 500);
  }
}

// POST /api/content/questions
export async function POST(request) {
  try {
    const body = await request.json();
    const { subjectId, type, textAr, correctAnswer } = body;
    if (!subjectId || !type || !textAr || !correctAnswer) {
      return err('الحقول المطلوبة: subjectId, type, textAr, correctAnswer');
    }

    const user = await requireSubjectAccess(subjectId);

    const question = await createQuestion(
      { ...body, contentId: body.contentId || generateId('q') },
      user.id
    );

    return ok(question);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.code === 11000) return err('معرّف السؤال موجود مسبقاً');
    console.error('[POST /api/content/questions]', e);
    return err('خطأ في الخادم', 500);
  }
}
