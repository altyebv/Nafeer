import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory stand-ins for the content models and Contributor.
const db = vi.hoisted(() => ({ content: {}, contributors: {}, activity: [] }));

vi.mock('next/server', () => ({ after: () => { throw new Error('outside a request'); } }));

const fakeModel = vi.hoisted(() => (name) => ({
  countDocuments: async ({ createdBy, isCheckpoint }) =>
    (db.content[name] || []).filter((d) => String(d.createdBy) === String(createdBy)
      && (!isCheckpoint || !d.isCheckpoint)).length,
  distinct: async (_f, filter) =>
    [...new Set((db.content[name] || []).filter((d) => d.sectionContentId === filter.sectionContentId).map((d) => d.createdBy))],
  aggregate: async ([{ $match }]) => {
    const rows = {};
    for (const d of db.content[name] || []) {
      if ($match.isCheckpoint && d.isCheckpoint) continue;
      rows[d.createdBy] = (rows[d.createdBy] || 0) + 1;
    }
    return Object.entries(rows).map(([_id, n]) => ({ _id, n }));
  },
}));
vi.mock('@/lib/models/Lesson',   () => ({ Lesson:   fakeModel('Lesson') }));
vi.mock('@/lib/models/Question', () => ({ Question: fakeModel('Question') }));
vi.mock('@/lib/models/FeedItem', () => ({ FeedItem: fakeModel('FeedItem') }));
vi.mock('@/lib/models/Block',    () => ({ Block:    fakeModel('Block') }));
vi.mock('@/lib/models/Exam',     () => ({ Exam:     fakeModel('Exam') }));

vi.mock('@/lib/models/ContributorActivity', () => ({
  ContributorActivity: { create: async (doc) => db.activity.push(doc) },
}));
vi.mock('@/lib/models/Contributor', () => {
  const set = (c, $set) => {
    for (const [k, v] of Object.entries($set)) c.stats[k.replace('stats.', '')] = v;
  };
  return {
    Contributor: {
      findByIdAndUpdate: (id, { $set }) => ({
        lean: async () => {
          const c = db.contributors[id];
          const before = { stats: { ...c.stats } };
          set(c, $set);
          return before;
        },
      }),
      updateOne: async ({ _id }, { $set }) => set(db.contributors[_id], $set),
      find: () => ({ lean: async () => Object.entries(db.contributors).map(([_id, c]) => ({ _id, ...c })) }),
      bulkWrite: async (ops) => ops.forEach(({ updateOne: { filter, update } }) => set(db.contributors[filter._id], update.$set)),
    },
  };
});

const { creditCreation, recountAuthored, reconcileAuthoredStats } = await import('@/lib/authoredStats');
const { trackStat } = await import('@/lib/trackStat');

beforeEach(() => {
  db.content = { Block: [], Question: [], Lesson: [] };
  db.contributors = { a: { username: 'a', stats: {} }, b: { username: 'b', stats: {} } };
  db.activity = [];
});

describe('creditCreation', () => {
  it('counts blocks from the content and logs only when the count rises', async () => {
    db.content.Block.push({ createdBy: 'a' }, { createdBy: 'a' });
    expect(await creditCreation('a', 'blocksAdded')).toBe(2);
    expect(db.activity).toHaveLength(1);

    // Re-saving the same two blocks is not new work.
    await creditCreation('a', 'blocksAdded');
    expect(db.contributors.a.stats.blocksAdded).toBe(2);
    expect(db.activity).toHaveLength(1);
  });

  it('does not count checkpoint questions, which mirror a block', async () => {
    db.content.Question.push({ createdBy: 'a' }, { createdBy: 'a', isCheckpoint: true });
    expect(await creditCreation('a', 'questionsAdded')).toBe(1);
  });
});

describe('recountAuthored', () => {
  it('takes deleted content back without touching lastActiveAt', async () => {
    db.contributors.a.stats = { blocksAdded: 7, lastActiveAt: 'then', editsMade: 9 };
    await recountAuthored(['a', 'a', null]);
    expect(db.contributors.a.stats).toMatchObject({ blocksAdded: 0, lastActiveAt: 'then', editsMade: 9 });
  });
});

describe('reconcileAuthoredStats', () => {
  it('reports drift on a dry run and writes it otherwise', async () => {
    db.contributors.a.stats = { blocksAdded: 3 };
    db.content.Block.push({ createdBy: 'a' }, { createdBy: 'a' }, { createdBy: 'a' }, { createdBy: 'a' });

    const dry = await reconcileAuthoredStats({ dryRun: true });
    expect(dry).toEqual([{ id: 'a', username: 'a', diff: { blocksAdded: { from: 3, to: 4 } } }]);
    expect(db.contributors.a.stats.blocksAdded).toBe(3);

    await reconcileAuthoredStats();
    expect(db.contributors.a.stats.blocksAdded).toBe(4);
    expect(await reconcileAuthoredStats({ dryRun: true })).toEqual([]);
  });
});

describe('trackStat', () => {
  it('routes created fields to the recount and ignores amount', async () => {
    db.content.Block.push({ createdBy: 'b' });
    trackStat('b', 'blocksAdded', { amount: 5 });
    await vi.waitFor(() => expect(db.contributors.b.stats.blocksAdded).toBe(1));
  });
});
