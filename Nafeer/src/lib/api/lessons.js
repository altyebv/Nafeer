import { connectDB } from '@/lib/db';
import { Lesson } from '@/lib/models/Lesson';
import { Contributor } from '@/lib/models/Contributor';
import { LessonHistory } from '@/lib/models/LessonHistory';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { applyVersionBump, initialChangelog } from '@/lib/models/versioning';

// ─── writeHistory ─────────────────────────────────────────────────────────────
// Fire-and-forget helper. Never throws — history failure must not block the edit.
async function writeHistory(lessonContentId, {
  version, action, versionLabel = '', byId, byName, note = '', diff = null,
}) {
  try {
    await LessonHistory.create({
      lessonContentId,
      version,
      action,
      versionLabel,
      byId:   byId   || null,
      byName: byName || '',
      note,
      diff,
      timestamp: new Date(),
    });
  } catch (e) {
    console.warn('[LessonHistory write failed]', e.message);
  }
}

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
// Returns lesson + sections + blocks for the editor.
// Populates contributor names for the AttributionBar.
export async function getLessonWithContent(contentId) {
  await connectDB();

  const lesson = await Lesson.findOne({ contentId }).lean();
  if (!lesson) return null;

  // Populate contributor names (denormalized at read time, no ref overhead)
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
// Updates lesson with versioning + writes a LessonHistory record with diff.
export async function updateLesson(
  contentId, updates, contributorId, note = '', versionLabel = '', contributorName = ''
) {
  await connectDB();

  const current = await Lesson.findOne({ contentId });
  if (!current) return null;

  const { updates: bumpedUpdates, diff } = applyVersionBump(
    { ...updates },
    current,
    contributorId,
    'edited',
    note,
    versionLabel
  );

  const updated = await Lesson.findOneAndUpdate(
    { contentId },
    { $set: bumpedUpdates },
    { new: true, runValidators: true }
  ).lean();

  // Write history async — don't await
  writeHistory(contentId, {
    version:      bumpedUpdates.version,
    action:       'edited',
    versionLabel,
    byId:         contributorId,
    byName:       contributorName,
    note,
    diff,
  });

  return updated;
}

// ─── updateLessonStatus ───────────────────────────────────────────────────────
// Status transitions: submit for review, approve, archive.
export async function updateLessonStatus(
  contentId, newStatus, contributorId, note = '', versionLabel = '', contributorName = ''
) {
  await connectDB();

  const current = await Lesson.findOne({ contentId });
  if (!current) return null;

  const action =
    newStatus === 'approved' ? 'approved' :
    newStatus === 'review'   ? 'reviewed' :
    newStatus === 'archived' ? 'archived' : 'edited';

  const newVersion = (current.version || 1) + 1;

  const entry = {
    version:      newVersion,
    action,
    by:           contributorId,
    note,
    versionLabel: versionLabel || '',
    timestamp:    new Date(),
  };

  const existing = current.changelog || [];

  const setPayload = {
    status:     newStatus,
    version:    newVersion,
    updatedBy:  contributorId,
    changelog:  [...existing.slice(-4), entry],
    reviewedBy: newStatus === 'approved' ? contributorId : current.reviewedBy,
  };

  if (newStatus === 'approved') {
    setPayload.reviewedAt = new Date();
  }

  const updated = await Lesson.findOneAndUpdate(
    { contentId },
    { $set: setPayload },
    { new: true }
  ).lean();

  writeHistory(contentId, {
    version:      newVersion,
    action,
    versionLabel,
    byId:         contributorId,
    byName:       contributorName,
    note,
    diff:         null,
  });

  return updated;
}

// ─── getLessonHistory ─────────────────────────────────────────────────────────
// Returns the full history for a lesson, newest first.
// Limit defaults to 50 — more than enough for any lesson's lifetime.
export async function getLessonHistory(contentId, limit = 50) {
  await connectDB();
  return LessonHistory.find({ lessonContentId: contentId })
    .sort({ version: -1 })
    .limit(limit)
    .lean();
}

// ─── Note helpers ─────────────────────────────────────────────────────────────

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
  return lesson.notes[lesson.notes.length - 1];
}

export async function updateLessonNote(contentId, noteId, updates, requesterId) {
  await connectDB();

  const lesson = await Lesson.findOne({ contentId });
  if (!lesson) return null;

  const note = lesson.notes.id(noteId);
  if (!note) return null;

  const isOwn = note.authorId && note.authorId.toString() === requesterId;
  if ('text' in updates && !isOwn) throw new Error('FORBIDDEN');

  if ('resolved' in updates) note.resolved = updates.resolved;
  if ('text' in updates)     note.text     = updates.text.trim();

  await lesson.save();
  return note.toObject();
}

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
