// ─── Lesson review: returning with comments ───────────────────────────────────
// The rules of the review round trip, kept free of the database so they can be
// tested on their own. The writes live in lib/api/reviewQueue.js (return) and
// lib/api/lessons.js (resubmit, resolve).
//
// The round trip:
//   contributor sends   status draft → review           reviewState.submittedAt
//   reviewer returns    status review → draft            reviewState.returned, round+1
//                       + one review comment per point, each anchored to where
//                         it applies (the lesson, its details, a section, a
//                         block, a question or a feed card)
//   contributor fixes   resolves each comment (a note's `resolved` flag)
//   contributor resends allowed only once every comment of the round is resolved
//
// `status` itself keeps its four values, so nothing downstream — the Android
// export, the review queue, the version history — has to learn a new one.
// "Returned" is reviewState.returned on a draft.

export const ANCHOR_KINDS = ['lesson', 'meta', 'section', 'block', 'question', 'feed'];

export const MAX_RETURN_COMMENTS = 20;
export const MAX_COMMENT_LENGTH  = 1000;

export class ReviewError extends Error {
  constructor(message, code = 'INVALID') {
    super(message);
    this.name = 'ReviewError';
    this.code = code;
  }
}

/**
 * Normalise and validate a reviewer's comments against what the lesson
 * actually contains. An anchor that names a section, block, question or feed
 * card from another lesson is refused, so a comment can never point at content
 * the contributor cannot open.
 *
 * @param comments [{ text, anchor?: { kind, id?, label? } }]
 * @param owned    { section: Set, block: Set, question: Set, feed: Set } of contentIds
 */
export function validateReturnComments(comments, owned) {
  if (!Array.isArray(comments)) throw new ReviewError('التعليقات يجب أن تكون قائمة');
  if (comments.length > MAX_RETURN_COMMENTS) {
    throw new ReviewError(`الحد الأقصى ${MAX_RETURN_COMMENTS} تعليقاً في الإرجاع الواحد`);
  }

  return comments.map((c, i) => {
    const text = typeof c?.text === 'string' ? c.text.trim() : '';
    if (!text) throw new ReviewError(`التعليق ${i + 1} فارغ`);
    if (text.length > MAX_COMMENT_LENGTH) throw new ReviewError(`التعليق ${i + 1} طويل جداً (الحد ${MAX_COMMENT_LENGTH} حرف)`);

    const kind = c.anchor?.kind || 'lesson';
    if (!ANCHOR_KINDS.includes(kind)) throw new ReviewError(`موضع التعليق ${i + 1} غير صالح`);

    let id = null;
    if (kind !== 'lesson' && kind !== 'meta') {
      id = typeof c.anchor?.id === 'string' ? c.anchor.id : '';
      if (!id || !owned[kind]?.has(id)) {
        throw new ReviewError(`التعليق ${i + 1} يشير إلى محتوى ليس في هذا الدرس`);
      }
    }

    const label = typeof c.anchor?.label === 'string' ? c.anchor.label.trim().slice(0, 120) : '';
    return { text, anchor: { kind, id, label } };
  });
}

/** The comments of the current round that still need the contributor. */
export function openReviewComments(lesson) {
  const round = lesson?.reviewState?.round || 0;
  return (lesson?.notes || []).filter(
    (n) => n.noteType === 'review_feedback' && !n.resolved && (n.round ?? 0) === round && round > 0,
  );
}

/**
 * Whether a lesson may move to `review`. Throws ReviewError('OPEN_COMMENTS')
 * while comments from the reviewer's last return are unresolved.
 */
export function assertCanSubmit(lesson) {
  const open = openReviewComments(lesson);
  if (open.length) {
    const err = new ReviewError(
      `بقي ${open.length} من ملاحظات المراجِع دون معالجة — عالجها ثم أعد الإرسال`,
      'OPEN_COMMENTS',
    );
    err.open = open.length;
    throw err;
  }
}
