import { requireContributor, ok, err } from '@/lib/api/guard';
import { getLessonHistory } from '@/lib/api/lessons';

// GET /api/content/lessons/[id]/history
// Returns full audit trail for a lesson, newest first.
// ?limit=N  — optional cap, defaults to 50
export async function GET(request, { params }) {
  try {
    await requireContributor();

    const url   = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

    const contentId = (await params).id;
    const history   = await getLessonHistory(contentId, limit);

    return ok({ history, total: history.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/lessons/[id]/history]', e);
    return err('خطأ في الخادم', 500);
  }
}