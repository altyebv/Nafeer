import { requireSubjectAccess, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import {
  getQuestionsForSubject, createQuestion,
} from '@/lib/api/questions';
import { trackStat } from '@/lib/trackStat';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

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

export async function POST(request) {
  try {
    const body = await request.json();
    const { subjectId, type, textAr, correctAnswer } = body;
    if (!subjectId || !type || !textAr || !correctAnswer) {
      return err('الحقول المطلوبة: subjectId, type, textAr, correctAnswer');
    }

    const user = await requireSubjectAccess(subjectId);
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;

    const question = await createQuestion(
      { ...body, contentId: body.contentId || generateId('q') },
      actorId
    );

    // Track stat — fire-and-forget
    trackStat(actorId, 'questionsAdded');

    return ok(question);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.code === 11000) return err('معرّف السؤال موجود مسبقاً');
    console.error('[POST /api/content/questions]', e);
    return err('خطأ في الخادم', 500);
  }
}