import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signInAs, signOut } from './helpers/session.js';

// ─── Recruiting writes (docs/team-leads.md L3) ────────────────────────────────
// Deciding with an undo window, undoing, the sweep that applies due decisions
// (exactly once, emailing only approvals), the lead routes' permissions, the
// interview editor's single-entry write, and the cron's secret.

vi.mock('@/lib/auth',      async () => (await import('./helpers/session.js')).authMock);
vi.mock('@/lib/adminAuth', async () => (await import('./helpers/session.js')).adminAuthMock);
vi.mock('@/lib/db',        () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('next/server', async (importOriginal) => ({ ...(await importOriginal()), after: (fn) => fn() }));
vi.mock('@/lib/email/emailService', () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }));
vi.mock('@/lib/audit', async (importOriginal) => ({ ...(await importOriginal()), recordAudit: vi.fn(async () => null) }));

// Contributor: the guard's findById reads `people`; the recruiting calls are
// spies each test sets up.
const { people, q } = vi.hoisted(() => {
  const q = (v) => ({ select: () => q(v), sort: () => q(v), limit: () => q(v), lean: async () => v, then: (r, j) => Promise.resolve(v).then(r, j) });
  return { people: [], q };
});
vi.mock('@/lib/models/Contributor', () => ({
  Contributor: {
    findById: vi.fn((id) => q(people.find((p) => p._id === id) ?? null)),
    findOne: vi.fn(() => q(null)),
    find: vi.fn(() => q([])),
    updateOne: vi.fn(async () => ({ matchedCount: 1, modifiedCount: 1 })),
    findOneAndUpdate: vi.fn(() => q(null)),
  },
}));
vi.mock('@/lib/models/ContributorRole', () => ({
  ContributorRole: {
    find: vi.fn(() => q([])),
    exists: vi.fn(async () => ({ _id: 'r' })),
    updateOne: vi.fn(async () => ({ matchedCount: 1 })),
  },
}));
vi.mock('@/lib/models/AuditEvent', () => ({ AuditEvent: { find: vi.fn(() => q([])) } }));
vi.mock('@/lib/releases',   () => ({ applyDueReleases: vi.fn(async () => []) }));
vi.mock('@/lib/leadDigest', () => ({ sendLeadDigests: vi.fn(async () => 0) }));
vi.mock('@/lib/models/Admin', () => ({ Admin: { find: vi.fn(() => q([{ email: 'owner@example.com', username: 'owner' }])) } }));

const { Contributor }     = await import('@/lib/models/Contributor');
const { ContributorRole } = await import('@/lib/models/ContributorRole');
const { AuditEvent }      = await import('@/lib/models/AuditEvent');
const { sendEmail }       = await import('@/lib/email/emailService');
const { decide, undoDecision, applyDueDecisions, UNDO_MINUTES } = await import('@/lib/applicants');
const applicantsRoute = await import('@/app/api/lead/applicants/route');
const interviewRoute  = await import('@/app/api/lead/interview/route');
const cron            = await import('@/app/api/cron/daily/route');

const ID = (n) => n.toString(16).padStart(24, '0');
const NOW = new Date('2026-10-19T12:00:00Z');
const BY = { id: ID(1), name: 'سارة' };
const answered = (extra = {}) => ({
  _id: ID(9), name: 'منى', status: 'pending', subjectsOfInterest: ['PHYSICS'],
  dynamicAnswersSubmittedAt: new Date('2026-10-10'), pendingDecision: null, ...extra,
});
const req = (url, method, body, headers = {}) => new Request(`http://test${url}`, {
  method, headers: { 'content-type': 'application/json', ...headers }, ...(body && { body: JSON.stringify(body) }),
});

beforeEach(() => {
  vi.clearAllMocks();
  people.length = 0;
  people.push(
    { _id: ID(1), status: 'approved', subject: 'PHYSICS', lead: { active: true, subject: 'PHYSICS', canDecideApplicants: true, canEditInterview: true } },
    { _id: ID(2), status: 'approved', subject: 'PHYSICS', lead: { active: true, subject: 'PHYSICS' } },   // defaults: both off
    { _id: ID(3), status: 'approved', subject: 'PHYSICS' },
  );
  signOut();
});

describe('decide', () => {
  it('records the decision to take effect after the undo window, conditionally', async () => {
    Contributor.findOne.mockReturnValueOnce(q(answered()));
    const { pendingDecision } = await decide(ID(9), { action: 'approve', subjectId: 'PHYSICS', by: BY }, NOW);
    expect(pendingDecision.decideAt.getTime() - NOW.getTime()).toBe(UNDO_MINUTES * 60_000);
    expect(pendingDecision).toMatchObject({ action: 'approve', subject: 'PHYSICS', byName: 'سارة' });
    const [filter] = Contributor.updateOne.mock.calls[0];
    expect(filter).toMatchObject({ _id: ID(9), status: 'pending' });
  });

  it('refuses an applicant whose first subject is another', async () => {
    Contributor.findOne.mockReturnValueOnce(q(answered({ subjectsOfInterest: ['MATH', 'PHYSICS'] })));
    await expect(decide(ID(9), { action: 'reject', subjectId: 'PHYSICS', by: BY }, NOW)).rejects.toMatchObject({ status: 403 });
  });

  it('refuses before the interview is answered', async () => {
    Contributor.findOne.mockReturnValueOnce(q(answered({ dynamicAnswersSubmittedAt: null, interviewToken: 't' })));
    await expect(decide(ID(9), { action: 'approve', subjectId: 'PHYSICS', by: BY }, NOW)).rejects.toMatchObject({ status: 400 });
  });

  it('refuses while another decision is waiting', async () => {
    Contributor.findOne.mockReturnValueOnce(q(answered({ pendingDecision: { action: 'reject', decideAt: new Date(NOW.getTime() + 60_000) } })));
    await expect(decide(ID(9), { action: 'approve', subjectId: 'PHYSICS', by: BY }, NOW)).rejects.toMatchObject({ status: 409 });
  });

  it('a lost race is reported, not overwritten', async () => {
    Contributor.findOne.mockReturnValueOnce(q(answered()));
    Contributor.updateOne.mockResolvedValueOnce({ matchedCount: 0 });
    await expect(decide(ID(9), { action: 'approve', subjectId: 'PHYSICS', by: BY }, NOW)).rejects.toMatchObject({ status: 409 });
  });
});

describe('undoDecision', () => {
  it('only inside the window, only for this subject', async () => {
    Contributor.findOneAndUpdate.mockReturnValueOnce(q({ _id: ID(9), name: 'منى', pendingDecision: { action: 'reject' } }));
    await expect(undoDecision(ID(9), { subjectId: 'PHYSICS' }, NOW)).resolves.toMatchObject({ undone: { action: 'reject' } });
    const [filter] = Contributor.findOneAndUpdate.mock.calls[0];
    expect(filter).toMatchObject({ 'pendingDecision.subject': 'PHYSICS', 'pendingDecision.decideAt': { $gt: NOW } });
  });

  it('too late → 409', async () => {
    await expect(undoDecision(ID(9), { subjectId: 'PHYSICS' }, NOW)).rejects.toMatchObject({ status: 409 });
  });
});

describe('applyDueDecisions', () => {
  const due = (action, extra = {}) => ({
    _id: ID(9), name: 'منى', email: 'muna@example.com', status: 'pending', onboarded: false,
    pendingDecision: { action, subject: 'PHYSICS', decideAt: new Date(NOW.getTime() - 1000) }, ...extra,
  });

  it('an approval joins the subject and sends the onboarding link once', async () => {
    Contributor.find.mockReturnValueOnce(q([due('approve')]));
    const applied = await applyDueDecisions(NOW);
    expect(applied).toEqual([{ id: ID(9), action: 'approve' }]);
    const [filter, { $set }] = Contributor.updateOne.mock.calls[0];
    expect(filter).toMatchObject({ status: 'pending', 'pendingDecision.decideAt': due('approve').pendingDecision.decideAt });
    expect($set).toMatchObject({ status: 'approved', subject: 'PHYSICS', pendingDecision: null });
    expect($set.onboardingToken).toMatch(/^[a-f0-9]{64}$/);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'muna@example.com', template: 'onboarding_invite' }));
  });

  it('a rejection sends the standard apology once, without the reason', async () => {
    Contributor.find.mockReturnValueOnce(q([due('reject', { pendingDecision: { ...due('reject').pendingDecision, reason: 'internal' } })]));
    await applyDueDecisions(NOW);
    expect(Contributor.updateOne.mock.calls[0][1].$set.status).toBe('rejected');
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith({ to: 'muna@example.com', template: 'application_rejected', data: { name: 'منى' } });
  });

  it('a decision another sweep already claimed is skipped — no second email', async () => {
    Contributor.find.mockReturnValueOnce(q([due('approve')]));
    Contributor.updateOne.mockResolvedValueOnce({ matchedCount: 0, modifiedCount: 0 });
    expect(await applyDueDecisions(NOW)).toEqual([]);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('a decision the owner overtook is dropped', async () => {
    Contributor.find.mockReturnValueOnce(q([due('reject', { status: 'approved' })]));
    expect(await applyDueDecisions(NOW)).toEqual([]);
    expect(Contributor.updateOne.mock.calls[0][1]).toEqual({ $set: { pendingDecision: null } });
  });
});

describe('/api/lead/applicants', () => {
  const post = (body) => applicantsRoute.POST(req('/api/lead/applicants', 'POST', body));

  it('needs canDecideApplicants', async () => {
    signInAs({ id: ID(3), role: 'contributor' });
    expect((await applicantsRoute.GET(req('/api/lead/applicants', 'GET'))).status).toBe(403);
    signInAs({ id: ID(2), role: 'contributor' });
    expect((await post({ action: 'undo', applicantId: ID(9) })).status).toBe(403);
  });

  it('a reject needs a reason', async () => {
    signInAs({ id: ID(1), role: 'contributor', name: 'سارة' });
    expect((await post({ action: 'decide', applicantId: ID(9), decision: 'reject', reason: 'قصير' })).status).toBe(400);
    expect(Contributor.updateOne).not.toHaveBeenCalled();
  });

  it('refuses a malformed id before any query', async () => {
    signInAs({ id: ID(1), role: 'contributor' });
    expect((await post({ action: 'decide', applicantId: { $ne: null }, decision: 'approve' })).status).toBe(400);
  });
});

describe('/api/lead/interview PUT', () => {
  const put = (body) => interviewRoute.PUT(req('/api/lead/interview', 'PUT', body));

  it('writes only this subject\'s entry, keeping existing question ids', async () => {
    signInAs({ id: ID(1), role: 'contributor' });
    const keep = ID(77);
    const res = await put({ roleId: ID(50), questions: [{ id: keep, text: 'سؤال قديم' }, { text: 'سؤال جديد', minChars: 5 }, { text: '  ' }], microTask: { prompt: 'اشرح' } });
    expect(res.status).toBe(200);
    const [filter, update] = ContributorRole.updateOne.mock.calls[0];
    expect(filter).toEqual({ _id: ID(50), 'subjectQuestionMap.subjectId': 'PHYSICS' });
    const qs = update.$set['subjectQuestionMap.$.questions'];
    expect(qs).toHaveLength(2);
    expect(String(qs[0]._id)).toBe(keep);
    expect(qs[1].minChars).toBe(20);   // clamped
  });

  it('adds the entry when the subject has none yet', async () => {
    signInAs({ id: ID(1), role: 'contributor' });
    ContributorRole.updateOne.mockResolvedValueOnce({ matchedCount: 0 });
    await put({ roleId: ID(50), questions: [{ text: 'سؤال' }], microTask: {} });
    const [filter, update] = ContributorRole.updateOne.mock.calls[1];
    expect(filter).toEqual({ _id: ID(50), 'subjectQuestionMap.subjectId': { $ne: 'PHYSICS' } });
    expect(update.$push.subjectQuestionMap.subjectId).toBe('PHYSICS');
  });

  it('needs canEditInterview, and at most 8 questions', async () => {
    signInAs({ id: ID(2), role: 'contributor' });
    expect((await put({ roleId: ID(50), questions: [] })).status).toBe(403);
    signInAs({ id: ID(1), role: 'contributor' });
    expect((await put({ roleId: ID(50), questions: Array.from({ length: 9 }, () => ({ text: 'س' })) })).status).toBe(400);
  });
});

describe('/api/cron/daily', () => {
  it('refuses without the secret configured, or with the wrong one', async () => {
    delete process.env.CRON_SECRET;
    expect((await cron.GET(req('/api/cron/daily', 'GET'))).status).toBe(503);
    process.env.CRON_SECRET = 's3cret';
    expect((await cron.GET(req('/api/cron/daily', 'GET', null, { authorization: 'Bearer nope' }))).status).toBe(401);
  });

  it('sweeps, and emails the owner only when leads did something', async () => {
    process.env.CRON_SECRET = 's3cret';
    const auth = { authorization: 'Bearer s3cret' };
    expect(await (await cron.GET(req('/api/cron/daily', 'GET', null, auth))).json()).toMatchObject({ ok: true, digestsSent: 0 });
    expect(sendEmail).not.toHaveBeenCalled();

    AuditEvent.find.mockReturnValueOnce(q([{ subjectId: 'PHYSICS', actorName: 'سارة', action: 'lesson.approve' }]));
    expect(await (await cron.GET(req('/api/cron/daily', 'GET', null, auth))).json()).toMatchObject({ digestsSent: 1 });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'owner@example.com', template: 'notice' }));
  });
});
