import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { Unit }            from '@/lib/models/Unit';

// ─── PATCH /api/admin/curriculum/units/[id] ───────────────────────────────────
// Update a unit's title (and optionally description / bookTitle).
// [id] is the Mongo _id of the unit.

export async function PATCH(request, { params }) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, description, bookTitle } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ ok: false, error: 'العنوان مطلوب' }, { status: 400 });
    }

    await connectDB();

    const unit = await Unit.findById(id);
    if (!unit) {
      return NextResponse.json({ ok: false, error: 'الوحدة غير موجودة' }, { status: 404 });
    }

    unit.title = title.trim();
    if (typeof description === 'string') unit.description = description.trim() || null;
    if (typeof bookTitle   === 'string') unit.bookTitle   = bookTitle.trim()   || null;

    await unit.save();

    return NextResponse.json({
      ok: true,
      unit: {
        _id:       unit._id,
        contentId: unit.contentId,
        title:     unit.title,
      },
    });
  } catch (err) {
    console.error('[PATCH /api/admin/curriculum/units/[id]]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}