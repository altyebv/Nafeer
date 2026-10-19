import { requireContributor, assertInSubject, ok, err } from '@/lib/api/guard';
import { Block } from '@/lib/models/Block';
import { Section } from '@/lib/models/Section';
import { batchUpsertBlocks, deleteBlock } from '@/lib/api/content';
import { withEditorNames } from '@/lib/api/versionCheck';
import { trackStat } from '@/lib/trackStat';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { assertCanEditLessons, lessonsForBlocks } from '@/lib/lessonAccess';

// POST /api/content/blocks
// Body: { blocks: [...] }  — batch upsert. A block may carry `baseVersion`;
// stale or deleted ones come back in `conflicts` instead of being written.
export async function POST(request) {
  try {
    const user = await requireContributor({ write: true });
    // Admins don't have a Contributor _id — substitute the system seed actor
    // so that createdBy / changelog ObjectId fields pass Mongoose validation.
    const actorId = user.role === 'admin'
      ? await ensureSystemSeedContributor()
      : user.id;
    const { blocks } = await request.json();

    if (!Array.isArray(blocks) || blocks.length === 0) {
      return ok([], { total: 0 });
    }

    // Every block — new or existing — and the section it lands in must be in
    // the contributor's subject.
    if (user.role !== 'admin' && blocks.some((b) => b?.subjectId && b.subjectId !== user.subject)) {
      return err('ليس لديك صلاحية الوصول إلى هذه المادة', 403);
    }
    await Promise.all([
      assertInSubject(user, Block,   blocks.map((b) => b?.contentId)),
      assertInSubject(user, Section, blocks.map((b) => b?.sectionContentId || b?.sectionId)),
    ]);

    // Only the owner of each lesson these blocks are in, or are moving to.
    await assertCanEditLessons(user, await lessonsForBlocks(
      blocks.map((b) => b?.contentId), blocks.map((b) => b?.sectionContentId || b?.sectionId),
    ));

    const { saved, conflicts } = await batchUpsertBlocks(blocks, actorId);

    // Track stat — every block written is credited, not just one per save.
    if (saved.length > 0) {
      trackStat(actorId, 'blocksAdded', { amount: saved.length });
    }

    return ok(saved, { total: saved.length, conflicts: await withEditorNames(conflicts) });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[POST /api/content/blocks]', e);
    return err('خطأ في الخادم', 500);
  }
}