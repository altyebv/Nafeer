import { requireContributor, ok, err } from '@/lib/api/guard';
import { deleteBlock } from '@/lib/api/content';

// DELETE /api/content/blocks/[id]
export async function DELETE(request, { params }) {
  try {
    await requireContributor();
    await deleteBlock(params.id);
    return ok({ deleted: params.id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/blocks/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}
