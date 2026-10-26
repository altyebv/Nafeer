import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { Unit }            from '@/lib/models/Unit';
import { parseTarget }     from '@/lib/unitTarget';
import { setUnitBook, MAX_BOOK_TITLE } from '@/lib/api/subject';

// ─── PATCH /api/admin/curriculum/units/[id] ───────────────────────────────────
// Update a unit's title, lesson target, book, description or bookTitle — any
// of them. [id] is the Mongo _id of the unit. `targetLessons: null` clears the
// target. `book` is { id } to join an existing book, { title } to start a new
// one, or null to take the unit out of its book (lib/api/subject.js books).

export async function PATCH(request, { params }) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, description, bookTitle } = body;

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return NextResponse.json({ ok: false, error: 'العنوان مطلوب' }, { status: 400 });
    }
    const hasTarget = 'targetLessons' in body;
    const target = hasTarget ? parseTarget(body.targetLessons) : null;
    if (target === undefined) {
      return NextResponse.json({ ok: false, error: 'عدد الدروس المستهدف غير صالح' }, { status: 400 });
    }
    const hasBook = 'book' in body;
    const { book } = body;
    if (hasBook && book !== null) {
      const validId = typeof book?.id === 'string' && book.id;
      const validTitle = typeof book?.title === 'string' && book.title.trim() && book.title.trim().length <= MAX_BOOK_TITLE;
      if (!validId && !validTitle) {
        return NextResponse.json({ ok: false, error: `اسم الكتاب مطلوب، حتى ${MAX_BOOK_TITLE} حرفاً` }, { status: 400 });
      }
    }
    if (title === undefined && !hasTarget && !hasBook && description === undefined && bookTitle === undefined) {
      return NextResponse.json({ ok: false, error: 'لا شيء لتعديله' }, { status: 400 });
    }

    await connectDB();

    const unit = await Unit.findById(id);
    if (!unit) {
      return NextResponse.json({ ok: false, error: 'الوحدة غير موجودة' }, { status: 404 });
    }

    if (title !== undefined) unit.title = title.trim();
    if (hasTarget) unit.targetLessons = target;
    if (typeof description === 'string') unit.description = description.trim() || null;
    if (typeof bookTitle   === 'string') unit.bookTitle   = bookTitle.trim()   || null;

    await unit.save();

    let books = { bookId: unit.bookId ?? null, bookTitle: unit.bookTitle ?? null, bookOrder: unit.bookOrder ?? null };
    if (hasBook) {
      const result = await setUnitBook(id, book && (book.id ? { id: book.id } : { title: book.title }));
      if (result.error) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      books = result;
    }

    return NextResponse.json({
      ok: true,
      unit: {
        _id:           unit._id,
        contentId:     unit.contentId,
        title:         unit.title,
        targetLessons: unit.targetLessons ?? null,
        ...books,
      },
    });
  } catch (err) {
    console.error('[PATCH /api/admin/curriculum/units/[id]]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
