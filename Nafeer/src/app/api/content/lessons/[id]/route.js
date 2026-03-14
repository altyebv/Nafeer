import { requireContributor, ok, err } from '@/lib/api/guard';
import { getLessonWithContent, updateLesson, updateLessonStatus } from '@/lib/api/lessons';
import { connectDB } from '@/lib/db';
import { Lesson } from '@/lib/models/Lesson';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';

// GET /api/content/lessons/[id]
// Returns lesson + sections + blocks (full content for editor)
export async function GET(request, { params }) {
  try {
    await requireContributor();

    const lesson = await getLessonWithContent((await params).id);
    if (!lesson) return err('الدرس غير موجود', 404);

    return ok(lesson);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/lessons/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// PUT /api/content/lessons/[id]
// Body: { title?, estimatedMinutes?, summary?, note? }
// Bumps version, resets to draft if was approved.
export async function PUT(request, { params }) {
  try {
    const user = await requireContributor();
    const body = await request.json();
    const { note, ...updates } = body;

    // Whitelist updatable fields
    const allowed = ['title', 'estimatedMinutes', 'summary'];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const lesson = await updateLesson((await params).id, safeUpdates, user.id, note || '');
    if (!lesson) return err('الدرس غير موجود', 404);

    return ok(lesson);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PUT /api/content/lessons/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// PATCH /api/content/lessons/[id]/status
// Body: { status: 'draft'|'review'|'approved'|'archived', note? }
export async function PATCH(request, { params }) {
  try {
    const user = await requireContributor();
    const { status, note } = await request.json();

    if (!['draft', 'review', 'approved', 'archived'].includes(status)) {
      return err('حالة غير صالحة');
    }

    // Only admins can approve
    if (status === 'approved' && user.role !== 'admin') {
      return err('الاعتماد متاح للمشرفين فقط', 403);
    }

    const lesson = await updateLessonStatus((await params).id, status, user.id, note || '');
    if (!lesson) return err('الدرس غير موجود', 404);

    return ok(lesson);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PATCH /api/content/lessons/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// DELETE /api/content/lessons/[id]
// Only drafts can be hard-deleted. Approved lessons must be archived.
export async function DELETE(request, { params }) {
  try {
    const user = await requireContributor();

    await connectDB();
    const lesson = await Lesson.findOne({ contentId: (await params).id });
    if (!lesson) return err('الدرس غير موجود', 404);

    if (lesson.status === 'approved') {
      return err('لا يمكن حذف درس معتمد. استخدم الأرشفة بدلاً من الحذف.');
    }

    // Cascade: delete sections + blocks
    const sections = await Section.find({ lessonContentId: (await params).id }).select('contentId').lean();
    const sectionIds = sections.map((s) => s.contentId);

    await Promise.all([
      Lesson.deleteOne({ contentId: (await params).id }),
      Section.deleteMany({ lessonContentId: (await params).id }),
      sectionIds.length ? Block.deleteMany({ sectionContentId: { $in: sectionIds } }) : null,
    ]);

    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/lessons/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}