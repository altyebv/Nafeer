import { requireContributor, ok, err } from '@/lib/api/guard';
import { updateQuestion, updateQuestionStatus, deleteQuestion } from '@/lib/api/questions';

// PUT /api/content/questions/[id]
export async function PUT(request, { params }) {
  try {
    const user = await requireContributor();
    const body = await request.json();
    const { note, ...updates } = body;

    const allowed = [
      'type', 'textAr', 'textEn', 'correctAnswer', 'options', 'explanation',
      'imageUrl', 'tableData', 'difficulty', 'points', 'estimatedSeconds',
      'cognitiveLevel', 'source', 'sourceExamContentId', 'sourceDetails',
      'sourceYear', 'feedEligible', 'unitContentId', 'lessonContentId', 'conceptIds',
    ];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const question = await updateQuestion((await params).id, safeUpdates, user.id, note || '');
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
  try {
    const user = await requireContributor();
    const { status, note } = await request.json();

    if (!['draft', 'review', 'approved', 'archived'].includes(status)) return err('حالة غير صالحة');
    if (status === 'approved' && user.role !== 'admin') return err('الاعتماد متاح للمشرفين فقط', 403);

    const question = await updateQuestionStatus((await params).id, status, user.id, note || '');
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
    await requireContributor();
    await deleteQuestion((await params).id);
    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/questions/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}