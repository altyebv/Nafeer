import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { Unit }            from '@/lib/models/Unit';
import { Subject }         from '@/lib/models/Subject';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { initialChangelog } from '@/lib/models/versioning';

// ─── POST /api/admin/curriculum/units ─────────────────────────────────────────
// Create a new unit inside an existing subject.
// Used by the CurriculumSection "إضافة وحدة" flow.
//
// Body: { subjectId, title, order?, description? }
//
// contentId is auto-generated: {SUBJECTID}_U{order}
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

    await connectDB();

    // Verify the subject exists
    const subject = await Subject.findOne({ subjectId }).select('subjectId').lean();
    if (!subject) {
      return NextResponse.json(
        { ok: false, error: 'المادة غير موجودة في قاعدة البيانات' },
        { status: 404 }
      );
    }

    // Compute the next order by counting existing units
    const existingUnits = await Unit.find({ subjectId }).select('order contentId').lean();
    const nextOrder = existingUnits.length + 1;

    // Derive a unique contentId: {SUBJECTID}_U{nextOrder}
    // If taken (e.g. from a previous delete), keep incrementing
    let orderCandidate = nextOrder;
    let contentId = `${subjectId}_U${orderCandidate}`;
    const existingIds = new Set(existingUnits.map((u) => u.contentId));
    while (existingIds.has(contentId)) {
      orderCandidate++;
      contentId = `${subjectId}_U${orderCandidate}`;
    }

    const actorId = await ensureSystemSeedContributor();

    const unit = await Unit.create({
      contentId,
      subjectId,
      title:       title.trim(),
      order:       nextOrder,
      description: description?.trim() || null,
      createdBy:   actorId,
      changelog:   initialChangelog(actorId, 'unit created via admin curriculum panel'),
    });

    return NextResponse.json({
      ok: true,
      unit: {
        _id:         unit._id,
        contentId:   unit.contentId,
        title:       unit.title,
        order:       unit.order,
        description: unit.description || null,
        bookId:      null,
        bookTitle:   null,
        bookOrder:   null,
        lessons:     [],
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