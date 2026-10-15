import { requireContributor, assertInSubject, ok, err } from '@/lib/api/guard';
import { Section } from '@/lib/models/Section';
import { Lesson } from '@/lib/models/Lesson';
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

    // Every section — new or existing — and the lesson it belongs to must be in
    // the contributor's subject.
    if (user.role !== 'admin' && sections.some((s) => s?.subjectId && s.subjectId !== user.subject)) {
      return err('ليس لديك صلاحية الوصول إلى هذه المادة', 403);
    }
    await Promise.all([
      assertInSubject(user, Section, sections.map((s) => s?.contentId)),
      assertInSubject(user, Lesson,  sections.map((s) => s?.lessonContentId)),
    ]);

    const results = await batchUpsertSections(sections, actorId);
    return ok(results, { total: results.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[POST /api/content/sections]', e);
    return err('خطأ في الخادم', 500);
  }
}