import { requireContributor, ok, err } from '@/lib/api/guard';
import { deleteSection } from '@/lib/api/content';
import { Block } from '@/lib/models/Block';
import { connectDB } from '@/lib/db';

// DELETE /api/content/sections/[id]
export async function DELETE(request, { params }) {
  try {
    await requireContributor();
    await connectDB();

    // Cascade: delete blocks in this section
    await Block.deleteMany({ sectionContentId: params.id });
    await deleteSection(params.id);

    return ok({ deleted: params.id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/sections/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}
