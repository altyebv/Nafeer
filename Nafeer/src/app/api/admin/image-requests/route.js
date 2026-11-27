import { verifyAdminToken } from '@/lib/adminAuth';
import { connectDB } from '@/lib/db';
import { openImageRequests } from '@/lib/imageRequests';

// ─── GET /api/admin/image-requests ────────────────────────────────────────────
// What contributors are waiting to have uploaded (lib/imageRequests.js). The
// dashboard fills one through PATCH /api/content/blocks/[id]. Owner only.
export async function GET() {
  try {
    if (!(await verifyAdminToken())) return Response.json({ ok: false, error: 'غير مصرح' }, { status: 401 });
    await connectDB();
    return Response.json({ ok: true, data: await openImageRequests() });
  } catch (e) {
    console.error('[GET /api/admin/image-requests]', e);
    return Response.json({ ok: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}
