import { requireContributor, ok, err } from '@/lib/api/guard';
import { batchUpsertSections, deleteSection } from '@/lib/api/content';

// POST /api/content/sections
// Body: { sections: [...] }  — batch upsert (create or update)
// Called when contributor saves a lesson. Handles both new and existing sections.
export async function POST(request) {
  try {
    const user = await requireContributor();
    const { sections } = await request.json();

    if (!Array.isArray(sections) || sections.length === 0) {
      return err('sections مطلوب كمصفوفة');
    }

    const results = await batchUpsertSections(sections, user.id);
    return ok(results, { total: results.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[POST /api/content/sections]', e);
    return err('خطأ في الخادم', 500);
  }
}
