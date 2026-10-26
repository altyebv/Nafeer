import { requireSubjectAccess, ok, err } from '@/lib/api/guard';
import { getUnitsWithLessons, getSubject } from '@/lib/api/subject';

// GET /api/content/subject?subjectId=PHYSICS
// Returns subject document + units + lessons (for editor mount). `subject` is
// null until the owner opens the subject from the admin dashboard; members no
// longer create it (there was a POST here that did, as whoever called it).
export async function GET(request) {
  try {
    const subjectId = new URL(request.url).searchParams.get('subjectId');
    if (!subjectId) return err('subjectId مطلوب');

    const user = await requireSubjectAccess(subjectId);

    const [subject, unitsWithLessons] = await Promise.all([
      getSubject(subjectId),
      getUnitsWithLessons(subjectId),
    ]);

    return ok({ subject, units: unitsWithLessons });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/subject]', e);
    return err('خطأ في الخادم', 500);
  }
}