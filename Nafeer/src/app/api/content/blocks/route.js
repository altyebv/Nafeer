import { requireContributor, ok, err } from '@/lib/api/guard';
import { batchUpsertBlocks, deleteBlock } from '@/lib/api/content';
import { trackStat } from '@/lib/trackStat';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';

// POST /api/content/blocks
// Body: { blocks: [...] }  — batch upsert
export async function POST(request) {
  try {
    const user = await requireContributor();
    // Admins don't have a Contributor _id — substitute the system seed actor
    // so that createdBy / changelog ObjectId fields pass Mongoose validation.
    const actorId = user.role === 'admin'
      ? await ensureSystemSeedContributor()
      : user.id;
    const { blocks } = await request.json();

    if (!Array.isArray(blocks) || blocks.length === 0) {
      return ok([], { total: 0 });
    }

    const results = await batchUpsertBlocks(blocks, actorId);

    // Track stat — count new blocks only (approximate via batch size)
    if (results.length > 0) {
      trackStat(actorId, 'blocksAdded');
    }

    return ok(results, { total: results.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[POST /api/content/blocks]', e);
    return err('خطأ في الخادم', 500);
  }
}