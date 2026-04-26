import { requireContributor, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { updateQuestion, updateQuestionStatus, deleteQuestion } from '@/lib/api/questions';
import { connectDB } from '@/lib/db'


// PUT /api/content/questions/[id]
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const user = await requireContributor();
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const body = await request.json();
    const { note, ...updates } = body;

    const allowed = [
      'type', 'textAr', 'textEn', 'correctAnswer', 'options', 'explanation',
      'imageUrl', 'tableData', 'difficulty', 'points', 'estimatedSeconds',
      'cognitiveLevel', 'source', 'sourceExamContentId', 'sourceDetails',
      'sourceYear', 'feedEligible', 'unitContentId', 'lessonContentId',
      'sectionContentId', 'isCheckpoint', 'conceptIds',
      'markers',
    ];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const question = await updateQuestion((await params).id, safeUpdates, actorId, note || '');
    if (!question) return err('السؤال غير موجود', 404);

    return ok(question);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PUT /api/content/questions/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// PATCH /api/content/questions/[id]
export async function PATCH(request, { params }) {
  await connectDB();
  try {
    const user = await requireContributor();
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const { status, note } = await request.json();

    if (!['draft', 'review', 'approved', 'archived'].includes(status)) return err('حالة غير صالحة');
    if (status === 'approved' && user.role !== 'admin') return err('الاعتماد متاح للمشرفين فقط', 403);

    const question = await updateQuestionStatus((await params).id, status, actorId, note || '');
    if (!question) return err('السؤال غير موجود', 404);

    return ok(question);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PATCH /api/content/questions/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// DELETE /api/content/questions/[id]
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    await requireContributor();
    await deleteQuestion((await params).id);
    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/questions/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}