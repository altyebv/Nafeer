import { requireSubjectAccess, ok, err } from '@/lib/api/guard';
import { bootstrapSubject, getUnitsWithLessons, getSubject } from '@/lib/api/subject';

// GET /api/content/subject?subjectId=PHYSICS
// Returns subject document + units + lessons (for editor mount)
export async function GET(request) {
  try {
    const user = await requireSubjectAccess(
      new URL(request.url).searchParams.get('subjectId')
    );

    const subjectId = new URL(request.url).searchParams.get('subjectId');
    if (!subjectId) return err('subjectId مطلوب');

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

// POST /api/content/subject/bootstrap
// Body: { subjectId }
// Creates Subject + Units + Lessons in Atlas if they don't exist yet.
export async function POST(request) {
  try {
    const { subjectId } = await request.json();
    if (!subjectId) return err('subjectId مطلوب');

    const user = await requireSubjectAccess(subjectId);

    const result = await bootstrapSubject(subjectId, user.id);

    return ok(result);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[POST /api/content/subject]', e);
    return err('خطأ في الخادم', 500);
  }
}
