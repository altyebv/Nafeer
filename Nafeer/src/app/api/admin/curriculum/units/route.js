import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { Subject }         from '@/lib/models/Subject';
import { createUnit }      from '@/lib/api/subject';
import { parseTarget }     from '@/lib/unitTarget';

// ─── POST /api/admin/curriculum/units ─────────────────────────────────────────
// Create a new unit inside an existing subject.
// Used by the subject page's «وحدة» button.
//
// Body: { subjectId, title, targetLessons?, description? }
//
// contentId is auto-generated: {SUBJECTID}_U{order} (lib/api/subject.js createUnit).
// If a unit with that contentId already exists (race / retry), returns 409.
//
// Admin only.

export async function POST(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { subjectId, title, description = null } = body;

    if (!subjectId || typeof subjectId !== 'string') {
      return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ ok: false, error: 'العنوان مطلوب' }, { status: 400 });
    }
    const target = parseTarget(body.targetLessons);
    if (target === undefined) {
      return NextResponse.json({ ok: false, error: 'عدد الدروس المستهدف غير صالح' }, { status: 400 });
    }

    await connectDB();

    // Verify the subject exists
    const subject = await Subject.findOne({ subjectId }).select('subjectId').lean();
    if (!subject) {
      return NextResponse.json(
        { ok: false, error: 'المادة غير موجودة في قاعدة البيانات' },
        { status: 404 }
      );
    }

    const unit = await createUnit(subjectId, { title, description, targetLessons: target });

    return NextResponse.json({
      ok: true,
      unit: {
        _id:           unit._id,
        contentId:     unit.contentId,
        title:         unit.title,
        order:         unit.order,
        description:   unit.description || null,
        targetLessons: unit.targetLessons ?? null,
        bookId:        null,
        bookTitle:     null,
        bookOrder:     null,
        lessons:       [],
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { ok: false, error: 'وحدة بهذا المعرّف موجودة بالفعل — أعد المحاولة' },
        { status: 409 }
      );
    }
    console.error('[POST /api/admin/curriculum/units]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
