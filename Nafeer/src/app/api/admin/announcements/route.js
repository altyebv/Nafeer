import { NextResponse }    from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';
import { connectDB }       from '@/lib/db';
import { Announcement }    from '@/lib/models/Announcement';

// ─── GET /api/admin/announcements ─────────────────────────────────────────────
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  await connectDB();
  const items = await Announcement.find().sort({ pinned: -1, createdAt: -1 }).lean();
  return NextResponse.json({
    ok: true,
    data: items.map((a) => ({ ...a, id: a._id.toString() })),
  });
}

// ─── POST /api/admin/announcements ────────────────────────────────────────────
// Body: { title, body, type?, pinned?, targetSubjects? }
export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const { title, body, type, pinned, targetSubjects } = await request.json();

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ ok: false, error: 'العنوان والمحتوى مطلوبان' }, { status: 400 });
  }

  await connectDB();

  const doc = await Announcement.create({
    title:          title.trim(),
    body:           body.trim(),
    type:           type           || 'info',
    pinned:         pinned         ?? false,
    targetSubjects: targetSubjects || [],
    authorId:       admin.id       || null,
    authorName:     admin.name     || 'الإدارة',
  });

  return NextResponse.json({ ok: true, data: { id: doc._id.toString() } }, { status: 201 });
}

// ─── PATCH /api/admin/announcements ───────────────────────────────────────────
// Body: { id, ...fields }  — partial update
export async function PATCH(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const { id, ...fields } = await request.json();
  if (!id) return NextResponse.json({ ok: false, error: 'id مطلوب' }, { status: 400 });

  const allowed = ['title', 'body', 'type', 'pinned', 'targetSubjects'];
  const update  = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));

  await connectDB();
  const doc = await Announcement.findByIdAndUpdate(id, { $set: update }, { new: true });
  if (!doc) return NextResponse.json({ ok: false, error: 'الإعلان غير موجود' }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// ─── DELETE /api/admin/announcements ──────────────────────────────────────────
// Body: { id }
export async function DELETE(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ ok: false, error: 'id مطلوب' }, { status: 400 });

  await connectDB();
  await Announcement.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}