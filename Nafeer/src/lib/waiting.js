// ─── «ينتظرك»: what is waiting for a member ───────────────────────────────────
// Built from the lessons the editor already loaded (the subject GET carries
// each lesson's comments), so it costs no request. Nothing is marked read: an
// item leaves when the thing is done. A pause has its own banner, and appeal
// answers arrive as announcements.
//
// Pure, so it can be tested. Shown by components/editor/pages/DashboardWaiting.jsx.

/** An approval stays on the list this long. */
export const APPROVED_DAYS = 7;
const DAY_MS = 86_400_000;

/** Order of the groups. */
export const WAITING_KINDS = ['returned', 'reply', 'approved'];

/** The unresolved notes of a lesson document, trimmed to what the list needs. */
export const openNotes = (notes) => (notes || [])
  .filter((n) => !n.resolved)
  .map((n) => ({
    id:         String(n._id),
    authorId:   n.authorId ? String(n.authorId) : null,
    authorName: n.authorName || '',
    type:       n.noteType || 'comment',
    round:      n.round ?? 0,
    at:         n.createdAt ?? null,
  }));

/** The fields of a server lesson the list reads, as the store keeps them. */
export const noticeFields = (l) => ({
  reviewedAt: l.reviewedAt ?? null,
  comments:   openNotes(l.notes),
});

const time = (value) => (value ? new Date(value).getTime() || 0 : 0);

/**
 * `lessons` are the store's lessons, `me` the member's id. Returns
 * [{ kind, lessonId, title, at, count, by, flag }], by group, oldest first.
 */
export function waitingItems(lessons, me, now = Date.now()) {
  if (!me) return [];
  const items = [];
  for (const l of lessons) {
    if (l.owner !== me) continue;
    const add = (kind, extra) => items.push({ kind, lessonId: l.id, title: l.title, ...extra });
    const notes = l.comments || [];

    if (l.atlasStatus === 'draft' && l.reviewState?.returned) {
      const round = l.reviewState.round || 0;
      add('returned', {
        at:    l.reviewState.returnedAt || null,
        count: notes.filter((n) => n.type === 'review_feedback' && n.round === round).length,
        by:    l.reviewState.returnedByName || '',
      });
    }

    // Comments and flags from other people. The reviewer's points are the
    // returned item above.
    const replies = notes.filter((n) => n.type !== 'review_feedback' && n.authorId !== me);
    if (replies.length) {
      const latest = replies.reduce((a, b) => (time(b.at) > time(a.at) ? b : a));
      add('reply', {
        at:    latest.at,
        count: replies.length,
        by:    latest.authorName,
        flag:  replies.some((n) => n.type === 'flag'),
      });
    }

    if (l.atlasStatus === 'approved' && now - time(l.reviewedAt) < APPROVED_DAYS * DAY_MS) {
      add('approved', { at: l.reviewedAt });
    }
  }
  return items.sort((a, b) =>
    WAITING_KINDS.indexOf(a.kind) - WAITING_KINDS.indexOf(b.kind) || time(a.at) - time(b.at));
}
