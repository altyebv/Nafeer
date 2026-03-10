import { connectDB } from '@/lib/db';
import { FeedItem } from '@/lib/models/FeedItem';
import { applyVersionBump, initialChangelog } from '@/lib/models/versioning';

// ─── getFeedItemsForSubject ───────────────────────────────────────────────────
export async function getFeedItemsForSubject(subjectId, options = {}) {
  await connectDB();
  const query = { subjectId };
  if (options.conceptContentId) query.conceptContentId = options.conceptContentId;
  if (options.lessonContentId)  query.lessonContentId  = options.lessonContentId;
  if (options.status)           query.status           = options.status;
  return FeedItem.find(query).sort({ order: 1, createdAt: 1 }).lean();
}

// ─── createFeedItem ───────────────────────────────────────────────────────────
export async function createFeedItem(data, contributorId) {
  await connectDB();
  return FeedItem.create({
    ...data,
    createdBy: contributorId,
    changelog: initialChangelog(contributorId),
  });
}

// ─── updateFeedItem ───────────────────────────────────────────────────────────
export async function updateFeedItem(contentId, updates, contributorId, note = '') {
  await connectDB();

  const current = await FeedItem.findOne({ contentId });
  if (!current) return null;

  const bumpedUpdates = applyVersionBump({ ...updates }, current, contributorId, 'edited', note);

  return FeedItem.findOneAndUpdate(
    { contentId },
    { $set: bumpedUpdates },
    { new: true, runValidators: true }
  ).lean();
}

// ─── updateFeedItemStatus ─────────────────────────────────────────────────────
export async function updateFeedItemStatus(contentId, newStatus, contributorId, note = '') {
  await connectDB();

  const current = await FeedItem.findOne({ contentId });
  if (!current) return null;

  const newVersion = (current.version || 1) + 1;
  const entry = {
    version:   newVersion,
    action:    newStatus === 'approved' ? 'approved' : newStatus === 'review' ? 'reviewed' : 'edited',
    by:        contributorId,
    note,
    timestamp: new Date(),
  };

  return FeedItem.findOneAndUpdate(
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

// ─── deleteFeedItem ───────────────────────────────────────────────────────────
export async function deleteFeedItem(contentId) {
  await connectDB();
  return FeedItem.deleteOne({ contentId });
}