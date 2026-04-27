import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { Lesson }          from '@/lib/models/Lesson';
import { Unit }            from '@/lib/models/Unit';
import { initialChangelog } from '@/lib/models/versioning';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';

// ─── POST /api/admin/curriculum/lessons ───────────────────────────────────────
// Create a new skeleton lesson inside an existing unit.
// Body: { subjectId, unitContentId, contentId, title, order, estimatedMinutes? }
//
// contentId must be unique — the client generates it following the convention:
//   SUBJECTID_UNITCONTENTID_L{order}
// We validate uniqueness server-side and reject duplicates.

export async function POST(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { subjectId, unitContentId, contentId, title, order, estimatedMinutes = 15 } = body;

    if (!subjectId || !unitContentId || !contentId || !title || order == null) {
      return NextResponse.json(
        { ok: false, error: 'الحقول المطلوبة: subjectId, unitContentId, contentId, title, order' },
        { status: 400 }
      );
    }
    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ ok: false, error: 'العنوان مطلوب' }, { status: 400 });
    }

    await connectDB();

    // Verify the unit exists
    const unit = await Unit.findOne({ contentId: unitContentId, subjectId }).lean();
    if (!unit) {
      return NextResponse.json(
        { ok: false, error: 'الوحدة غير موجودة في قاعدة البيانات' },
        { status: 404 }
      );
    }

    // Reject duplicate contentId
    const existing = await Lesson.findOne({ contentId }).lean();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: `contentId مستخدم مسبقاً: ${contentId}` },
        { status: 409 }
      );
    }

    const actorId = await ensureSystemSeedContributor();

    const lesson = await Lesson.create({
      contentId,
      subjectId,
      unitContentId,
      title:            title.trim(),
      order,
      estimatedMinutes,
      status:           'approved',  
      changelog:        initialChangelog(actorId, `درس جديد أضافه المشرف`),
      createdBy:        actorId,
    });

    return NextResponse.json({
      ok: true,
      lesson: {
        _id:              lesson._id,
        contentId:        lesson.contentId,
        unitContentId:    lesson.unitContentId,
        title:            lesson.title,
        groupTitle:       lesson.groupTitle || null,
        estimatedMinutes: lesson.estimatedMinutes,
        order:            lesson.order,
        status:           lesson.status,
        summary:          null,
      },
    });
  } catch (err) {
    console.error('[POST /api/admin/curriculum/lessons]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}