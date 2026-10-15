import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/trackStat', () => ({ trackStat: vi.fn() }));
for (const [path, name] of [
  ['@/lib/models/Lesson', 'Lesson'], ['@/lib/models/Section', 'Section'], ['@/lib/models/Block', 'Block'],
  ['@/lib/models/Question', 'Question'], ['@/lib/models/FeedItem', 'FeedItem'], ['@/lib/models/Concept', 'Concept'],
]) {
  vi.doMock(path, async () => ({ [name]: (await import('./helpers/fakeModel.js')).fakeModel() }));
}

const { validateReturnComments, openReviewComments, assertCanSubmit, ReviewError } = await import('@/lib/review');
const { returnLesson } = await import('@/lib/api/reviewQueue');
const { Lesson }   = await import('@/lib/models/Lesson');
const { Section }  = await import('@/lib/models/Section');
const { Block }    = await import('@/lib/models/Block');
const { Question } = await import('@/lib/models/Question');

const query = (result) => {
  const q = { select: () => q, lean: () => q, then: (res, rej) => Promise.resolve(result).then(res, rej) };
  return q;
};

const owned = {
  section: new Set(['sec_1']), block: new Set(['blk_1']),
  question: new Set(['q_1']), feed: new Set(['f_1']),
};

describe('validateReturnComments', () => {
  it('normalises text and anchors, defaulting to the whole lesson', () => {
    expect(validateReturnComments([
      { text: '  أضف مصدر الخريطة  ', anchor: { kind: 'section', id: 'sec_1', label: 'القسم 2' } },
      { text: 'الملخص قصير جداً' },
    ], owned)).toEqual([
      { text: 'أضف مصدر الخريطة', anchor: { kind: 'section', id: 'sec_1', label: 'القسم 2' } },
      { text: 'الملخص قصير جداً', anchor: { kind: 'lesson', id: null, label: '' } },
    ]);
  });

  it('refuses an anchor pointing at content from another lesson', () => {
    expect(() => validateReturnComments([{ text: 'x', anchor: { kind: 'question', id: 'q_other' } }], owned))
      .toThrow(/ليس في هذا الدرس/);
  });

  it('refuses empty text, unknown kinds and oversized batches', () => {
    expect(() => validateReturnComments([{ text: '   ' }], owned)).toThrow(ReviewError);
    expect(() => validateReturnComments([{ text: 'x', anchor: { kind: 'unit' } }], owned)).toThrow(/غير صالح/);
    expect(() => validateReturnComments(Array.from({ length: 21 }, () => ({ text: 'x' })), owned)).toThrow(/الحد الأقصى/);
  });
});

describe('resubmitting', () => {
  const lesson = (notes, round = 1) => ({ reviewState: { round, returned: true }, notes });

  it('blocks while a comment of the current round is open', () => {
    const l = lesson([{ noteType: 'review_feedback', resolved: false, round: 1 }]);
    expect(openReviewComments(l)).toHaveLength(1);
    try { assertCanSubmit(l); throw new Error('should have thrown'); }
    catch (e) { expect(e.code).toBe('OPEN_COMMENTS'); expect(e.open).toBe(1); }
  });

  it('ignores resolved comments, older rounds and ordinary notes', () => {
    const l = lesson([
      { noteType: 'review_feedback', resolved: true, round: 2 },
      { noteType: 'review_feedback', resolved: false, round: 1 },
      { noteType: 'comment', resolved: false, round: 0 },
    ], 2);
    expect(() => assertCanSubmit(l)).not.toThrow();
  });

  it('never blocks a lesson that was never returned', () => {
    expect(() => assertCanSubmit({ notes: [], reviewState: undefined })).not.toThrow();
  });
});

describe('returnLesson', () => {
  beforeEach(() => {
    Lesson.findOneAndUpdate.mockReset();
    Section.find.mockReturnValue(query([{ contentId: 'sec_1' }]));
    Block.find.mockReturnValue(query([{ contentId: 'blk_1' }]));
    Question.find.mockReturnValue(query([{ contentId: 'q_1' }]));
  });

  it('returns a lesson in review for a new round, with anchored comments', async () => {
    Lesson.seed([{ contentId: 'GEO_L1', status: 'review', version: 4, reviewState: { round: 1 }, changelog: [] }]);
    Lesson.findOneAndUpdate.mockReturnValue(query({ contentId: 'GEO_L1' }));

    const res = await returnLesson('GEO_L1', {
      summary: 'عمل جيد، بقيت نقطتان',
      comments: [{ text: 'خياران صحيحان', anchor: { kind: 'question', id: 'q_1', label: 'س 3' } }],
    }, { id: 'admin_1', name: 'أحمد' });

    expect(res).toEqual({ contentId: 'GEO_L1', status: 'draft', round: 2, comments: 2 });
    const [filter, update] = Lesson.findOneAndUpdate.mock.calls[0];
    // Only if nobody changed it since it was read.
    expect(filter).toEqual({ contentId: 'GEO_L1', status: 'review', version: 4 });
    expect(update.$set).toMatchObject({ status: 'draft', version: 5, reviewState: { returned: true, round: 2, returnedByName: 'أحمد' } });
    expect(update.$push.notes.$each).toHaveLength(2);
    expect(update.$push.notes.$each[1]).toMatchObject({
      noteType: 'review_feedback', round: 2, resolved: false, authorRole: 'admin',
      anchor: { kind: 'question', id: 'q_1', label: 'س 3' },
    });
    expect(update.$inc).toEqual({ notesCount: 2 });
  });

  it('refuses a lesson that is not in review', async () => {
    Lesson.seed([{ contentId: 'GEO_L2', status: 'draft', version: 1 }]);
    await expect(returnLesson('GEO_L2', {}, { id: 'a' })).rejects.toMatchObject({ code: 'NOT_IN_REVIEW' });
  });

  it('reports a conflict when the lesson changed between read and write', async () => {
    Lesson.seed([{ contentId: 'GEO_L3', status: 'review', version: 2 }]);
    Lesson.findOneAndUpdate.mockReturnValue(query(null));
    await expect(returnLesson('GEO_L3', { comments: [{ text: 'x' }] }, { id: 'a' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
