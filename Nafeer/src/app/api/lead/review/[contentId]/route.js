import { requireLeadOfContent, ok, err } from '@/lib/api/guard';
import { Lesson } from '@/lib/models/Lesson';
import { getLessonForReview } from '@/lib/api/reviewQueue';
import { isOwnWork } from '@/lib/credits';

// ─── GET /api/lead/review/[contentId] ─────────────────────────────────────────
// The lesson as the reviewer reads it — the same shape as the owner's
// /api/admin/review-queue/[contentId] — for a lead of its subject. `mine` tells
// the page to show it read-only (the four-eyes rule).
export async function GET(_request, { params }) {
  try {
    const { user, doc } = await requireLeadOfContent(Lesson, (await params).contentId, 'canReview');
    const lesson = await getLessonForReview(doc.contentId);
    if (!lesson) return err('الدرس غير موجود', 404);
    return ok({ ...lesson, mine: user.role !== 'admin' && isOwnWork(doc, user.id) });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/lead/review/[contentId]]', e);
    return err('خطأ في الخادم', 500);
  }
}
