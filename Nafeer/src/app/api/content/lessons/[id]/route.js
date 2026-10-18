import { after } from 'next/server';
import { requireContentAccess, assertInSubject, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { getLessonWithContent, updateLesson, updateLessonStatus } from '@/lib/api/lessons';
import { connectDB } from '@/lib/db';
import { Lesson } from '@/lib/models/Lesson';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { deleteCheckpointQuestionsForSections } from '@/lib/api/content';
import { authorsOf, recountAuthoredLater } from '@/lib/authoredStats';
import { VersionConflict, withEditorNames } from '@/lib/api/versionCheck';
import { ReviewError } from '@/lib/review';

// GET /api/content/lessons/[id]
// Returns lesson + sections + blocks (full content for editor), plus
// `recentlyOpenedBy` when someone else opened it in the last half hour.
const RECENT_OPEN_MS  = 30 * 60 * 1000;
const STAMP_EVERY_MS  = 5 * 60 * 1000;

export async function GET(request, { params }) {
  try {
    const { user } = await requireContentAccess(Lesson, (await params).id);
    const id = (await params).id;

    const lesson = await getLessonWithContent(id);
    if (!lesson) return err('الدرس غير موجود', 404);

    const me   = String(user.id);
    const now  = Date.now();
    const prev = lesson.openedBy?.id ? { id: lesson.openedBy.id, at: lesson.openedAt } : null;
    const recentlyOpenedBy = prev && prev.id !== me && now - new Date(prev.at).getTime() < RECENT_OPEN_MS
      ? { name: lesson.openedBy.name || '', at: prev.at }
      : null;

    // Stamp this open after responding. Skipped when this same person
    // stamped it a few minutes ago, so reloads cost nothing.
    if (!(prev && prev.id === me && now - new Date(prev.at).getTime() < STAMP_EVERY_MS)) {
      after(() =>
        Lesson.updateOne(
          { contentId: id },
          { $set: { openedBy: { id: me, name: user.name || '' }, openedAt: new Date(now) } },
          { timestamps: false }
        ).catch((e) => console.warn('[lesson open stamp]', e.message))
      );
    }

    const { openedBy, openedAt, ...rest } = lesson;
    return ok({ ...rest, recentlyOpenedBy });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/lessons/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// PUT /api/content/lessons/[id]
// Body: { title?, estimatedMinutes?, summary?, note?, versionLabel? }
// Bumps version, resets to draft if was approved.
export async function PUT(request, { params }) {
  try {
    const { user } = await requireContentAccess(Lesson, (await params).id);
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const body = await request.json();
    const { note, versionLabel, baseVersion, ...updates } = body;

    // Whitelist updatable fields
    const allowed = ['title', 'estimatedMinutes', 'summary', 'parentLesson', 'variationType',
       'variationNote', 'metadata', 'groupId', 'groupTitle', 'groupMetadata'];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    await assertInSubject(user, Lesson, [safeUpdates.parentLesson]);

    const lesson = await updateLesson(
      (await params).id,
      safeUpdates,
      actorId,
      note || '',
      versionLabel || '',
      user.name || '',
      false,
      baseVersion ?? null
    );
    if (!lesson) return err('الدرس غير موجود', 404);

    return ok(lesson);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof VersionConflict) {
      const [conflict] = await withEditorNames([e.toJSON()]);
      return Response.json({ ok: false, conflict }, { status: 409 });
    }
    console.error('[PUT /api/content/lessons/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// PATCH /api/content/lessons/[id]
// Body: { status: 'draft'|'review'|'approved'|'archived', note?, versionLabel? }
export async function PATCH(request, { params }) {
  try {
    const { user } = await requireContentAccess(Lesson, (await params).id);
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const { status, note, versionLabel } = await request.json();

    if (!['draft', 'review', 'approved', 'archived'].includes(status)) {
      return err('حالة غير صالحة');
    }

    // Only admins can approve
    if (status === 'approved' && user.role !== 'admin') {
      return err('الاعتماد متاح للمشرفين فقط', 403);
    }

    const lesson = await updateLessonStatus(
      (await params).id, status, actorId, note || '', versionLabel || '', user.name || ''
    );
    if (!lesson) return err('الدرس غير موجود', 404);

    return ok(lesson);
  } catch (e) {
    if (e instanceof Response) return e;
    // Resubmitting with the reviewer's comments still open (lib/review.js).
    if (e instanceof ReviewError) {
      return Response.json({ ok: false, error: e.message, code: e.code, open: e.open ?? 0 }, { status: 409 });
    }
    console.error('[PATCH /api/content/lessons/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// DELETE /api/content/lessons/[id]
// Only drafts can be hard-deleted. Approved lessons must be archived.
export async function DELETE(request, { params }) {
  try {
    const { user } = await requireContentAccess(Lesson, (await params).id);

    await connectDB();
    const lesson = await Lesson.findOne({ contentId: (await params).id });
    if (!lesson) return err('الدرس غير موجود', 404);

    if (lesson.status === 'approved') {
      return err('لا يمكن حذف درس معتمد. استخدم الأرشفة بدلاً من الحذف.');
    }

    // Cascade: delete sections + blocks
    const sections = await Section.find({ lessonContentId: (await params).id }).select('contentId').lean();
    const sectionIds = sections.map((s) => s.contentId);
    const blockAuthors = sectionIds.length
      ? await authorsOf('Block', { sectionContentId: { $in: sectionIds } })
      : [];

    await Promise.all([
      Lesson.deleteOne({ contentId: (await params).id }),
      Section.deleteMany({ lessonContentId: (await params).id }),
      deleteCheckpointQuestionsForSections(sectionIds),
      sectionIds.length ? Block.deleteMany({ sectionContentId: { $in: sectionIds } }) : null,
    ]);
    recountAuthoredLater([lesson.createdBy, ...blockAuthors]);

    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/lessons/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}
