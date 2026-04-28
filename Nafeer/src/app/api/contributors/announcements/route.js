import { NextResponse }   from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB }      from '@/lib/db';
import { Announcement }   from '@/lib/models/announcement';

// ─── GET /api/contributors/announcements ──────────────────────────────────────
// Returns active announcements for the current contributor.
// Filters by targetSubjects (empty = all) and returns pinned-first.

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });
  }

  try {
    await connectDB();

    // Match announcements that are global OR target this contributor's subject
    const filter = user.subject
      ? { $or: [{ targetSubjects: { $size: 0 } }, { targetSubjects: user.subject }] }
      : { targetSubjects: { $size: 0 } };

    const announcements = await Announcement
      .find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      ok: true,
      data: announcements.map((a) => ({
        id:          a._id.toString(),
        title:       a.title,
        body:        a.body,
        type:        a.type,
        pinned:      a.pinned,
        authorName:  a.authorName,
        createdAt:   a.createdAt,
      })),
    });
  } catch (err) {
    console.error('[GET /api/contributors/announcements]', err);
    return NextResponse.json({ ok: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}