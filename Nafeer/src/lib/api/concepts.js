import { connectDB } from '@/lib/db';
import { Concept } from '@/lib/models/Concept';
import { Tag } from '@/lib/models/Tag';
import { applyVersionBump, initialChangelog } from '@/lib/models/versioning';

// ─── getConceptsForSubject ────────────────────────────────────────────────────
export async function getConceptsForSubject(subjectId, options = {}) {
  await connectDB();
  const query = { subjectId };
  if (options.status) query.status = options.status;
  if (options.type)   query.type   = options.type;
  return Concept.find(query).sort({ createdAt: 1 }).lean();
}

// ─── createConcept ────────────────────────────────────────────────────────────
export async function createConcept(data, contributorId) {
  await connectDB();
  return Concept.create({
    ...data,
    createdBy: contributorId,
    changelog: initialChangelog(contributorId),
  });
}

// ─── updateConcept ────────────────────────────────────────────────────────────
export async function updateConcept(contentId, updates, contributorId, note = '', skipRedraft = false) {
  await connectDB();
  const current = await Concept.findOne({ contentId });
  if (!current) return null;

  const { updates: bumpedUpdates } = applyVersionBump(
    { ...updates }, current, contributorId, 'edited', note, '', skipRedraft
  );

  return Concept.findOneAndUpdate(
    { contentId },
    { $set: bumpedUpdates },
    { new: true, runValidators: true }
  ).lean();
}

// ─── updateConceptStatus ──────────────────────────────────────────────────────
export async function updateConceptStatus(contentId, newStatus, contributorId, note = '') {
  await connectDB();

  const current = await Concept.findOne({ contentId });
  if (!current) return null;

  const newVersion = (current.version || 1) + 1;
  const entry = {
    version:   newVersion,
    action:    newStatus === 'approved' ? 'approved' : newStatus === 'review' ? 'reviewed' : 'edited',
    by:        contributorId,
    note,
    timestamp: new Date(),
  };

  return Concept.findOneAndUpdate(
    { contentId },
    {
      $set: {
        status:     newStatus,
        version:    newVersion,
        updatedBy:  contributorId,
        reviewedBy: newStatus === 'approved' ? contributorId : current.reviewedBy,
      },
      $push: { changelog: { $each: [entry], $slice: -10 } },
    },
    { new: true }
  ).lean();
}

// ─── deleteConcept ────────────────────────────────────────────────────────────
// Hard delete — only if status is 'draft'. Approved concepts must be archived.
export async function deleteConcept(contentId) {
  await connectDB();
  const concept = await Concept.findOne({ contentId });
  if (!concept) return null;
  if (concept.status === 'approved') {
    throw new Error('لا يمكن حذف مفهوم معتمد. استخدم الأرشفة بدلاً من الحذف.');
  }
  return Concept.deleteOne({ contentId });
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function getTagsForSubject(subjectId) {
  await connectDB();
  return Tag.find({ subjectId }).sort({ createdAt: 1 }).lean();
}

export async function createTag(data, contributorId) {
  await connectDB();
  return Tag.create({
    ...data,
    createdBy: contributorId,
    changelog: initialChangelog(contributorId),
  });
}

export async function updateTag(contentId, updates, contributorId) {
  await connectDB();
  const current = await Tag.findOne({ contentId });
  if (!current) return null;
  const bumpedUpdates = applyVersionBump({ ...updates }, current, contributorId, 'edited');
  return Tag.findOneAndUpdate({ contentId }, { $set: bumpedUpdates }, { new: true }).lean();
}

export async function deleteTag(contentId) {
  await connectDB();
  return Tag.deleteOne({ contentId });
}