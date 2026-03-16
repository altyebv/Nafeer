import { NextResponse } from 'next/server';
import { connectDB }      from '@/lib/db';
import { Media }          from '@/lib/models/Media';
import { getCurrentUser } from '@/lib/auth';
import { deleteMedia }    from '@/lib/supabase';

// ─── DELETE /api/media/[id] ───────────────────────────────────────────────────
// Admin-only. Deletes the file from Supabase Storage then removes the
// MongoDB record. Uses the media's `contentId` (not _id) as the URL param
// so the client never needs to know the Mongo _id.
export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json(
      { ok: false, error: 'حذف الوسائط متاح للمشرفين فقط' },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: 'المعرّف مطلوب' }, { status: 400 });
  }

  await connectDB();

  const media = await Media.findOne({ contentId: id });
  if (!media) {
    return NextResponse.json({ ok: false, error: 'الوسيلة غير موجودة' }, { status: 404 });
  }

  // Delete from Supabase first — if this fails we leave the DB record intact
  // so the admin can retry. Partial deletes (DB gone, Supabase still there) are
  // worse than the reverse since orphaned storage just wastes quota.
  try {
    await deleteMedia(media.path);
  } catch (e) {
    console.error('[DELETE /api/media] Supabase delete error:', e);
    return NextResponse.json(
      { ok: false, error: 'فشل حذف الملف من التخزين السحابي' },
      { status: 500 }
    );
  }

  await Media.deleteOne({ contentId: id });

  return NextResponse.json({ ok: true, data: { contentId: id } });
}