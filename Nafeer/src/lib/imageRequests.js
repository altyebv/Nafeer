import { Lesson } from '@/lib/models/Lesson';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';

// ─── Image requests ───────────────────────────────────────────────────────────
// Only the platform owner uploads. A contributor leaves an image block empty and
// describes what belongs there (`metadata.imageRequest.note`); the owner uploads
// and fills the block from the dashboard. A lesson with an empty image block
// cannot be approved.

export const IMAGE_BLOCKS = ['IMAGE', 'GIF', 'INTERACTIVE_IMAGE'];
const EMPTY = { type: { $in: IMAGE_BLOCKS }, content: { $in: ['', null] } };

export const MISSING_IMAGE = 'في الدرس صورة لم تُرفع بعد — تُرفع أو يُحذف عنصرها قبل الاعتماد';

/** Whether any image block of the lesson is still empty. */
export async function hasMissingImage(lessonContentId) {
  const sections = await Section.find({ lessonContentId }).select('contentId').lean();
  if (!sections.length) return false;
  return !!(await Block.exists({ ...EMPTY, sectionContentId: { $in: sections.map((s) => s.contentId) } }));
}

/**
 * Open requests, oldest first, for one subject or (null) all of them:
 * [{ blockId, lessonId, subjectId, title, note, metadata, at }].
 */
export async function openImageRequests(subjectId = null) {
  const blocks = await Block.find({
    ...EMPTY, ...(subjectId && { subjectId }), 'metadata.imageRequest.note': { $exists: true, $ne: '' },
  }).select('contentId subjectId sectionContentId metadata updatedAt').sort({ updatedAt: 1 }).limit(100).lean();
  if (!blocks.length) return [];

  const sections = await Section.find({ contentId: { $in: blocks.map((b) => b.sectionContentId) } })
    .select('contentId lessonContentId').lean();
  const lessonOf = new Map(sections.map((s) => [s.contentId, s.lessonContentId]));
  const lessons = await Lesson.find({ contentId: { $in: [...new Set(lessonOf.values())] } })
    .select('contentId title status').lean();
  const byId = new Map(lessons.map((l) => [l.contentId, l]));

  return blocks.flatMap((b) => {
    const lesson = byId.get(lessonOf.get(b.sectionContentId));
    if (!lesson || lesson.status === 'archived') return [];
    return [{
      blockId: b.contentId, lessonId: lesson.contentId, subjectId: b.subjectId, title: lesson.title,
      note: String(b.metadata.imageRequest.note), metadata: b.metadata, at: b.updatedAt,
    }];
  });
}
