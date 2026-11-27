import { Question } from '@/lib/models/Question';
import { FeedItem } from '@/lib/models/FeedItem';
import { Concept } from '@/lib/models/Concept';

// ─── A lesson's questions and feed cards ──────────────────────────────────────
// They are reviewed with their lesson: the reviewer reads them there, and
// approving the lesson approves them. One exception: a card cannot be approved
// before its concept, so it waits and the reviewer is told why.
// Questions and cards with no lesson are reviewed on their own, as before.

const PENDING = { $in: ['draft', 'review'] };

/** Why each of these cards cannot be approved yet: Map contentId → reason. */
export async function heldCards(cards) {
  const held = new Map();
  if (!cards.length) return held;
  const ids = [...new Set(cards.map((c) => c.conceptContentId).filter(Boolean))];
  const concepts = ids.length
    ? await Concept.find({ contentId: { $in: ids } }).select('contentId titleAr status +published').lean()
    : [];
  const byId = new Map(concepts.map((c) => [c.contentId, c]));
  for (const card of cards) {
    const concept = byId.get(card.conceptContentId);
    if (!concept) held.set(card.contentId, 'لا مفهوم لها');
    // One being edited still ships as last approved, so its cards can too.
    else if (concept.status !== 'approved' && !concept.published) held.set(card.contentId, `مفهومها «${concept.titleAr}» لم يُعتمد بعد`);
  }
  return held;
}

/** Called once the lesson is approved. */
export async function approveLessonItems(lessonContentId, reviewerId) {
  const pending = { lessonContentId, status: PENDING };
  const decision = { $set: { status: 'approved', reviewedBy: reviewerId, reviewedAt: new Date() }, $inc: { version: 1 } };

  await Question.updateMany(pending, decision);

  const cards = await FeedItem.find(pending).select('contentId conceptContentId').lean();
  const held = await heldCards(cards);
  const ready = cards.filter((c) => !held.has(c.contentId)).map((c) => c.contentId);
  if (ready.length) await FeedItem.updateMany({ ...pending, contentId: { $in: ready } }, decision);
}
