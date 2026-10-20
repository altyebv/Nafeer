import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signInAs, signOut } from './helpers/session.js';

// ─── Lesson ownership and intervention (docs/team-leads.md L4) ────────────────
// Who may change a lesson; opening, closing and crediting an intervention;
// taking over; and the route's permissions.

vi.mock('@/lib/auth',      async () => (await import('./helpers/session.js')).authMock);
vi.mock('@/lib/adminAuth', async () => (await import('./helpers/session.js')).adminAuthMock);
vi.mock('@/lib/db',        () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('next/server', async (importOriginal) => ({ ...(await importOriginal()), after: (fn) => fn() }));
vi.mock('@/lib/audit', async (importOriginal) => ({ ...(await importOriginal()), recordAudit: vi.fn(async () => null) }));
vi.mock('@/lib/api/lessons', () => ({ writeHistory: vi.fn(async () => {}) }));
vi.mock('@/lib/credits', async (importOriginal) => ({ ...(await importOriginal()), creditLesson: vi.fn(async () => {}) }));

const { q, people, lessons } = vi.hoisted(() => {
  const q = (v) => ({ select: () => q(v), sort: () => q(v), limit: () => q(v), lean: async () => v, then: (r, j) => Promise.resolve(v).then(r, j) });
  return { q, people: [], lessons: [] };
});
vi.mock('@/lib/models/Contributor', () => ({
  Contributor: {
    findById: vi.fn((id) => q(people.find((p) => p._id === id) ?? null)),
    // Real people; anyone else (the seed actor) is nobody.
    find: vi.fn((f) => q((f?._id?.$in || []).filter((id) => ['author', 'member', 'other', 'lead'].includes(id)).map((_id) => ({ _id })))),
  },
}));
vi.mock('@/lib/models/Lesson', () => ({
  Lesson: {
    find: vi.fn((f) => q(lessons.filter((l) => f.contentId.$in.includes(l.contentId)))),
    findOne: vi.fn((f) => q(lessons.find((l) => l.contentId === f.contentId) ?? null)),
    // Applies an ownerId claim to the in-memory lessons, like the real write.
    updateOne: vi.fn(async (f, u) => {
      const l = lessons.find((x) => x.contentId === f.contentId && (!('ownerId' in f) || (x.ownerId ?? null) === f.ownerId));
      if (l && u?.$set?.ownerId !== undefined) l.ownerId = u.$set.ownerId;
      return { matchedCount: l ? 1 : 0 };
    }),
    findOneAndUpdate: vi.fn(() => q(null)),
  },
}));
vi.mock('@/lib/models/Section', () => ({ Section: { find: vi.fn(() => q([])) } }));
vi.mock('@/lib/models/Block',   () => ({ Block:   { find: vi.fn(() => q([])) } }));
vi.mock('@/lib/models/announcement', () => ({ Announcement: { create: vi.fn(async (d) => d) } }));

const { Lesson }       = await import('@/lib/models/Lesson');
const { Announcement } = await import('@/lib/models/announcement');
const { writeHistory } = await import('@/lib/api/lessons');
const { creditLesson } = await import('@/lib/credits');
const { recordAudit }  = await import('@/lib/audit');
const { lessonAccess, assertCanEditLessons, claimLesson, INTERVENTION_HOURS } = await import('@/lib/lessonAccess');
const { startIntervention, closeIntervention, takeOver } = await import('@/lib/intervention');
const route = await import('@/app/api/lead/lessons/route');

const NOW = new Date('2026-10-19T12:00:00Z');
const later = (h) => new Date(NOW.getTime() + h * 3600_000);
const LEAD = { active: true, subject: 'PHYSICS', canIntervene: true };
const lead   = { id: 'lead', role: 'contributor', subject: 'PHYSICS', lead: LEAD };
const member = { id: 'member', role: 'contributor', subject: 'PHYSICS', lead: null };
const author = { id: 'author', role: 'contributor', subject: 'PHYSICS', lead: null };
const lesson = (extra = {}) => ({ contentId: 'L1', subjectId: 'PHYSICS', title: 'الحركة', createdBy: 'author', ownerId: null, version: 5, intervention: null, ...extra });
const open = (byId = 'lead') => ({ byId, byName: 'سارة', category: 'factual', reason: 'خطأ في قانون نيوتن الثاني', until: later(2), startVersion: 5 });

async function refusal(fn) {
  try { await fn(); } catch (e) { if (e instanceof Response) return e; throw e; }
  throw new Error('expected a refusal');
}

describe('lessonAccess — who may change a lesson', () => {
  it('the author, while they own it', () => {
    expect(lessonAccess(lesson(), author, NOW)).toMatchObject({ canEdit: true, via: 'owner' });
  });

  it('an assignee instead of the author once it is assigned', () => {
    const l = lesson({ ownerId: 'member' });
    expect(lessonAccess(l, member, NOW).canEdit).toBe(true);
    expect(lessonAccess(l, author, NOW).canEdit).toBe(false);
  });

  it('another member reads only', () => {
    expect(lessonAccess(lesson(), member, NOW)).toMatchObject({ canEdit: false, canIntervene: false });
  });

  it('a lead may intervene, and edits only while their own intervention is open', () => {
    expect(lessonAccess(lesson(), lead, NOW)).toMatchObject({ canEdit: false, canIntervene: true });
    expect(lessonAccess(lesson({ intervention: open() }), lead, NOW)).toMatchObject({ canEdit: true, via: 'intervention' });
    expect(lessonAccess(lesson({ intervention: { ...open(), until: later(-1) } }), lead, NOW).canEdit).toBe(false);
  });

  it('another lead\'s intervention does not open it to this lead', () => {
    const res = lessonAccess(lesson({ intervention: open('colead') }), lead, NOW);
    expect(res).toMatchObject({ canEdit: false, canIntervene: false });
  });

  it('a lead without canIntervene, or of another subject, cannot', () => {
    expect(lessonAccess(lesson(), { ...lead, lead: { ...LEAD, canIntervene: false } }, NOW).canIntervene).toBe(false);
    expect(lessonAccess(lesson({ subjectId: 'MATH' }), lead, NOW).canIntervene).toBe(false);
  });

  it('the owner of the platform always', () => {
    expect(lessonAccess(lesson(), { id: 'admin', role: 'admin' }, NOW)).toMatchObject({ canEdit: true, via: 'admin' });
  });
});

describe('assertCanEditLessons', () => {
  beforeEach(() => { lessons.length = 0; lessons.push(lesson(), lesson({ contentId: 'L2', createdBy: 'member' })); });

  it('refuses with the lesson\'s title when any is not theirs', async () => {
    const res = await refusal(() => assertCanEditLessons(member, ['L2', 'L1'], NOW));
    expect(res.status).toBe(403);
    expect((await res.json())).toMatchObject({ code: 'NOT_OWNER', error: expect.stringContaining('الحركة') });
  });

  it('passes their own, and lessons that do not exist yet', async () => {
    await expect(assertCanEditLessons(member, ['L2', 'NEW_LESSON'], NOW)).resolves.toBeUndefined();
  });
});

describe('startIntervention', () => {
  beforeEach(() => { vi.clearAllMocks(); lessons.length = 0; lessons.push(lesson()); });

  it('opens for 24 hours, records why, and tells the owner', async () => {
    const { intervention } = await startIntervention('L1', { category: 'factual', reason: 'خطأ في قانون نيوتن الثاني', lead: { id: 'lead', name: 'سارة' } }, NOW);
    expect(intervention.until.getTime() - NOW.getTime()).toBe(INTERVENTION_HOURS * 3600_000);
    expect(intervention.startVersion).toBe(5);
    const [filter] = Lesson.updateOne.mock.calls[0];
    expect(filter.$or).toBeDefined();   // only if none is open
    expect(writeHistory).toHaveBeenCalledWith('L1', expect.objectContaining({ action: 'intervened', byId: 'lead' }));
    expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.stringContaining('خطأ في قانون نيوتن الثاني'), targetContributorIds: ['author'],
    }));
  });

  it('refuses the lead\'s own lesson, a missing category, and a lesson already under intervention', async () => {
    const by = { id: 'author', name: 'م' };
    await expect(startIntervention('L1', { category: 'factual', reason: 'x', lead: by }, NOW)).rejects.toMatchObject({ status: 400 });
    await expect(startIntervention('L1', { category: 'whim', reason: 'x', lead: { id: 'lead' } }, NOW)).rejects.toMatchObject({ status: 400 });
    lessons[0].intervention = open('colead');
    await expect(startIntervention('L1', { category: 'factual', reason: 'x', lead: { id: 'lead' } }, NOW)).rejects.toMatchObject({ status: 409 });
  });
});

describe('closeIntervention', () => {
  beforeEach(() => vi.clearAllMocks());

  it('credits the lead as editor when the lesson changed meanwhile', async () => {
    Lesson.findOneAndUpdate.mockReturnValueOnce(q({ contentId: 'L1', version: 8, intervention: open() }));
    const res = await closeIntervention('L1', { byId: 'lead' }, NOW);
    expect(res.versionsMade).toBe(3);
    expect(creditLesson).toHaveBeenCalledWith('L1', { contributorId: 'lead', name: 'سارة', kind: 'editor' });
  });

  it('no change, no credit — and the close is still on the record', async () => {
    Lesson.findOneAndUpdate.mockReturnValueOnce(q({ contentId: 'L1', version: 5, intervention: open() }));
    await closeIntervention('L1', { byId: 'lead' }, NOW);
    expect(creditLesson).not.toHaveBeenCalled();
    expect(writeHistory).toHaveBeenCalledWith('L1', expect.objectContaining({ note: expect.stringContaining('بلا تعديل') }));
  });

  it('expiry closes only what has run out', async () => {
    await closeIntervention('L1', { expiredOnly: true }, NOW);
    expect(Lesson.findOneAndUpdate.mock.calls[0][0]).toMatchObject({ 'intervention.until': { $lte: NOW } });
  });
});

describe('takeOver', () => {
  beforeEach(() => { vi.clearAllMocks(); lessons.length = 0; lessons.push(lesson()); });

  it('makes the lead the owner, keeps the author, and says why', async () => {
    await takeOver('L1', { reason: 'صاحب الدرس لم يظهر منذ شهرين', lead: { id: 'lead', name: 'سارة' } }, NOW);
    expect(Lesson.updateOne).toHaveBeenCalledWith({ contentId: 'L1' }, { $set: { ownerId: 'lead' } }, expect.anything());
    expect(Lesson.updateOne.mock.calls[0][1].$set).not.toHaveProperty('createdBy');
    expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({ body: expect.stringContaining('يبقى اسمك مؤلفاً له') }));
  });
});

describe('/api/lead/lessons', () => {
  const post = (body) => route.POST(new Request('http://test/api/lead/lessons', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    signOut();
    people.length = 0;
    people.push(
      { _id: 'lead',    status: 'approved', subject: 'PHYSICS', lead: LEAD },
      { _id: 'nolead',  status: 'approved', subject: 'PHYSICS', lead: { ...LEAD, canIntervene: false } },
      { _id: 'member',  status: 'approved', subject: 'PHYSICS' },
    );
    lessons.length = 0;
    lessons.push(lesson());
  });

  it('needs canIntervene', async () => {
    signInAs({ id: 'member', role: 'contributor' });
    expect((await post({ action: 'intervene', contentId: 'L1', category: 'factual', reason: 'سبب واضح ومفصّل بما يكفي' })).status).toBe(403);
    signInAs({ id: 'nolead', role: 'contributor' });
    expect((await post({ action: 'intervene', contentId: 'L1', category: 'factual', reason: 'سبب واضح ومفصّل بما يكفي' })).status).toBe(403);
  });

  it('needs a reason, and logs the intervention', async () => {
    signInAs({ id: 'lead', role: 'contributor', name: 'سارة' });
    expect((await post({ action: 'intervene', contentId: 'L1', category: 'factual', reason: 'قصير' })).status).toBe(400);
    expect((await post({ action: 'intervene', contentId: 'L1', category: 'factual', reason: 'المثال الثالث يستخدم وحدة خاطئة' })).status).toBe(200);
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ kind: 'lead' }),
      expect.objectContaining({ action: 'lesson.intervene', reason: 'المثال الثالث يستخدم وحدة خاطئة' }));
  });

  it('ending with nothing open is a conflict', async () => {
    signInAs({ id: 'lead', role: 'contributor' });
    expect((await post({ action: 'end', contentId: 'L1' })).status).toBe(409);
  });
});

describe('unclaimed scaffold lessons', () => {
  // The Contributor mock knows the real people; 'seed' is nobody.
  beforeEach(() => {
    vi.clearAllMocks();
    lessons.length = 0;
    lessons.push(lesson({ contentId: 'S1', title: 'الدرس 1', createdBy: 'seed' }), lesson({ contentId: 'S2', subjectId: 'MATH', createdBy: 'seed' }));
  });

  it('saving never claims: an unclaimed lesson is refused like any other', async () => {
    expect((await refusal(() => assertCanEditLessons(member, ['S1'], NOW))).status).toBe(403);
    expect(lessons[0].ownerId).toBeNull();
  });

  it('a member of the subject may claim it, and becomes its author', async () => {
    await expect(claimLesson({ ...member, name: 'منى' }, 'S1', NOW)).resolves.toMatchObject({ contentId: 'S1' });
    expect(lessons[0].ownerId).toBe('member');
    expect(creditLesson).toHaveBeenCalledWith('S1', { contributorId: 'member', name: 'منى', kind: 'author' });
    await expect(assertCanEditLessons(member, ['S1'], NOW)).resolves.toBeUndefined();
  });

  it('once claimed it is theirs: nobody else can claim it', async () => {
    await claimLesson(member, 'S1', NOW);
    const other = { id: 'other', role: 'contributor', subject: 'PHYSICS', lead: null };
    await expect(claimLesson(other, 'S1', NOW)).rejects.toMatchObject({ status: 403 });
  });

  it('not across subjects, and never a lesson a real person owns', async () => {
    await expect(claimLesson(member, 'S2', NOW)).rejects.toMatchObject({ status: 403 });
    lessons.push(lesson({ contentId: 'R1' }));   // createdBy 'author'
    await expect(claimLesson(member, 'R1', NOW)).rejects.toMatchObject({ status: 403 });
  });

  it('the access says what to offer: claim, not intervene', () => {
    expect(lessonAccess(lessons[0], member, NOW, { unclaimed: true })).toMatchObject({ canEdit: false, canClaim: true, canIntervene: false });
    expect(lessonAccess(lessons[0], lead, NOW, { unclaimed: true })).toMatchObject({ canClaim: true, canIntervene: false });
  });
});
