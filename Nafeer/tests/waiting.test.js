import { describe, it, expect } from 'vitest';
import { waitingItems, noticeFields, APPROVED_DAYS } from '@/lib/waiting';
import { fromServerLesson, mergeLesson } from '@/lib/editorSync';

const NOW = new Date('2026-11-27T12:00:00Z').getTime();
const daysAgo = (n) => new Date(NOW - n * 86_400_000).toISOString();

const lesson = (id, extra = {}) => ({ id, title: id, owner: 'me', atlasStatus: 'draft', comments: [], ...extra });
const note = (extra = {}) => ({ id: 'n', authorId: 'sara', authorName: 'سارة', type: 'comment', round: 0, at: daysAgo(1), ...extra });
const run = (...lessons) => waitingItems(lessons, 'me', NOW);

describe('waitingItems', () => {
  it('lists a returned lesson with the open points of this round only', () => {
    const [item] = run(lesson('L', {
      reviewState: { returned: true, round: 2, returnedAt: daysAgo(1), returnedByName: 'قائد' },
      comments: [note({ type: 'review_feedback', round: 2 }), note({ type: 'review_feedback', round: 1 })],
    }));
    expect(item).toMatchObject({ kind: 'returned', count: 1, by: 'قائد' });
  });

  it('drops the returned item once the lesson is sent again', () => {
    expect(run(lesson('L', { atlasStatus: 'review', reviewState: { returned: true, round: 1 } }))).toEqual([]);
  });

  it('counts other people\'s comments and flags, not the member\'s own', () => {
    const [item] = run(lesson('L', { comments: [
      note({ authorId: 'me' }),
      note({ at: daysAgo(3), type: 'flag' }),
      note({ authorId: null, authorName: 'المالك', at: daysAgo(1) }),
    ] }));
    expect(item).toMatchObject({ kind: 'reply', count: 2, by: 'المالك', flag: true });
  });

  it(`keeps an approval for ${APPROVED_DAYS} days`, () => {
    const approved = (at) => lesson('L', { atlasStatus: 'approved', reviewedAt: at });
    expect(run(approved(daysAgo(1)))).toHaveLength(1);
    expect(run(approved(daysAgo(APPROVED_DAYS + 1)))).toEqual([]);
    expect(run(approved(null))).toEqual([]);
  });

  it('lists nothing from other people\'s lessons, or with no member', () => {
    const theirs = lesson('L', { owner: 'sara', comments: [note({ authorId: 'x' })] });
    expect(run(theirs)).toEqual([]);
    expect(waitingItems([lesson('L', { owner: undefined })], null, NOW)).toEqual([]);
  });

  it('orders by group, then oldest first', () => {
    const items = run(
      lesson('ok', { atlasStatus: 'approved', reviewedAt: daysAgo(1) }),
      lesson('new', { reviewState: { returned: true, round: 1, returnedAt: daysAgo(1) } }),
      lesson('old', { reviewState: { returned: true, round: 1, returnedAt: daysAgo(5) } }),
      lesson('talk', { comments: [note()] }),
    );
    expect(items.map((i) => i.lessonId)).toEqual(['old', 'new', 'talk', 'ok']);
  });
});

describe('comments reach the store', () => {
  const doc = {
    contentId: 'L', title: 'L', status: 'draft', version: 3, reviewedAt: null,
    notes: [{ _id: 'a', authorName: 'سارة', noteType: 'comment' }, { _id: 'b', resolved: true }],
  };

  it('keeps the unresolved ones', () => {
    expect(noticeFields(doc).comments.map((n) => n.id)).toEqual(['a']);
    expect(fromServerLesson(doc).comments).toHaveLength(1);
  });

  it('takes the server\'s even over a lesson with unsaved edits', () => {
    const local = { id: 'L', title: 'edited', comments: [], _dirty: true, _v: 3 };
    expect(mergeLesson(local, fromServerLesson(doc)).comments).toHaveLength(1);
  });

  it('leaves them alone when the document carries none', () => {
    const { notes, ...bare } = doc;
    expect(fromServerLesson(bare)).not.toHaveProperty('comments');
  });
});
