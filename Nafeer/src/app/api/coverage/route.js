import { ok, err } from '@/lib/api/guard';
import { getAllSubjectsProgress } from '@/lib/api/subject';

// GET /api/coverage
// Public — no auth required.
// Returns lesson completion stats for all subjects.
// Powers the ProgressBoard on the landing page.
export async function GET() {
  try {
    const subjects = await getAllSubjectsProgress();
    return ok(subjects, { total: subjects.length });
  } catch (e) {
    console.error('[GET /api/coverage]', e);
    return err('خطأ في الخادم', 500);
  }
}
