import { verifyAdminToken } from '@/lib/adminAuth';
import { getReviewQueue, approveOrReject } from '@/lib/api/ReviewQueue';

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
// Body: { contentId, type, status: 'approved'|'draft', note? }
// Approve or reject a content item. Admin only.
export async function PATCH(request) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) return err('غير مصرح', 401);

    const { contentId, type, status, note } = await request.json();

    if (!contentId || !type) return err('contentId و type مطلوبان');
    if (!['approved', 'draft'].includes(status)) return err('حالة غير صالحة. استخدم approved أو draft');

    // adminObjId: pass the admin id from the JWT. May be a string or ObjectId.
    const result = await approveOrReject(contentId, type, status, admin.id, note || '');
    return ok(result);
  } catch (e) {
    console.error('[PATCH /api/admin/review-queue]', e);
    if (e.message === 'نوع محتوى غير صالح' || e.message === 'المحتوى غير موجود') {
      return err(e.message, 400);
    }
    return err('خطأ في الخادم', 500);
  }
}