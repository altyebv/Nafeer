import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signInAs, signInAsAdmin, signOut } from './helpers/session.js';

// ─── Lead review (docs/team-leads.md L1) ──────────────────────────────────────
// /api/lead/review, /api/lead/review/[contentId], /api/lead/inbox — who may
// act, the four-eyes rule, and what a lead's decision leaves behind (credit,
// stat, audit). The real guard runs; the writes are spies.

vi.mock('@/lib/auth',      async () => (await import('./helpers/session.js')).authMock);
vi.mock('@/lib/adminAuth', async () => (await import('./helpers/session.js')).adminAuthMock);
vi.mock('@/lib/db',        () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('next/server', async (importOriginal) => ({ ...(await importOriginal()), after: (fn) => fn() }));

const { model } = vi.hoisted(() => ({
  model: (name) => async () => ({ [name]: (await import('./helpers/fakeModel.js')).fakeModel() }),
}));
vi.mock('@/lib/models/Contributor', model('Contributor'));
vi.mock('@/lib/models/Lesson',      model('Lesson'));
vi.mock('@/lib/models/Concept',     model('Concept'));
vi.mock('@/lib/models/FeedItem',    model('FeedItem'));
vi.mock('@/lib/models/Question',    model('Question'));

vi.mock('@/lib/api/reviewQueue', () => ({
  approveOrReject:    vi.fn(async (contentId, type, status) => ({ contentId, status })),
  returnLesson:       vi.fn(async (contentId) => ({ contentId, status: 'draft', round: 1, comments: 2 })),
  getLessonForReview: vi.fn(async (contentId) => ({ id: contentId, title: 'درس' })),
}));
vi.mock('@/lib/api/leadInbox',  () => ({ getLeadInbox: vi.fn(async (subjectId) => ({ subjectId })) }));
vi.mock('@/lib/reviewNotify',   () => ({ notifyLessonReviewed: vi.fn(async () => {}) }));
vi.mock('@/lib/trackStat',      () => ({ trackStat: vi.fn() }));
vi.mock('@/lib/audit',          () => ({ recordAudit: vi.fn(async () => null) }));
vi.mock('@/lib/credits', async (importOriginal) => ({
  ...(await importOriginal()),
  creditLesson: vi.fn(async () => {}),
}));

const { Contributor } = await import('@/lib/models/Contributor');
const { Lesson }      = await import('@/lib/models/Lesson');
const { Concept }     = await import('@/lib/models/Concept');
const reviewQueue     = await import('@/lib/api/reviewQueue');
const { getLeadInbox } = await import('@/lib/api/leadInbox');
const { trackStat }   = await import('@/lib/trackStat');
const { recordAudit } = await import('@/lib/audit');
const { creditLesson } = await import('@/lib/credits');

const { PATCH }               = await import('@/app/api/lead/review/route');
const { GET: getDetail }      = await import('@/app/api/lead/review/[contentId]/route');
const { GET: getInbox }       = await import('@/app/api/lead/inbox/route');

// Waits a turn after the response so the route's after() work has run.
const patch = async (body) => {
  const res = await PATCH(new Request('http://test/api/lead/review', {
    method: 'PATCH', body: JSON.stringify(body), headers: { 'content-type': 'application/json' },
  }));
  await new Promise((r) => setTimeout(r, 0));
  return res;
};
const detail = (contentId) => getDetail(new Request('http://test'), { params: Promise.resolve({ contentId }) });
const inbox = (qs = '') => getInbox(new Request(`http://test/api/lead/inbox${qs}`));

const LEAD = { active: true, subject: 'PHYSICS', canReview: true };

beforeEach(() => {
  vi.clearAllMocks();
  Contributor.seed([
    { _id: 'lead',     status: 'approved', subject: 'PHYSICS', lead: LEAD },
    { _id: 'colead',   status: 'approved', subject: 'PHYSICS', lead: LEAD },
    { _id: 'noreview', status: 'approved', subject: 'PHYSICS', lead: { ...LEAD, canReview: false } },
    { _id: 'geolead',  status: 'approved', subject: 'GEOGRAPHY', lead: { ...LEAD, subject: 'GEOGRAPHY' } },
    { _id: 'member',   status: 'approved', subject: 'PHYSICS' },
  ]);
  Lesson.seed([
    { contentId: 'by_member', subjectId: 'PHYSICS', status: 'review', createdBy: 'member' },
    { contentId: 'by_lead',   subjectId: 'PHYSICS', status: 'review', createdBy: 'lead' },
    { contentId: 'owned',     subjectId: 'PHYSICS', status: 'review', createdBy: 'member', ownerId: 'lead' },
    { contentId: 'draft',     subjectId: 'PHYSICS', status: 'draft',  createdBy: 'member' },
  ]);
  Concept.seed([{ contentId: 'con_1', subjectId: 'PHYSICS', status: 'review', createdBy: 'member' }]);
  signOut();
});

const as = (id) => signInAs({ id, role: 'contributor', name: id === 'lead' ? 'سارة' : id });

describe('PATCH /api/lead/review — who may decide', () => {
  it('refuses a plain member', async () => {
    as('member');
    expect((await patch({ contentId: 'by_member', type: 'lesson', status: 'approved' })).status).toBe(403);
  });

  it('refuses a lead of another subject', async () => {
    as('geolead');
    expect((await patch({ contentId: 'by_member', type: 'lesson', status: 'approved' })).status).toBe(403);
  });

  it('refuses a lead without canReview', async () => {
    as('noreview');
    expect((await patch({ contentId: 'by_member', type: 'lesson', status: 'approved' })).status).toBe(403);
  });

  it('four-eyes: refuses the author, and the current owner', async () => {
    as('lead');
    expect((await patch({ contentId: 'by_lead', type: 'lesson', status: 'approved' })).status).toBe(403);
    expect((await patch({ contentId: 'owned',   type: 'lesson', status: 'approved' })).status).toBe(403);
    expect(reviewQueue.approveOrReject).not.toHaveBeenCalled();
  });

  it('…while the co-lead may review the lead\'s lesson', async () => {
    as('colead');
    expect((await patch({ contentId: 'by_lead', type: 'lesson', status: 'approved' })).status).toBe(200);
  });

  it('refuses an item that is not in review', async () => {
    as('lead');
    expect((await patch({ contentId: 'draft', type: 'lesson', status: 'approved' })).status).toBe(409);
  });

  it('refuses an unknown type or status before touching the database', async () => {
    as('lead');
    expect((await patch({ contentId: 'by_member', type: 'unit', status: 'approved' })).status).toBe(400);
    expect((await patch({ contentId: 'by_member', type: 'lesson', status: 'archived' })).status).toBe(400);
  });
});

describe('PATCH /api/lead/review — what a decision leaves behind', () => {
  it('approve: conditional on review, credits the lead, logs it', async () => {
    as('lead');
    expect((await patch({ contentId: 'by_member', type: 'lesson', status: 'approved' })).status).toBe(200);
    expect(reviewQueue.approveOrReject).toHaveBeenCalledWith('by_member', 'lesson', 'approved', 'lead', '', { onlyFromReview: true });
    expect(creditLesson).toHaveBeenCalledWith('by_member', { contributorId: 'lead', name: 'سارة', kind: 'reviewer' });
    expect(trackStat).toHaveBeenCalledWith('lead', 'reviewsSubmitted');
    expect(recordAudit).toHaveBeenCalledWith(
      { id: 'lead', name: 'سارة', kind: 'lead' },
      expect.objectContaining({ action: 'lesson.approve', subjectId: 'PHYSICS' }),
    );
  });

  it('return: the comments go out under the lead\'s name and id', async () => {
    as('lead');
    const comments = [{ text: 'المثال الثاني يحتاج خطوة', anchor: { kind: 'lesson' } }];
    expect((await patch({ contentId: 'by_member', type: 'lesson', status: 'draft', comments })).status).toBe(200);
    expect(reviewQueue.returnLesson).toHaveBeenCalledWith(
      'by_member', { comments, summary: '' }, { id: 'lead', name: 'سارة', role: 'lead' },
    );
    expect(recordAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: 'lesson.return', meta: { waitedMs: null, comments: 2, round: 1 },
    }));
  });

  it('a concept: approved and logged, no lesson credit', async () => {
    as('lead');
    expect((await patch({ contentId: 'con_1', type: 'concept', status: 'approved' })).status).toBe(200);
    expect(creditLesson).not.toHaveBeenCalled();
    expect(trackStat).toHaveBeenCalledWith('lead', 'reviewsSubmitted');
  });

  it('the owner passes through without credit or audit as a lead', async () => {
    signInAsAdmin();
    expect((await patch({ contentId: 'by_lead', type: 'lesson', status: 'approved' })).status).toBe(200);
    expect(creditLesson).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });
});

describe('GET /api/lead/review/[contentId]', () => {
  it('marks the lead\'s own lesson as mine', async () => {
    as('lead');
    expect((await (await detail('by_lead')).json()).data.mine).toBe(true);
    expect((await (await detail('by_member')).json()).data.mine).toBe(false);
  });

  it('refuses a member', async () => {
    as('member');
    expect((await detail('by_member')).status).toBe(403);
  });
});

describe('GET /api/lead/inbox', () => {
  it('opens the lead\'s own subject, ignoring a subjectId they name', async () => {
    as('lead');
    expect((await inbox('?subjectId=GEOGRAPHY')).status).toBe(200);
    expect(getLeadInbox).toHaveBeenCalledWith('PHYSICS', 'lead');
  });

  it('refuses a member', async () => {
    as('member');
    expect((await inbox()).status).toBe(403);
  });

  it('the owner names a subject', async () => {
    signInAsAdmin();
    expect((await inbox()).status).toBe(400);
    expect((await inbox('?subjectId=GEOGRAPHY')).status).toBe(200);
    expect(getLeadInbox).toHaveBeenCalledWith('GEOGRAPHY', null);
  });
});
