import { requireContributor, ok, err } from '@/lib/api/guard';
import { deleteBlock } from '@/lib/api/content';
import { connectDB} from '@/lib/db';
// DELETE /api/content/blocks/[id]
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    await requireContributor();
    await deleteBlock((await params).id);
    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/blocks/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}