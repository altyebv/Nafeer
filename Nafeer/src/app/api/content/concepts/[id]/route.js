import { requireContributor, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { updateConcept, updateConceptStatus, deleteConcept } from '@/lib/api/concepts';
import { connectDB } from '@/lib/db';

// PUT /api/content/concepts/[id]
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const user = await requireContributor();
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const body = await request.json();
    const { note, ...updates } = body;

    const allowed = [
      'type', 'titleAr', 'titleEn', 'definition', 'shortDefinition',
      'formula', 'imageUrl', 'difficulty', 'extraData', 'tagIds',
    ];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const concept = await updateConcept((await params).id, safeUpdates, actorId, note || '',user.role === 'admin');
    if (!concept) return err('المفهوم غير موجود', 404);

    return ok(concept);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PUT /api/content/concepts/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// PATCH /api/content/concepts/[id]
// PATCH /api/content/concepts/[id]
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const user = await requireContributor();
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const { status, note } = await request.json();

    if (!['draft', 'review', 'approved', 'archived'].includes(status)) {
      return err('حالة غير صالحة');
    }
    if (status === 'approved' && user.role !== 'admin') {
      return err('الاعتماد متاح للمشرفين فقط', 403);
    }

    const concept = await updateConceptStatus((await params).id, status, actorId, note || '');
    if (!concept) return err('المفهوم غير موجود', 404);

    return ok(concept);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PATCH /api/content/concepts/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// DELETE /api/content/concepts/[id]
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    await requireContributor();
    await deleteConcept((await params).id);
    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.message?.includes('معتمد')) return err(e.message, 400);
    console.error('[DELETE /api/content/concepts/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}