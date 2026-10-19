import { verifyAdminToken } from '@/lib/adminAuth';
import { getLessonForReview } from '@/lib/api/reviewQueue';

const ok  = (data) => Response.json({ ok: true, data });
const err = (msg, status = 400) => Response.json({ ok: false, error: msg }, { status });

// ─── GET /api/admin/review-queue/[contentId] ──────────────────────────────────
// The lesson as the reviewer reads it (lib/api/reviewQueue.js
// getLessonForReview). The lead's inbox reads the same shape from
// /api/lead/review/[contentId].
export async function GET(_request, { params }) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) return err('غير مصرح', 401);
    const { contentId } = await params;

    const lesson = await getLessonForReview(contentId);
    if (!lesson) return err('الدرس غير موجود', 404);
    return ok(lesson);
  } catch (e) {
    console.error('[GET /api/admin/review-queue/[contentId]]', e);
    return err('خطأ في الخادم', 500);
  }
}
