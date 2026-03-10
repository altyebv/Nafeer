import { requireContributor, ok, err } from '@/lib/api/guard';
import { batchUpsertBlocks, deleteBlock } from '@/lib/api/content';

// POST /api/content/blocks
// Body: { blocks: [...] }  — batch upsert
export async function POST(request) {
  try {
    const user = await requireContributor();
    const { blocks } = await request.json();

    if (!Array.isArray(blocks) || blocks.length === 0) {
      return ok([], { total: 0 }); // empty section is fine
    }

    const results = await batchUpsertBlocks(blocks, user.id);
    return ok(results, { total: results.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[POST /api/content/blocks]', e);
    return err('خطأ في الخادم', 500);
  }
}
