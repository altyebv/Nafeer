import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { Lesson }          from '@/lib/models/Lesson';

// ─── PATCH /api/admin/curriculum/lessons/[id] ─────────────────────────────────
// Update a lesson's title, groupTitle, and optionally estimatedMinutes.
// [id] is the Mongo _id of the lesson.
//
// Body: { title?, groupTitle?, estimatedMinutes? }
// At least one of title or groupTitle must be present.

export async function PATCH(request, { params }) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, groupTitle, estimatedMinutes } = body;

    const hasTitle      = title      !== undefined;
    const hasGroupTitle = groupTitle !== undefined;

    if (!hasTitle && !hasGroupTitle) {
      return NextResponse.json({ ok: false, error: 'title أو groupTitle مطلوب' }, { status: 400 });
    }
    if (hasTitle && (!title || typeof title !== 'string' || !title.trim())) {
      return NextResponse.json({ ok: false, error: 'العنوان لا يمكن أن يكون فارغاً' }, { status: 400 });
    }

    await connectDB();

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return NextResponse.json({ ok: false, error: 'الدرس غير موجود' }, { status: 404 });
    }

    if (hasTitle)      lesson.title      = title.trim();
    if (hasGroupTitle) lesson.groupTitle = groupTitle.trim() || null;
    if (typeof estimatedMinutes === 'number') lesson.estimatedMinutes = estimatedMinutes;

    await lesson.save();

    return NextResponse.json({
      ok: true,
      lesson: {
        _id:              lesson._id,
        contentId:        lesson.contentId,
        title:            lesson.title,
        groupTitle:       lesson.groupTitle,
        estimatedMinutes: lesson.estimatedMinutes,
      },
    });
  } catch (err) {
    console.error('[PATCH /api/admin/curriculum/lessons/[id]]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}