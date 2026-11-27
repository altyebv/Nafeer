import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Only what was read can be approved (lib/reviewStamp.js) ──────────────────

const db = vi.hoisted(() => ({ doc: null, matched: 1, updates: [] }));

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/trackStat', () => ({ trackStat: vi.fn() }));
vi.mock('@/lib/api/lessons', () => ({ getLessonWithContent: vi.fn() }));
vi.mock('@/lib/imageRequests', () => ({
  hasMissingImage: vi.fn(async () => !!db.missingImage),
  MISSING_IMAGE: 'missing image',
}));
vi.mock('@/lib/SeedActor', () => ({ REAL_PEOPLE: {} }));
vi.mock('@/lib/models/Lesson', () => ({
  Lesson: {
    findOne: vi.fn(async () => db.doc),
    updateOne: vi.fn(async (filter, update) => { db.updates.push({ filter, update }); return { matchedCount: db.matched }; }),
  },
}));
vi.mock('@/lib/models/Concept',      () => ({ Concept: {} }));
vi.mock('@/lib/models/FeedItem',     () => ({ FeedItem: {} }));
vi.mock('@/lib/models/Question',     () => ({ Question: {} }));
vi.mock('@/lib/models/Section',      () => ({ Section: {} }));
vi.mock('@/lib/models/Block',        () => ({ Block: {} }));
vi.mock('@/lib/models/Contributor',  () => ({ Contributor: {} }));
vi.mock('@/lib/models/SubjectGuide', () => ({ SubjectGuide: {} }));

const { approveOrReject } = await import('@/lib/api/reviewQueue');

const approve = (seen) => approveOrReject('L', 'lesson', 'approved', 'lead', '', { onlyFromReview: true, seen });

beforeEach(() => {
  db.doc = { contentId: 'L', status: 'review', version: 4, contentRev: 2, changelog: [] };
  db.matched = 1;
  db.missingImage = false;
  db.updates = [];
});

describe('approving a lesson', () => {
  it('writes nothing when the lesson moved after it was read', async () => {
    await expect(approve('4.1')).rejects.toMatchObject({ code: 'STALE' });
    await expect(approve('3.2')).rejects.toMatchObject({ code: 'STALE' });
    expect(db.updates).toEqual([]);
  });

  it('approves what was read, conditional on it still being so', async () => {
    await expect(approve('4.2')).resolves.toMatchObject({ status: 'approved' });
    expect(db.updates[0].filter).toMatchObject({ contentId: 'L', status: 'review', version: 4, contentRev: 2 });
  });

  it('refuses while an image is still missing', async () => {
    db.missingImage = true;
    await expect(approve('4.2')).rejects.toMatchObject({ code: 'MISSING_IMAGE' });
    expect(db.updates).toEqual([]);
  });

  it('refuses when a change lands between the read and the write', async () => {
    db.matched = 0;
    await expect(approve('4.2')).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
