import { requireContributor, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { updateExam, deleteExam } from '@/lib/api/questions';

// PUT /api/content/exams/[id]
export async function PUT(request, { params }) {
  try {
    const user = await requireContributor();
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const body = await request.json();
    const { note, ...updates } = body;

    const allowed = [
      'titleAr', 'titleEn', 'source', 'year', 'schoolName',
      'duration', 'totalPoints', 'description', 'examType',
      'questionContentIds', 'sectionsJson',
    ];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const exam = await updateExam((await params).id, safeUpdates, actorId);
    if (!exam) return err('الامتحان غير موجود', 404);

    return ok(exam);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PUT /api/content/exams/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// DELETE /api/content/exams/[id]
export async function DELETE(request, { params }) {
  try {
    await requireContributor();
    await deleteExam((await params).id);
    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/exams/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}