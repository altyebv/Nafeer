import { connectDB }   from '@/lib/db';
import { Lesson }      from '@/lib/models/Lesson';
import { Contributor } from '@/lib/models/Contributor';
import { REAL_PEOPLE } from '@/lib/SeedActor';
import { getReviewQueue } from '@/lib/api/reviewQueue';
import { isOwnWork, lessonOwnerId } from '@/lib/credits';
import { openImageRequests } from '@/lib/imageRequests';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';

// ─── The lead's inbox (docs/team-leads.md, L1) ────────────────────────────────
// What needs the lead in their subject, in one request:
//   queue    — waiting for review, oldest first; items the lead wrote or owns
//              are marked `mine` and go to the co-lead or the owner instead
//   returned — sent back with comments and not resent yet
//   stale    — someone's draft with no writing for STALE_DAYS. Unclaimed
//              curriculum lessons are nobody's, so they are never stale.
//
// Three reads plus one name lookup, and only when the page is opened: no
// polling, no counts on every editor page.

export const STALE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

// Saving sections and blocks does not touch the lesson's own date, so a lesson
// being written would look abandoned. The latest of the lesson, its claim, its
// sections and its blocks. Two reads, only for the candidates.
async function lastWorked(lessons) {
  const latest = new Map();
  const note = (id, ...dates) => {
    const t = Math.max(latest.get(id)?.getTime() || 0, ...dates.map((d) => (d ? new Date(d).getTime() : 0)));
    latest.set(id, new Date(t));
  };
  for (const l of lessons) note(l.contentId, l.updatedAt, l.claimedAt);
  if (!lessons.length) return latest;

  const sections = await Section.find({ lessonContentId: { $in: lessons.map((l) => l.contentId) } })
    .select('contentId lessonContentId updatedAt').lean();
  const lessonOf = new Map(sections.map((s) => [s.contentId, s.lessonContentId]));
  for (const s of sections) note(s.lessonContentId, s.updatedAt);
  if (sections.length) {
    const blocks = await Block.find({ sectionContentId: { $in: [...lessonOf.keys()] } })
      .select('sectionContentId updatedAt').lean();
    for (const b of blocks) note(lessonOf.get(b.sectionContentId), b.updatedAt);
  }
  return latest;
}

// Authorship ids are used for `mine`, then left out of the response.
function forViewer({ createdBy, ownerId, ...item }, viewerId) {
  return { ...item, mine: isOwnWork({ createdBy, ownerId }, viewerId) };
}

export async function getLeadInbox(subjectId, viewerId, now = new Date()) {
  await connectDB();
  const cutoff = new Date(now.getTime() - STALE_DAYS * DAY_MS);

  const [queue, imageRequests, drafts] = await Promise.all([
    getReviewQueue(subjectId),
    openImageRequests(subjectId),
    Lesson.find({
      subjectId,
      status: 'draft',
      $or: [{ 'reviewState.returned': true }, { updatedAt: { $lt: cutoff } }],
    })
      .select('contentId title updatedAt claimedAt reviewState createdBy ownerId')
      .sort({ updatedAt: 1 })
      .lean(),
  ]);

  const ownerIds = [...new Set(drafts.map(lessonOwnerId).filter(Boolean))];
  const people = ownerIds.length
    ? await Contributor.find({ _id: { $in: ownerIds }, ...REAL_PEOPLE }).select('name').lean()
    : [];
  const nameOf = Object.fromEntries(people.map((p) => [String(p._id), p.name]));

  const quiet = drafts.filter((d) => !d.reviewState?.returned && lessonOwnerId(d) in nameOf);
  const worked = await lastWorked(quiet);
  const stale = quiet
    .map((d) => ({ ...d, updatedAt: worked.get(d.contentId) }))
    .filter((d) => new Date(d.updatedAt) < cutoff)
    .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
    .slice(0, 100);

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
    stale: stale.map(draftRow),
    // The owner uploads; the lead sees what their team is waiting for.
    imageRequests: imageRequests.map(({ metadata, ...r }) => r),
  };
}
