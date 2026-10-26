import { NextResponse }    from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { renameBook, MAX_BOOK_TITLE } from '@/lib/api/subject';

// ─── PATCH /api/admin/curriculum/books ────────────────────────────────────────
// Renames a book: every unit in it carries the new title (lib/api/subject.js).
// Body: { subjectId, bookId, title }. Admin only.

export async function PATCH(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    const { subjectId, bookId, title } = await request.json();
    if (!subjectId || !bookId) {
      return NextResponse.json({ ok: false, error: 'subjectId و bookId مطلوبان' }, { status: 400 });
    }
    if (typeof title !== 'string' || !title.trim() || title.trim().length > MAX_BOOK_TITLE) {
      return NextResponse.json({ ok: false, error: `اسم الكتاب مطلوب، حتى ${MAX_BOOK_TITLE} حرفاً` }, { status: 400 });
    }

    const units = await renameBook(subjectId, bookId, title);
    if (!units) return NextResponse.json({ ok: false, error: 'الكتاب غير موجود' }, { status: 404 });
    return NextResponse.json({ ok: true, data: { bookId, bookTitle: title.trim(), units } });
  } catch (err) {
    console.error('[PATCH /api/admin/curriculum/books]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
