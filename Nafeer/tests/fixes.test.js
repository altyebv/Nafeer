import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── After the walkthrough on the dev database (docs/dev-database.md) ─────────
// The dashboard's next step suggests only the member's own lessons; ownership
// survives the editor's store merge; a release cut off mid-publish is failed,
// not left "publishing" forever.

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/email/emailService', () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }));
vi.mock('@/lib/audit', () => ({ recordAudit: vi.fn(async () => null) }));
vi.mock('@/lib/publishSubject', () => ({ publishSubject: vi.fn() }));
const { q } = vi.hoisted(() => {
  const q = (v) => ({ select: () => q(v), sort: () => q(v), limit: () => q(v), lean: async () => v, then: (r, j) => Promise.resolve(v).then(r, j) });
  return { q };
});
vi.mock('@/lib/models/Release', () => ({ Release: { find: vi.fn(() => q([])), findOneAndUpdate: vi.fn(() => q(null)) } }));
vi.mock('@/lib/models/Admin', () => ({ Admin: { find: vi.fn(() => q([{ email: 'owner@example.com', username: 'owner' }])) } }));
vi.mock('@/lib/models/announcement', () => ({ Announcement: { create: vi.fn(async (d) => d) } }));

const { pickNextStep } = await import('@/lib/nextStep');
const { mergeLesson, fromServerLesson } = await import('@/lib/editorSync');
const { Release } = await import('@/lib/models/Release');
const { Announcement } = await import('@/lib/models/announcement');
const { sendEmail } = await import('@/lib/email/emailService');
const { failStuckReleases, STUCK_MINUTES } = await import('@/lib/releases');

const row = (id, owner, extra = {}, r = {}) => ({
  lesson: { id, owner, title: id, atlasStatus: 'draft', ...extra },
  r: { done: 0, missing: ['ملخص'], counts: { sections: 0 }, ...r },
  n: 1, unitN: 1,
});

describe('pickNextStep — only my lessons', () => {
  it('ignores a lesson returned to someone else', () => {
    const all = [row('omar', 'omar', { reviewState: { returned: true } }), row('mine', 'me')];
    const step = pickNextStep(all, [], 'me');
    expect(step.x.lesson.id).toBe('mine');
    expect(step.kicker).toBe('ابدأ');
  });

  it('my returned lesson comes first', () => {
    const all = [row('mine-a', 'me'), row('mine-b', 'me', { reviewState: { returned: true } })];
    expect(pickNextStep(all, [], 'me').kicker).toBe('أُعيد إليك');
  });

  it('with nothing of mine left, offers an unclaimed lesson to take', () => {
    const all = [row('omar', 'omar'), row('free', 'seed', { unclaimed: true })];
    const step = pickNextStep(all, [], 'me');
    expect(step.x.lesson.id).toBe('free');
    expect(step.kicker).toBe('تولَّ درساً');
  });

  it('nothing of mine and nothing unclaimed: no step', () => {
    expect(pickNextStep([row('omar', 'omar')], [], 'me')).toBeNull();
  });

  it('the owner (no id) sees every lesson, as before', () => {
    expect(pickNextStep([row('omar', 'omar', { reviewState: { returned: true } })], [], null).x.lesson.id).toBe('omar');
  });
});

describe('ownership in the editor store', () => {
  it('a lesson GET carries the owner, else the author', () => {
    expect(fromServerLesson({ title: 't', ownerId: 'a1', createdBy: 'c1' }).owner).toBe('a1');
    expect(fromServerLesson({ title: 't', createdBy: 'c1' }).owner).toBe('c1');
  });

  it('the server\'s ownership wins even over unsaved local edits', () => {
    const local = { id: 'L1', title: 'local', owner: 'old', unclaimed: true, _dirty: true, _v: 3 };
    const merged = mergeLesson(local, { title: 'server', owner: 'me', unclaimed: false, _v: 3 });
    expect(merged).toMatchObject({ title: 'local', owner: 'me', unclaimed: false, _dirty: true });
  });
});

describe('failStuckReleases', () => {
  beforeEach(() => vi.clearAllMocks());
  const NOW = new Date('2026-10-19T12:00:00Z');

  it('fails a release publishing for too long, and tells the lead and the owner', async () => {
    Release.find.mockReturnValueOnce(q([{ _id: 'r1', updatedAt: new Date('2026-10-19T11:00:00Z') }]));
    Release.findOneAndUpdate.mockReturnValueOnce(q({ _id: 'r1', subjectId: 'GEOGRAPHY', requestedById: 'lead', requestedByName: 'سارة', status: 'failed' }));

    const failed = await failStuckReleases(NOW);
    expect(failed).toHaveLength(1);
    expect(Release.find.mock.calls[0][0].$or[0].publishingStartedAt.$lte)
      .toEqual(new Date(NOW.getTime() - STUCK_MINUTES * 60_000));
    const [filter, update] = Release.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ _id: 'r1', status: 'publishing' });   // still stuck when we act
    expect(update.$set.status).toBe('failed');
    expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({ targetContributorIds: ['lead'] }));
    expect(sendEmail).toHaveBeenCalled();
  });

  it('one that finished in the meantime is left alone', async () => {
    Release.find.mockReturnValueOnce(q([{ _id: 'r1' }]));
    expect(await failStuckReleases(NOW)).toEqual([]);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
