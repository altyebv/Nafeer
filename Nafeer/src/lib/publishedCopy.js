import { Lesson } from '@/lib/models/Lesson';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { Question } from '@/lib/models/Question';
import { PublishedCopy } from '@/lib/models/PublishedCopy';

// ─── Editing an approved lesson ───────────────────────────────────────────────
// Students must only get what a reviewer approved, and must not lose a lesson
// while its next version is being written. So the first change to an approved
// lesson (its details, sections, blocks or checkpoint questions):
//   1. saves the approved version (PublishedCopy),
//   2. moves the lesson back to draft with `revising: true`.
// Releases ship the copy for every revising lesson (lib/publishSubject.js).
// Approving the lesson clears `revising`; archiving it retires the copy too.
//
// The platform owner's content edits skip this: the owner is the approver.

/** Saves the approved lesson as it is now. Call before changing it. */
export async function savePublishedCopy(lesson) {
  const lessonContentId = lesson.contentId;
  const approvedVersion = lesson.version || 1;
  const sections = await Section.find({ lessonContentId, status: { $ne: 'archived' } }).lean();
  const sectionIds = sections.map((s) => s.contentId);
  const [blocks, questions] = sectionIds.length
    ? await Promise.all([
        Block.find({ sectionContentId: { $in: sectionIds }, status: { $ne: 'archived' } }).lean(),
        Question.find({ sectionContentId: { $in: sectionIds }, isCheckpoint: true }).lean(),
      ])
    : [[], []];
  // Comments, history and credits are never exported.
  const { notes, changelog, credits, ...exported } = lesson;

  await PublishedCopy.deleteMany({ lessonContentId, approvedVersion: { $ne: approvedVersion } });
  try {
    // First write wins: a second request arriving mid-change must not replace
    // the copy with what the first one has already altered.
    await PublishedCopy.updateOne(
      { lessonContentId, approvedVersion },
      { $setOnInsert: { subjectId: lesson.subjectId, lesson: exported, sections, blocks, questions } },
      { upsert: true },
    );
  } catch (e) {
    if (e.code !== 11000) throw e;
  }
}

export async function dropPublishedCopy(lessonContentId) {
  await PublishedCopy.deleteMany({ lessonContentId });
}

/**
 * Before a content write: moves any approved lesson among `lessons` (as
 * returned by assertCanEditLessons) back to draft, keeping its approved
 * version. Returns the ids moved. No query when none is approved.
 */
export async function reopenForRevision(lessons = []) {
  const reopened = [];
  for (const { contentId, status } of lessons) {
    if (status !== 'approved') continue;
    const lesson = await Lesson.findOne({ contentId, status: 'approved' }).lean();
    if (!lesson) continue; // another request got there first
    await savePublishedCopy(lesson);
    await Lesson.updateOne({ contentId, status: 'approved' }, { $set: { status: 'draft', revising: true } });
    reopened.push(contentId);
  }
  return reopened;
}

/**
 * The same for a question write. Only checkpoint questions reopen the lesson:
 * they ship without an approval of their own.
 */
export async function reopenForCheckpoint(lessons, questionContentId, updates = {}) {
  if (!lessons?.some((l) => l.status === 'approved')) return [];
  const checkpoint = updates.isCheckpoint
    || !!(await Question.exists({ contentId: questionContentId, isCheckpoint: true }));
  return checkpoint ? reopenForRevision(lessons) : [];
}

/** The copies that stand in for this subject's lessons being revised. */
export async function revisingCopies(subjectId) {
  const revising = await Lesson.find({ subjectId, revising: true, status: { $in: ['draft', 'review'] } })
    .select('contentId').lean();
  if (!revising.length) return [];
  return PublishedCopy.find({ lessonContentId: { $in: revising.map((l) => l.contentId) } }).lean();
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

/**
 * The content a release ships: what is live, with each revising lesson's
 * approved copy in place of its unreviewed sections, blocks and checkpoints.
 * Pure.
 */
export function mergePublished({ lessons, sections, blocks, questions }, copies = []) {
  if (!copies.length) return { lessons, sections, blocks, questions };

  const latest = new Map();
  for (const c of [...copies].sort((a, b) => a.approvedVersion - b.approvedVersion)) {
    latest.set(c.lessonContentId, c);
  }
  const kept = [...latest.values()];
  const copied = (key) => kept.flatMap((c) => c[key] || []);
  const idsOf = (docs) => new Set(docs.map((d) => d.contentId));

  const copiedSections = copied('sections');
  const copiedBlocks = copied('blocks');
  const copiedQuestions = copied('questions');

  const sectionIds = idsOf(copiedSections);
  const blockIds = idsOf(copiedBlocks);
  const questionIds = idsOf(copiedQuestions);
  // Every section of a revising lesson, as it is now or as it was.
  const held = new Set([...idsOf(sections.filter((s) => latest.has(s.lessonContentId))), ...sectionIds]);

  return {
    lessons: [...lessons.filter((l) => !latest.has(l.contentId)), ...kept.map((c) => c.lesson)].sort(byOrder),
    sections: [
      ...sections.filter((s) => !latest.has(s.lessonContentId) && !sectionIds.has(s.contentId)),
      ...copiedSections,
    ].sort(byOrder),
    blocks: [
      ...blocks.filter((b) => !held.has(b.sectionContentId) && !blockIds.has(b.contentId)),
      ...copiedBlocks,
    ].sort(byOrder),
    questions: [
      ...questions.filter((q) => !questionIds.has(q.contentId) && !(q.isCheckpoint && held.has(q.sectionContentId))),
      ...copiedQuestions,
    ],
  };
}
