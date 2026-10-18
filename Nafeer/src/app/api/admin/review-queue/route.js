import { verifyAdminToken } from '@/lib/adminAuth';
import { getReviewQueue, approveOrReject, returnLesson } from '@/lib/api/reviewQueue';
import { ReviewError } from '@/lib/review';
import { after } from 'next/server';
import { notifyLessonReviewed } from '@/lib/reviewNotify';

const REVIEW_ERROR_STATUS = { NOT_FOUND: 404, NOT_IN_REVIEW: 409, CONFLICT: 409 };

const ok  = (data, extra = {}) => Response.json({ ok: true,  ...extra, data });
const err = (msg, status = 400) => Response.json({ ok: false, error: msg }, { status });

// GET /api/admin/review-queue?subjectId=PHYSICS
// Returns all content items with status='review'. Admin only.
export async function GET(request) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) return err('غير مصرح', 401);

    const subjectId = new URL(request.url).searchParams.get('subjectId') || null;
    const queue = await getReviewQueue(subjectId);

    return ok(queue, { total: queue.total });
  } catch (e) {
    console.error('[GET /api/admin/review-queue]', e);
    return err('خطأ في الخادم', 500);
  }
}

// PATCH /api/admin/review-queue
// Body: { contentId, type, status: 'approved'|'draft', note?, comments? }
// Approve or return a content item. Admin only.
//
// Returning a lesson (status 'draft') goes through returnLesson: the lesson
// is marked returned for a new review round, and the reviewer's points arrive
// as review comments, each anchored to where it applies —
//   comments: [{ text, anchor: { kind, id?, label? } }]   (lib/review.js)
// `note`, the older single free-text reason, is kept and becomes a comment on
// the lesson as a whole.
export async function PATCH(request) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) return err('غير مصرح', 401);

    const { contentId, type, status, note, comments } = await request.json();

    if (!contentId || !type) return err('contentId و type مطلوبان');
    if (!['approved', 'draft'].includes(status)) return err('حالة غير صالحة. استخدم approved أو draft');

    if (type === 'lesson' && status === 'draft') {
      const result = await returnLesson(
        contentId,
        { comments: comments ?? [], summary: note || '' },
        { id: admin.id, name: admin.displayName || admin.username || 'المراجِع' },
      );
      after(() => notifyLessonReviewed(contentId, 'returned', { comments: result.comments }));
      return ok(result);
    }

    const result = await approveOrReject(contentId, type, status, admin.id, note || '');
    if (type === 'lesson' && status === 'approved') after(() => notifyLessonReviewed(contentId, 'approved'));
    return ok(result);
  } catch (e) {
    if (e instanceof ReviewError) return err(e.message, REVIEW_ERROR_STATUS[e.code] || 400);
    console.error('[PATCH /api/admin/review-queue]', e);
    if (e.message === 'نوع محتوى غير صالح' || e.message === 'المحتوى غير موجود') {
      return err(e.message, 400);
    }
    return err('خطأ في الخادم', 500);
  }
}
