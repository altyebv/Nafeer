import { requireSubjectAccess, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { getExamsForSubject, createExam } from '@/lib/api/questions';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// GET /api/content/exams?subjectId=PHYSICS
export async function GET(request) {
  try {
    const subjectId = new URL(request.url).searchParams.get('subjectId');
    if (!subjectId) return err('subjectId مطلوب');

    await requireSubjectAccess(subjectId);
    const exams = await getExamsForSubject(subjectId);
    return ok(exams, { total: exams.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/exams]', e);
    return err('خطأ في الخادم', 500);
  }
}

// POST /api/content/exams
// Body: { contentId?, subjectId, titleAr, source, ... }
export async function POST(request) {
  try {
    const body = await request.json();
    const { subjectId, titleAr } = body;
    if (!subjectId || !titleAr) return err('الحقول المطلوبة: subjectId, titleAr');

    const user = await requireSubjectAccess(subjectId);
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;

    const exam = await createExam(
      { ...body, contentId: body.contentId || generateId('exam') },
      actorId
    );

    return ok(exam);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.code === 11000) return err('معرّف الامتحان موجود مسبقاً');
    console.error('[POST /api/content/exams]', e);
    return err('خطأ في الخادم', 500);
  }
}