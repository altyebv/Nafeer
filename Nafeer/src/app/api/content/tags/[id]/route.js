import { requireContributor, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { updateTag, deleteTag } from '@/lib/api/concepts';

// PUT /api/content/tags/[id]
export async function PUT(request, { params }) {
  try {
    const user = await requireContributor();
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const body = await request.json();
    const { note, ...updates } = body;

    const allowed = ['nameAr', 'nameEn'];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const tag = await updateTag((await params).id, safeUpdates, actorId, note || '');
    if (!tag) return err('الوسم غير موجود', 404);

    return ok(tag);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PUT /api/content/tags/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// DELETE /api/content/tags/[id]
export async function DELETE(request, { params }) {
  try {
    await requireContributor();
    await deleteTag((await params).id);
    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/tags/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}