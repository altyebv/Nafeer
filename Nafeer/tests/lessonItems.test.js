import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Questions and cards are approved with their lesson ───────────────────────

const db = vi.hoisted(() => ({ cards: [], concepts: [], shipped: false, writes: [], lessonWrites: [] }));
const rows = (list) => ({ select: () => ({ lean: async () => list }) });

vi.mock('@/lib/models/Question', () => ({
  Question: {
    updateMany: vi.fn(async (filter, update) => db.writes.push({ model: 'Question', filter, update })),
    exists: vi.fn(async () => (db.shipped ? { _id: 'x' } : null)),
  },
}));
vi.mock('@/lib/models/FeedItem', () => ({
  FeedItem: {
    find: () => rows(db.cards),
    updateMany: vi.fn(async (filter, update) => db.writes.push({ model: 'FeedItem', filter, update })),
  },
}));
vi.mock('@/lib/models/Concept', () => ({ Concept: { find: () => rows(db.concepts) } }));
vi.mock('@/lib/models/Lesson', () => ({
  Lesson: {
    updateOne: vi.fn(async (filter, update) => { db.lessonWrites.push(update); return { matchedCount: 1 }; }),
    findOne: () => ({ lean: async () => null }),
  },
}));
vi.mock('@/lib/models/Section', () => ({ Section: {} }));
vi.mock('@/lib/models/Block', () => ({ Block: {} }));
vi.mock('@/lib/models/PublishedCopy', () => ({ PublishedCopy: {} }));

const { approveLessonItems, heldCards } = await import('@/lib/lessonItems');
const { reopenForItem, reopenForNewItem } = await import('@/lib/publishedCopy');
const { Question } = await import('@/lib/models/Question');

beforeEach(() => {
  vi.clearAllMocks();
  db.cards = [{ contentId: 'F1', conceptContentId: 'ok' }, { contentId: 'F2', conceptContentId: 'waiting' }];
  db.concepts = [{ contentId: 'ok', status: 'approved' }, { contentId: 'waiting', titleAr: 'التبخر', status: 'draft' }];
  db.shipped = false;
  db.writes = [];
  db.lessonWrites = [];
});

describe('approveLessonItems', () => {
  it('approves the pending questions, and the cards whose concept is approved', async () => {
    await approveLessonItems('L', 'lead');
    const [questions, cards] = db.writes;
    expect(questions.filter).toEqual({ lessonContentId: 'L', status: { $in: ['draft', 'review'] } });
    expect(questions.update.$set).toMatchObject({ status: 'approved', reviewedBy: 'lead' });
    expect(cards.filter.contentId).toEqual({ $in: ['F1'] });
  });

  it('says which concept holds a card back', async () => {
    const held = await heldCards([...db.cards, { contentId: 'F3' }]);
    expect(held.has('F1')).toBe(false);
    expect(held.get('F2')).toContain('التبخر');
    expect(held.has('F3')).toBe(true);
  });
});

describe('changing a lesson\'s question or card', () => {
  const inReview = [{ contentId: 'L', status: 'review' }];
  const approved = [{ contentId: 'L', status: 'approved' }];

  it('marks a lesson in review for any change or addition', async () => {
    await reopenForItem(inReview, Question, 'Q');
    await reopenForNewItem(inReview);
    expect(db.lessonWrites).toEqual([{ $inc: { contentRev: 1 } }, { $inc: { contentRev: 1 } }]);
    expect(Question.exists).not.toHaveBeenCalled();
  });

  it('leaves an approved lesson alone for a new item, or an item students do not have', async () => {
    await reopenForNewItem(approved);
    await expect(reopenForItem(approved, Question, 'Q')).resolves.toEqual([]);
    expect(db.lessonWrites).toEqual([]);
  });

  it('does nothing for a draft lesson', async () => {
    await reopenForItem([{ contentId: 'L', status: 'draft' }], Question, 'Q');
    expect(Question.exists).not.toHaveBeenCalled();
    expect(db.lessonWrites).toEqual([]);
  });
});
