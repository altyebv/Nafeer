import { requireContentAccess, ok, err } from '@/lib/api/guard';
import { Section } from '@/lib/models/Section';
import { deleteCheckpointQuestionsForSections, deleteSection } from '@/lib/api/content';
import { Block } from '@/lib/models/Block';
import { connectDB } from '@/lib/db';

// DELETE /api/content/sections/[id]
export async function DELETE(request, { params }) {
  try {
    await requireContentAccess(Section, (await params).id);
    await connectDB();

    const { id } = await params;

    // Cascade: delete checkpoint questions + blocks in this section
    await deleteCheckpointQuestionsForSections([id]);
    await Block.deleteMany({ sectionContentId: id });
    await deleteSection(id);

    return ok({ deleted: id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/sections/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}
