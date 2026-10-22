import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signInAs, signOut } from './helpers/session.js';

// ─── L5: releases, appeals, the lead digest (docs/team-leads.md) ──────────────

vi.mock('@/lib/auth',      async () => (await import('./helpers/session.js')).authMock);
vi.mock('@/lib/adminAuth', async () => (await import('./helpers/session.js')).adminAuthMock);
vi.mock('@/lib/db',        () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('next/server', async (importOriginal) => ({ ...(await importOriginal()), after: (fn) => fn() }));
vi.mock('@/lib/email/emailService', () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }));
vi.mock('@/lib/audit', async (importOriginal) => ({ ...(await importOriginal()), recordAudit: vi.fn(async () => null) }));

// The real pipeline is never run here: its answer is set per test.
const { pub, q, people, lessonDocs } = vi.hoisted(() => {
  const q = (v) => ({ select: () => q(v), sort: () => q(v), limit: () => q(v), lean: async () => v, then: (r, j) => Promise.resolve(v).then(r, j) });
  return { pub: { dry: null, real: null }, q, people: [], lessonDocs: [] };
});
vi.mock('@/lib/publishSubject', () => ({
  publishSubject: vi.fn(async ({ dryRun }) => Response.json(dryRun ? pub.dry : pub.real, { status: (dryRun ? pub.dry : pub.real)?.ok === false ? 422 : 200 })),
}));
vi.mock('@/lib/models/Release', () => ({
  Release: {
    exists: vi.fn(async () => null),
    findOne: vi.fn(() => q(null)),
    find: vi.fn(() => q([])),
    create: vi.fn(async (d) => ({ _id: 'r1', ...d })),
    findOneAndUpdate: vi.fn(() => q(null)),
  },
}));
vi.mock('@/lib/models/Admin', () => ({ Admin: { find: vi.fn(() => q([{ email: 'owner@example.com', username: 'owner' }])) } }));
vi.mock('@/lib/models/announcement', () => ({ Announcement: { create: vi.fn(async (d) => d) } }));
vi.mock('@/lib/models/Contributor', () => ({
  Contributor: {
    findById: vi.fn((id) => q(people.find((p) => p._id === id) ?? null)),
    updateOne: vi.fn(async () => ({ matchedCount: 1 })),
  },
}));
vi.mock('@/lib/models/Lesson', () => ({ Lesson: { findOne: vi.fn((f) => q(lessonDocs.find((l) => l.contentId === f.contentId) ?? null)) } }));
vi.mock('@/lib/models/Appeal', () => ({
  Appeal: {
    exists: vi.fn(async () => null),
    create: vi.fn(async (d) => ({ _id: 'a1', status: 'open', ...d })),
    findOneAndUpdate: vi.fn(() => q(null)),
  },
}));

const { Release }      = await import('@/lib/models/Release');
const { Appeal }       = await import('@/lib/models/Appeal');
const { Contributor }  = await import('@/lib/models/Contributor');
const { Announcement } = await import('@/lib/models/announcement');
const { sendEmail }    = await import('@/lib/email/emailService');
const { recordAudit }  = await import('@/lib/audit');
const { requestRelease, applyDueReleases, cancelRelease, RELEASE_HOLD_HOURS } = await import('@/lib/releases');
const { fileAppeal, resolveAppeal } = await import('@/lib/appeals');
const { buildLeadDigest } = await import('@/lib/leadDigest');
const { previewDelta }    = await import('@/lib/deltaEngine');
const releasesRoute = await import('@/app/api/lead/releases/route');

const NOW = new Date('2026-10-19T12:00:00Z');
const LEAD = { id: 'lead', name: 'سارة' };
const dryRun = (extra = {}) => ({
  ok: true, dryRun: true, contentVersion: '1.4', lastPublishedAt: '2026-10-18T10:00:00Z',
  delta: {
    firstPublish: false, nothingToPublish: false,
    changed: { LESSON: 2, BLOCK: 9 }, deleted: {},
    lessons: { changed: [{ id: 'L1', title: 'الحركة' }, { id: 'L2', title: 'القوة' }], removed: [] },
    ...extra,
  },
  stats: { lessons: 12, sections: 30, blocks: 140 },
});

beforeEach(() => { vi.clearAllMocks(); pub.dry = dryRun(); pub.real = null; });

describe('requestRelease', () => {
  it('holds it for the hold window and emails the owner at once', async () => {
    const r = await requestRelease('PHYSICS', { lead: LEAD, note: 'الوحدة الثانية كاملة' }, NOW);
    expect(r.status ?? 'held').toBe('held');
    expect(r.goLiveAt.getTime() - NOW.getTime()).toBe(RELEASE_HOLD_HOURS * 3600_000);
    expect(r.preview).toMatchObject({ changed: { LESSON: 2 }, fromVersion: '1.4' });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'owner@example.com', template: 'notice',
      data: expect.objectContaining({ message: expect.stringContaining('الوحدة الثانية كاملة') }),
    }));
  });

  it('one waiting at a time', async () => {
    Release.exists.mockResolvedValueOnce({ _id: 'x' });
    await expect(requestRelease('PHYSICS', { lead: LEAD }, NOW)).rejects.toMatchObject({ status: 409 });
  });

  it('one a day per subject', async () => {
    Release.findOne.mockReturnValueOnce(q({ createdAt: new Date(NOW.getTime() - 2 * 3600_000) }));
    await expect(requestRelease('PHYSICS', { lead: LEAD }, NOW)).rejects.toMatchObject({ status: 429 });
  });

  it('nothing new, nothing to request', async () => {
    pub.dry = dryRun({ nothingToPublish: true });
    await expect(requestRelease('PHYSICS', { lead: LEAD }, NOW)).rejects.toMatchObject({ status: 400 });
    expect(Release.create).not.toHaveBeenCalled();
  });
});

describe('applyDueReleases', () => {
  const held = { _id: 'r1', subjectId: 'PHYSICS', status: 'publishing', requestedById: 'lead', requestedByName: 'سارة', preview: { fromVersion: '1.4' } };

  it('claims it, publishes through the same pipeline, logs it and tells the lead', async () => {
    Release.find.mockReturnValueOnce(q([]));               // nothing stuck in publishing
    Release.find.mockReturnValueOnce(q([{ _id: 'r1' }]));
    Release.findOneAndUpdate
      .mockReturnValueOnce(q(held))
      .mockReturnValueOnce(q({ ...held, status: 'published', contentVersion: '1.5' }));
    pub.real = { ok: true, contentVersion: '1.5' };

    const [done] = await applyDueReleases(NOW);
    expect(done.status).toBe('published');
    expect(Release.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: 'r1', status: 'held' });
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ id: 'lead' }),
      expect.objectContaining({ action: 'release.publish', meta: expect.objectContaining({ contentVersion: '1.5' }) }));
    expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({ targetContributorIds: ['lead'] }));
  });

  it('a release another sweep claimed is left alone', async () => {
    Release.find.mockReturnValueOnce(q([]));               // nothing stuck in publishing
    Release.find.mockReturnValueOnce(q([{ _id: 'r1' }]));
    expect(await applyDueReleases(NOW)).toEqual([]);
  });

  it('a failed publish is recorded, and the owner is emailed', async () => {
    Release.find.mockReturnValueOnce(q([]));               // nothing stuck in publishing
    Release.find.mockReturnValueOnce(q([{ _id: 'r1' }]));
    Release.findOneAndUpdate.mockReturnValueOnce(q(held)).mockReturnValueOnce(q({ ...held, status: 'failed' }));
    pub.real = { ok: false, error: 'Firestore down' };
    await applyDueReleases(NOW);
    expect(Release.findOneAndUpdate.mock.calls[1][1].$set).toMatchObject({ status: 'failed', error: 'Firestore down' });
    expect(sendEmail).toHaveBeenCalled();
  });
});

describe('cancelRelease', () => {
  it('only a held one', async () => {
    await expect(cancelRelease('r1', { by: LEAD })).rejects.toMatchObject({ status: 409 });
    expect(Release.findOneAndUpdate.mock.calls[0][0]).toMatchObject({ status: 'held' });
  });
});

describe('previewDelta', () => {
  it('counts what changed against the published index, writing nothing', () => {
    const snapshot = {
      subject: null, tags: [], concepts: [], units: [], sections: [], blocks: [], questions: [], exams: [], feedItems: [],
      lessons: [
        { contentId: 'L1', updatedAt: new Date('2026-10-01') },
        { contentId: 'L2', updatedAt: new Date('2026-10-19') },
      ],
    };
    const first = previewDelta({ subjectId: 'PHYSICS', snapshot, prevEntry: null });
    expect(first.firstPublish).toBe(true);
    expect(first.changed.LESSON).toBe(2);
  });
});

describe('appeals', () => {
  beforeEach(() => {
    people.length = 0;
    people.push(
      { _id: 'paused', subject: 'PHYSICS', paused: { active: true, until: null, byName: 'سارة' } },
      { _id: 'free',   subject: 'PHYSICS', paused: null },
    );
    lessonDocs.length = 0;
    lessonDocs.push(
      { contentId: 'L1', subjectId: 'PHYSICS', title: 'الحركة', createdBy: 'free', reviewState: { returned: true, returnedByName: 'سارة' } },
      { contentId: 'L2', subjectId: 'PHYSICS', title: 'القوة', createdBy: 'other', reviewState: { returned: true } },
    );
  });
  const text = 'الملاحظات تطلب ما شرحته في القسم الثاني بالفعل';

  it('a paused member appeals their pause; the owner is emailed', async () => {
    const a = await fileAppeal({ id: 'paused', name: 'منى' }, { kind: 'pause', text }, NOW);
    expect(a).toMatchObject({ kind: 'pause', againstName: 'سارة', subjectId: 'PHYSICS' });
    expect(sendEmail).toHaveBeenCalled();
  });

  it('only about their own lessons and their own pause', async () => {
    await expect(fileAppeal({ id: 'free' }, { kind: 'pause', text }, NOW)).rejects.toMatchObject({ status: 400 });
    await expect(fileAppeal({ id: 'free' }, { kind: 'return', lessonId: 'L2', text }, NOW)).rejects.toMatchObject({ status: 403 });
    await expect(fileAppeal({ id: 'free' }, { kind: 'intervention', lessonId: 'L1', text }, NOW)).rejects.toMatchObject({ status: 400 });
  });

  it('needs words, and one open appeal per thing', async () => {
    await expect(fileAppeal({ id: 'free' }, { kind: 'return', lessonId: 'L1', text: 'لا' }, NOW)).rejects.toMatchObject({ status: 400 });
    Appeal.exists.mockResolvedValueOnce({ _id: 'x' });
    await expect(fileAppeal({ id: 'free' }, { kind: 'return', lessonId: 'L1', text }, NOW)).rejects.toMatchObject({ status: 409 });
  });

  it('upholding a pause appeal lifts the pause and tells the member', async () => {
    Appeal.findOneAndUpdate.mockReturnValueOnce(q({ _id: 'a1', kind: 'pause', byId: 'paused', targetLabel: 'إيقاف التعديل', status: 'upheld', resolution: 'رُفع' }));
    await resolveAppeal('a1', { outcome: 'upheld', resolution: 'رُفع', by: { name: 'المالك' } }, NOW);
    expect(Contributor.updateOne).toHaveBeenCalledWith({ _id: 'paused' }, { $set: { 'paused.active': false } });
    expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'قُبل اعتراضك', targetContributorIds: ['paused'] }));
  });

  it('dismissing changes nothing but the appeal', async () => {
    Appeal.findOneAndUpdate.mockReturnValueOnce(q({ _id: 'a1', kind: 'pause', byId: 'paused', targetLabel: 'x', status: 'dismissed' }));
    await resolveAppeal('a1', { outcome: 'dismissed', by: { name: 'المالك' } }, NOW);
    expect(Contributor.updateOne).not.toHaveBeenCalled();
  });
});

describe('buildLeadDigest', () => {
  it('nothing waiting, no email', () => {
    expect(buildLeadDigest({ name: 'سارة', subjectId: 'PHYSICS' })).toBeNull();
  });

  it('lists only what waits', () => {
    const d = buildLeadDigest({ name: 'سارة', subjectId: 'PHYSICS', review: 3, applicants: 1 });
    expect(d.message).toContain('3 دروس بانتظار مراجعتك');
    expect(d.message).toContain('متقدم واحد');
    expect(d.message).not.toContain('إصدار');
  });
});

describe('/api/lead/releases', () => {
  beforeEach(() => {
    signOut();
    people.length = 0;
    people.push(
      { _id: 'pub',   status: 'approved', subject: 'PHYSICS', lead: { active: true, subject: 'PHYSICS', canPublish: true } },
      { _id: 'nopub', status: 'approved', subject: 'PHYSICS', lead: { active: true, subject: 'PHYSICS' } },
    );
  });
  const post = (body) => releasesRoute.POST(new Request('http://test', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }));

  it('needs canPublish', async () => {
    signInAs({ id: 'nopub', role: 'contributor' });
    expect((await post({ action: 'request' })).status).toBe(403);
  });

  it('a lead with it can request', async () => {
    signInAs({ id: 'pub', role: 'contributor', name: 'سارة' });
    expect((await post({ action: 'request', note: 'جاهز' })).status).toBe(200);
    expect(recordAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: 'release.request' }));
  });
});
