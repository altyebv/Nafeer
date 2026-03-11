import { connectDB } from '@/lib/db';
import { Lesson } from '@/lib/models/Lesson';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { applyVersionBump, initialChangelog } from '@/lib/models/versioning';

// ─── getLessonsForSubject ─────────────────────────────────────────────────────
export async function getLessonsForSubject(subjectId, options = {}) {
  await connectDB();

  const query = { subjectId };
  if (options.unitContentId) query.unitContentId = options.unitContentId;
  if (options.status)        query.status        = options.status;

  return Lesson.find(query).sort({ order: 1 }).lean();
}

// ─── getLesson ────────────────────────────────────────────────────────────────
export async function getLesson(contentId) {
  await connectDB();
  return Lesson.findOne({ contentId }).lean();
}

// ─── getLessonWithContent ─────────────────────────────────────────────────────
// Returns a lesson + all its sections + all blocks, assembled for the editor.
export async function getLessonWithContent(contentId) {
  await connectDB();

  const lesson = await Lesson.findOne({ contentId }).lean();
  if (!lesson) return null;

  const sections = await Section.find({ lessonContentId: contentId })
    .sort({ order: 1 })
    .lean();

  const sectionIds = sections.map((s) => s.contentId);

  const blocks = sectionIds.length
    ? await Block.find({ sectionContentId: { $in: sectionIds } })
        .sort({ order: 1 })
        .lean()
    : [];

  const blocksBySection = blocks.reduce((acc, b) => {
    if (!acc[b.sectionContentId]) acc[b.sectionContentId] = [];
    acc[b.sectionContentId].push(b);
    return acc;
  }, {});

  return {
    ...lesson,
    sections: sections.map((s) => ({
      ...s,
      blocks: blocksBySection[s.contentId] || [],
    })),
  };
}

// ─── updateLesson ─────────────────────────────────────────────────────────────
// Updates a lesson with versioning. Returns the updated document.
export async function updateLesson(contentId, updates, contributorId, note = '') {
  await connectDB();

  const current = await Lesson.findOne({ contentId });
  if (!current) return null;

  const bumpedUpdates = applyVersionBump(
    { ...updates },
    current,
    contributorId,
    'edited',
    note
  );

  return Lesson.findOneAndUpdate(
    { contentId },
    { $set: bumpedUpdates },
    { new: true, runValidators: true }
  ).lean();
}

// ─── updateLessonStatus ───────────────────────────────────────────────────────
// Change status (submit for review, approve, archive).
// Admins can approve; contributors can submit to review.
export async function updateLessonStatus(contentId, newStatus, contributorId, note = '') {
  await connectDB();

  const current = await Lesson.findOne({ contentId });
  if (!current) return null;

  const action = newStatus === 'approved' ? 'approved'
               : newStatus === 'review'   ? 'reviewed'
               : newStatus === 'archived' ? 'archived'
               : 'edited';

  const newVersion = (current.version || 1) + 1;
  const entry = {
    version:   newVersion,
    action,
    by:        contributorId,
    note,
    timestamp: new Date(),
  };

  return Lesson.findOneAndUpdate(
    { contentId },
    {
      $set: {
        status:     newStatus,
        version:    newVersion,
        updatedBy:  contributorId,
        reviewedBy: newStatus === 'approved' ? contributorId : current.reviewedBy,
      },
      $push: {
        changelog: {
          $each:  [entry],
          $slice: -10,
        },
      },
    },
    { new: true }
  ).lean();
}