import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lessonState, canHandBack } from '@/lib/board';

// ─── The lesson board and handing a lesson back ───────────────────────────────

const db = vi.hoisted(() => ({ lesson: null, people: [], matched: 1, writes: [] }));

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/SeedActor', () => ({ REAL_PEOPLE: {}, ensureSystemSeedContributor: vi.fn(async () => 'placeholder') }));
vi.mock('@/lib/credits', async (importOriginal) => ({ ...(await importOriginal()), creditLesson: vi.fn() }));
vi.mock('@/lib/models/Section', () => ({ Section: {} }));
vi.mock('@/lib/models/Block', () => ({ Block: {} }));
vi.mock('@/lib/models/Contributor', () => ({
  Contributor: {
    find: ({ _id: { $in } }) => ({ select: () => ({ lean: async () => db.people.filter((p) => $in.includes(p._id)) }) }),
  },
}));
vi.mock('@/lib/models/Lesson', () => ({
  Lesson: {
    findOne: () => ({ select: () => ({ lean: async () => db.lesson }) }),
    updateOne: vi.fn(async (filter, update) => { db.writes.push({ filter, update }); return { matchedCount: db.matched }; }),
  },
}));

const { releaseLesson } = await import('@/lib/lessonAccess');

const member = { id: 'mona', role: 'contributor' };
const release = () => releaseLesson(member, 'L');

beforeEach(() => {
  db.lesson = { contentId: 'L', title: 'درس', status: 'draft', createdBy: 'seed', ownerId: 'mona' };
  db.people = [{ _id: 'mona', name: 'منى' }, { _id: 'sara', name: 'سارة' }];
  db.matched = 1;
  db.writes = [];
});

describe('releaseLesson', () => {
  it('returns a curriculum lesson to nobody', async () => {
    await release();
    expect(db.writes[0].update.$set).toEqual({ ownerId: null, claimedAt: null });
    expect(db.writes[0].filter).toMatchObject({ ownerId: 'mona', status: 'draft' });
  });

  it('hands one a person created to the placeholder, not back to them', async () => {
    db.lesson = { ...db.lesson, createdBy: 'mona', ownerId: null };
    await release();
    expect(db.writes[0].update.$set.ownerId).toBe('placeholder');
  });

  it('refuses what is not theirs, in review, approved or being revised', async () => {
    for (const change of [{ ownerId: 'sara' }, { status: 'review' }, { status: 'approved' }, { revising: true }]) {
      db.lesson = { contentId: 'L', status: 'draft', createdBy: 'seed', ownerId: 'mona', ...change };
      await expect(release()).rejects.toThrow();
    }
    expect(db.writes).toEqual([]);
  });

  it('says so when the lesson changed under it', async () => {
    db.matched = 0;
    await expect(release()).rejects.toMatchObject({ status: 409 });
  });
});

describe('lessonState', () => {
  const l = (extra) => ({ atlasStatus: 'draft', unclaimed: false, owner: 'mona', ...extra });

  it('tells the six states apart', () => {
    expect(lessonState(l({ unclaimed: true, started: true }))).toBe('available');
    expect(lessonState(l())).toBe('claimed');
    expect(lessonState(l({ started: true }))).toBe('progress');
    expect(lessonState(l(), true)).toBe('progress');
    expect(lessonState(l({ atlasStatus: 'review' }))).toBe('submitted');
    expect(lessonState(l({ reviewState: { returned: true } }))).toBe('returned');
    expect(lessonState(l({ atlasStatus: 'approved' }))).toBe('approved');
  });

  it('offers hand-back only on the holder\'s own draft', () => {
    expect(canHandBack(l(), 'mona')).toBe(true);
    expect(canHandBack(l({ atlasStatus: 'review' }), 'mona')).toBe(false);
    expect(canHandBack(l({ revising: true }), 'mona')).toBe(false);
    expect(canHandBack(l(), 'sara')).toBe(false);
  });
});
