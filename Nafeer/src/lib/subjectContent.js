import { connectDB } from '@/lib/db';
import { Subject } from '@/lib/models/Subject';
import { Unit } from '@/lib/models/Unit';
import { Lesson } from '@/lib/models/Lesson';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { Concept } from '@/lib/models/Concept';
import { Tag } from '@/lib/models/Tag';
import { FeedItem } from '@/lib/models/FeedItem';
import { Question } from '@/lib/models/Question';
import { Exam } from '@/lib/models/Exam';
import { LessonHistory } from '@/lib/models/LessonHistory';
import { lessonOwnerId } from '@/lib/credits';
import { unclaimedOwners } from '@/lib/lessonAccess';
import { reconcileAuthoredStatsLater } from '@/lib/authoredStats';

// ─── A subject's content ──────────────────────────────────────────────────────
// The one definition of "delete a subject" and of "written content"
// (docs/subject-lifecycle.md S1). Every path that removes a subject's content —
// the admin wipe, deleting a subject, restoring from the published file — goes
// through deleteSubjectContent, so none of them leaves orphans behind.

/** Collections that hold a subject's content, keyed by `subjectId`. */
export const SUBJECT_CONTENT_MODELS = {
  Subject, Unit, Lesson, Section, Block, Concept, Tag, FeedItem, Question, Exam,
};

/**
 * Models keyed by `subjectId` that outlive the subject's content on purpose:
 * records about people and decisions, and uploads whose files live in storage.
 * tests/subjectContent.test.js fails on a model with `subjectId` in neither list.
 */
export const SUBJECT_KEPT_MODELS = {
  Appeal:          'a member\'s appeal and the owner\'s answer',
  AuditEvent:      'append-only record of lead actions',
  ContributorRole: 'recruiting configuration, not content',
  Media:           'files live in storage; removing them is a separate step',
  Release:         'history of what was shipped to the app',
  SubjectGuide:    'the lead\'s handbook, written by a person',
};

/**
 * Deletes every content document of a subject. Lesson history goes too unless
 * `keepHistory` — a restore brings the same lessons back and keeps their trail.
 * With a `session` it runs inside that transaction, one delete at a time (a
 * transaction's operations can't run in parallel). Returns the number deleted
 * per model.
 */
export async function deleteSubjectContent(subjectId, { keepHistory = false, session = null } = {}) {
  if (!subjectId) throw new Error('[deleteSubjectContent] subjectId is required');
  await connectDB();

  const lessonIds = keepHistory
    ? []
    : (await Lesson.find({ subjectId }).select('contentId').session(session).lean()).map((l) => l.contentId);

  const names = Object.keys(SUBJECT_CONTENT_MODELS);
  const ops = [
    ...names.map((name) => () => SUBJECT_CONTENT_MODELS[name].deleteMany({ subjectId }, { session })),
    () => (lessonIds.length
      ? LessonHistory.deleteMany({ lessonContentId: { $in: lessonIds } }, { session })
      : { deletedCount: 0 }),
  ];
  const results = [];
  if (session) for (const op of ops) results.push(await op());
  else results.push(...await Promise.all(ops.map((op) => op())));
  reconcileAuthoredStatsLater();

  const deleted = Object.fromEntries(names.map((name, i) => [name, results[i].deletedCount ?? 0]));
  deleted.LessonHistory = results[names.length].deletedCount ?? 0;
  return deleted;
}

/**
 * Whether a lesson holds someone's work: it has sections, a real person owns
 * it, or it has been saved past its first version. `sectionLessonIds` and
 * `unclaimed` come from writtenContent, which reads them once per subject.
 */
export function hasWrittenContent(lesson, { sectionLessonIds, unclaimed }) {
  if (sectionLessonIds.has(lesson.contentId)) return true;
  const owner = lessonOwnerId(lesson);
  if (owner && !unclaimed.has(owner)) return true;
  return (lesson.version ?? 1) > 1;
}

/**
 * What in a subject is someone's work. `lessons` is the set of written lesson
 * ids; `other` counts concepts, questions, feed items, exams and tags, which
 * the catalog never creates, so every one of them was written by a person.
 * Three reads plus one count per collection.
 */
export async function writtenContent(subjectId) {
  await connectDB();

  const [lessons, sectionLessonIds, ...counts] = await Promise.all([
    Lesson.find({ subjectId }).select('contentId createdBy ownerId version').lean(),
    Section.distinct('lessonContentId', { subjectId }),
    Concept.countDocuments({ subjectId }),
    Question.countDocuments({ subjectId }),
    FeedItem.countDocuments({ subjectId }),
    Exam.countDocuments({ subjectId }),
    Tag.countDocuments({ subjectId }),
  ]);

  const unclaimed = await unclaimedOwners(lessons.map(lessonOwnerId));
  const ctx = { sectionLessonIds: new Set(sectionLessonIds), unclaimed };
  const written = new Set(lessons.filter((l) => hasWrittenContent(l, ctx)).map((l) => l.contentId));

  return { lessons: written, other: counts.reduce((a, b) => a + b, 0) };
}

/** Whether nothing in the subject is anyone's work. */
export function isEmptyOfWork({ lessons, other }) {
  return lessons.size === 0 && other === 0;
}
