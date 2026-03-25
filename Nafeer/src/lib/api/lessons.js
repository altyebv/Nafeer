import { connectDB } from '@/lib/db';
import { Lesson } from '@/lib/models/Lesson';
import { Contributor } from '@/lib/models/Contributor';
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
// Contributor names are populated (denormalized) for the attribution bar.
export async function getLessonWithContent(contentId) {
  await connectDB();

  const lesson = await Lesson.findOne({ contentId }).lean();
  if (!lesson) return null;

  // ── Populate contributor names ────────────────────────────────────────────
  const rawIds = [lesson.createdBy, lesson.updatedBy, lesson.reviewedBy].filter(Boolean);
  let nameMap = {};
  if (rawIds.length) {
    const contributors = await Contributor.find({ _id: { $in: rawIds } })
      .select('_id name avatarUrl')
      .lean();
    nameMap = Object.fromEntries(
      contributors.map((c) => [
        c._id.toString(),
        { name: c.name, avatarUrl: c.avatarUrl || null },
      ])
    );
  }

  const resolve = (id) => (id ? (nameMap[id.toString()] ?? null) : null);

  // ── Sections + Blocks ─────────────────────────────────────────────────────
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
    // Attribution display data (not stored in lesson, resolved here)
    attribution: {
      createdBy:  resolve(lesson.createdBy),
      updatedBy:  resolve(lesson.updatedBy),
      reviewedBy: resolve(lesson.reviewedBy),
    },
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

  const setPayload = {
    status:     newStatus,
    version:    newVersion,
    updatedBy:  contributorId,
    reviewedBy: newStatus === 'approved' ? contributorId : current.reviewedBy,
  };

  if (newStatus === 'approved') {
    setPayload.reviewedAt = new Date();
  }

  return Lesson.findOneAndUpdate(
    { contentId },
    {
      $set: setPayload,
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

// ─── Note helpers ─────────────────────────────────────────────────────────────

// addLessonNote — push a new note subdocument and increment notesCount
export async function addLessonNote(contentId, { text, authorId, authorName, authorRole, noteType }) {
  await connectDB();

  const note = {
    text,
    authorId:   authorId || null,
    authorName: authorName || '',
    authorRole: authorRole || 'contributor',
    noteType:   noteType || 'comment',
    resolved:   false,
    createdAt:  new Date(),
  };

  const lesson = await Lesson.findOneAndUpdate(
    { contentId },
    {
      $push: { notes: note },
      $inc:  { notesCount: 1 },
    },
    { new: true }
  ).lean();

  if (!lesson) return null;
  // Return the note that was just added (last in array)
  return lesson.notes[lesson.notes.length - 1];
}

// updateLessonNote — resolve/unresolve or edit text (only own note or admin)
export async function updateLessonNote(contentId, noteId, updates, requesterId) {
  await connectDB();

  const lesson = await Lesson.findOne({ contentId });
  if (!lesson) return null;

  const note = lesson.notes.id(noteId);
  if (!note) return null;

  // Only the note author or an admin-role contributor can edit
  const isOwn   = note.authorId && note.authorId.toString() === requesterId;
  // authorId is null for dashboard-admin notes — treat as read-only from contributor side
  // (resolved update is always allowed so any contributor can mark resolved)
  if ('text' in updates && !isOwn) {
    throw new Error('FORBIDDEN');
  }

  if ('resolved' in updates) note.resolved = updates.resolved;
  if ('text' in updates)     note.text     = updates.text.trim();

  await lesson.save();
  return note.toObject();
}

// deleteLessonNote — hard delete, only own notes (or admin-role)
export async function deleteLessonNote(contentId, noteId, requesterId, requesterRole) {
  await connectDB();

  const lesson = await Lesson.findOne({ contentId });
  if (!lesson) return null;

  const note = lesson.notes.id(noteId);
  if (!note) return null;

  const isOwn   = note.authorId && note.authorId.toString() === requesterId;
  const isAdmin = requesterRole === 'admin';

  if (!isOwn && !isAdmin) throw new Error('FORBIDDEN');

  note.deleteOne();
  lesson.notesCount = Math.max(0, (lesson.notesCount || 1) - 1);
  await lesson.save();
  return { deleted: noteId };
}
