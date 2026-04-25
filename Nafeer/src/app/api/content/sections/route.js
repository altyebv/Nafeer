import { requireContributor, ok, err } from '@/lib/api/guard';
import { batchUpsertSections, deleteSection } from '@/lib/api/content';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';

// POST /api/content/sections
// Body: { sections: [...] }  — batch upsert (create or update)
// Called when contributor saves a lesson. Handles both new and existing sections.
export async function POST(request) {
  try {
    const user = await requireContributor();
    // Admins don't have a Contributor _id — substitute the system seed actor
    // so that createdBy / changelog ObjectId fields pass Mongoose validation.
    const actorId = user.role === 'admin'
      ? await ensureSystemSeedContributor()
      : user.id;
    const { sections } = await request.json();

    if (!Array.isArray(sections) || sections.length === 0) {
      return err('sections مطلوب كمصفوفة');
    }

    const results = await batchUpsertSections(sections, actorId);
    return ok(results, { total: results.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[POST /api/content/sections]', e);
    return err('خطأ في الخادم', 500);
  }
}