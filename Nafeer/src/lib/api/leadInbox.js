import { connectDB }   from '@/lib/db';
import { Lesson }      from '@/lib/models/Lesson';
import { Contributor } from '@/lib/models/Contributor';
import { REAL_PEOPLE } from '@/lib/SeedActor';
import { getReviewQueue } from '@/lib/api/reviewQueue';
import { isOwnWork, lessonOwnerId } from '@/lib/credits';

// ─── The lead's inbox (docs/team-leads.md, L1) ────────────────────────────────
// What needs the lead in their subject, in one request:
//   queue    — waiting for review, oldest first; items the lead wrote or owns
//              are marked `mine` and go to the co-lead or the owner instead
//   returned — sent back with comments and not resent yet
//   stale    — drafts nobody has touched for STALE_DAYS
//
// Three reads plus one name lookup, and only when the page is opened: no
// polling, no counts on every editor page.

export const STALE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

// Authorship ids are used for `mine`, then left out of the response.
function forViewer({ createdBy, ownerId, ...item }, viewerId) {
  return { ...item, mine: isOwnWork({ createdBy, ownerId }, viewerId) };
}

export async function getLeadInbox(subjectId, viewerId, now = new Date()) {
  await connectDB();
  const cutoff = new Date(now.getTime() - STALE_DAYS * DAY_MS);

  const [queue, drafts] = await Promise.all([
    getReviewQueue(subjectId),
    Lesson.find({
      subjectId,
      status: 'draft',
      $or: [{ 'reviewState.returned': true }, { updatedAt: { $lt: cutoff } }],
    })
      .select('contentId title updatedAt reviewState createdBy ownerId')
      .sort({ updatedAt: 1 })
      .limit(100)
      .lean(),
  ]);

  const ownerIds = [...new Set(drafts.map(lessonOwnerId).filter(Boolean))];
  const people = ownerIds.length
    ? await Contributor.find({ _id: { $in: ownerIds }, ...REAL_PEOPLE }).select('name').lean()
    : [];
  const nameOf = Object.fromEntries(people.map((p) => [String(p._id), p.name]));

  const draftRow = (d) => ({
    contentId: d.contentId,
    title:     d.title,
    owner:     nameOf[lessonOwnerId(d)] || null,
    mine:      isOwnWork(d, viewerId),
    updatedAt: d.updatedAt,
  });

  const lessons = [...queue.lessons]
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
    .map((i) => forViewer(i, viewerId));
  const others = [
    ...queue.concepts.map((i) => ({ ...i, type: 'concept' })),
    ...queue.feedItems.map((i) => ({ ...i, type: 'feedItem' })),
    ...queue.questions.map((i) => ({ ...i, type: 'question' })),
  ].map((i) => forViewer(i, viewerId));

  return {
    subjectId,
    staleDays: STALE_DAYS,
    queue: { lessons, others, total: queue.total },
    returned: drafts
      .filter((d) => d.reviewState?.returned)
      .map((d) => ({ ...draftRow(d), round: d.reviewState.round || 0, returnedAt: d.reviewState.returnedAt || null })),
    stale: drafts.filter((d) => !d.reviewState?.returned).map(draftRow),
  };
}
