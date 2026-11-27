import { describe, it, expect, vi } from 'vitest';

// ─── What a lead's inbox calls stuck (lib/api/leadInbox.js) ───────────────────
// Unwritten curriculum lessons are nobody's, and a lesson whose blocks were
// saved today is being written, whatever the lesson's own date says.

const NOW = new Date('2026-11-27T12:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86_400_000);

const rows = (list) => {
  const q = { select: () => q, sort: () => q, lean: async () => list };
  return q;
};

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/SeedActor', () => ({ REAL_PEOPLE: {} }));
vi.mock('@/lib/imageRequests', () => ({ openImageRequests: async () => [] }));
vi.mock('@/lib/api/reviewQueue', () => ({
  getReviewQueue: async () => ({ lessons: [], concepts: [], feedItems: [], questions: [], total: 0 }),
}));
vi.mock('@/lib/models/Contributor', () => ({ Contributor: { find: () => rows([{ _id: 'mona', name: 'منى' }]) } }));
vi.mock('@/lib/models/Lesson', () => ({
  Lesson: {
    find: () => rows([
      { contentId: 'empty', createdBy: 'seed', updatedAt: daysAgo(90) },
      { contentId: 'stuck', createdBy: 'seed', ownerId: 'mona', updatedAt: daysAgo(20) },
      { contentId: 'busy',  createdBy: 'seed', ownerId: 'mona', updatedAt: daysAgo(20) },
      { contentId: 'taken', createdBy: 'seed', ownerId: 'mona', updatedAt: daysAgo(90), claimedAt: daysAgo(1) },
    ]),
  },
}));
vi.mock('@/lib/models/Section', () => ({
  Section: { find: () => rows([{ contentId: 'S', lessonContentId: 'busy', updatedAt: daysAgo(18) }]) },
}));
vi.mock('@/lib/models/Block', () => ({
  Block: { find: () => rows([{ sectionContentId: 'S', updatedAt: daysAgo(0) }]) },
}));

const { getLeadInbox } = await import('@/lib/api/leadInbox');

describe('stale drafts', () => {
  it('lists only someone\'s lesson with no writing for the period', async () => {
    const inbox = await getLeadInbox('GEOGRAPHY', 'lead', NOW);
    expect(inbox.stale.map((d) => d.contentId)).toEqual(['stuck']);
    expect(inbox.stale[0].owner).toBe('منى');
  });
});
