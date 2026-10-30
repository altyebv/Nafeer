import { requireContentAccess, ok, err } from '@/lib/api/guard';
import { assertCanEditLessons, lessonsForSections } from '@/lib/lessonAccess';
import { Section } from '@/lib/models/Section';
import { deleteCheckpointQuestionsForSections, deleteSection } from '@/lib/api/content';
import { connectDB } from '@/lib/db';
import { authorsOf, recountAuthoredLater } from '@/lib/authoredStats';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';

// DELETE /api/content/sections/[id]
export async function DELETE(request, { params }) {
  try {
    const { user } = await requireContentAccess(Section, (await params).id, { write: true });
    const actorId = user.role === 'admin'
      ? await ensureSystemSeedContributor()
      : user.id;
    await connectDB();
    await assertCanEditLessons(user, await lessonsForSections([(await params).id]));

    const { id } = await params;

    // Cascade: delete checkpoint questions + blocks in this section
    const authors = await authorsOf('Block', { sectionContentId: id });
    await deleteCheckpointQuestionsForSections([id]);
    await deleteSection(id, { byId: actorId, byName: user.name || '' });
    recountAuthoredLater(authors);

    return ok({ deleted: id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/sections/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}
