import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── The join flow's server rules ─────────────────────────────────────────────
// POST /api/contributors/request: every guideline field is required, and a
// valid application gets its status and interview links at once.
// GET  /api/contributors/status: the link shows the stage and the next link.

const state = vi.hoisted(() => ({ saved: [], existing: false, role: null, found: null, mails: [] }));

vi.mock('next/server', async (orig) => ({ ...(await orig()), after: (fn) => fn() }));
vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/rateLimit', () => ({ rateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/email/emailService', () => ({ sendEmail: vi.fn(async (m) => { state.mails.push(m); return { ok: true }; }) }));
vi.mock('@/lib/models/ContributorRole', () => ({
  ContributorRole: {
    findOne: () => ({ lean: () => ({ catch: async () => state.role }) }),
    findById: () => ({ lean: async () => state.role }),
  },
}));
vi.mock('@/lib/models/Contributor', () => {
  function Contributor(doc) { Object.assign(this, doc); }
  Contributor.prototype.save = async function save() { state.saved.push({ ...this }); return this; };
  Contributor.exists = async () => state.existing;
  Contributor.findOne = () => ({ select: () => ({ lean: async () => state.found }) });
  return { Contributor };
});

const request = await import('@/app/api/contributors/request/route.js');
const status  = await import('@/app/api/contributors/status/route.js');

const post = (body) => new Request('http://test/api', { method: 'POST', body: JSON.stringify(body) });
const LEARNING = { _id: 'role1', name: 'صانع محتوى تعليمي', category: 'learning', portfolioPrompt: '' };
const VALID = {
  name: 'فاطمة الحسن', email: 'Fatima@Example.com', gender: 'female', age: '18-22', town: 'بورتسودان',
  background: 'بكالوريوس فيزياء', subjectsOfInterest: ['PHYSICS'], subjectRelation: 'uni', weeklyHours: '2-4',
  hasPcOrTablet: true, internet: 'mostly', usesAiTools: true, aiToolsList: ['chatgpt', 'not-a-tool'], roleId: 'role1',
};

beforeEach(() => { state.saved = []; state.existing = false; state.role = LEARNING; state.found = null; state.mails = []; });

describe('POST /api/contributors/request', () => {
  it('requires every field the guidelines use', async () => {
    for (const field of ['gender', 'age', 'town', 'background', 'internet', 'weeklyHours']) {
      const res = await request.POST(post({ ...VALID, [field]: '' }));
      expect(res.status, field).toBe(400);
    }
    expect((await request.POST(post({ ...VALID, hasPcOrTablet: undefined }))).status).toBe(400);
    expect((await request.POST(post({ ...VALID, usesAiTools: undefined }))).status).toBe(400);
    expect(state.saved).toHaveLength(0);
  });

  it('asks a subject role for the subject and the relation to it', async () => {
    expect((await request.POST(post({ ...VALID, subjectsOfInterest: [] }))).status).toBe(400);
    expect((await request.POST(post({ ...VALID, subjectRelation: 'friend' }))).status).toBe(400);
  });

  it('creates the application with both links and emails them', async () => {
    const res = await request.POST(post(VALID));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.statusToken).toMatch(/^[a-f0-9]{64}$/);
    expect(body.interviewToken).toMatch(/^[a-f0-9]{64}$/);

    const saved = state.saved[0];
    expect(saved.email).toBe('fatima@example.com');
    expect(saved.statusToken).toBe(body.statusToken);
    expect(saved.interviewToken).toBe(body.interviewToken);
    expect(saved.interviewExpiresAt > new Date()).toBe(true);
    expect(saved.hasStableInternet).toBe(true);            // "mostly" counts as stable
    expect(saved.aiToolsList).toEqual(['chatgpt']);          // unknown tools dropped
    expect(saved.subjectRelation).toBe('uni');

    expect(state.mails[0].template).toBe('application_received');
    expect(state.mails[0].data.statusLink).toContain(`/join/status?token=${body.statusToken}`);
    expect(state.mails[0].data.interviewLink).toContain(`/interview?token=${body.interviewToken}`);
  });

  it('refuses an email that already applied', async () => {
    state.existing = true;
    const res = await request.POST(post(VALID));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('EXISTS');
  });

  it('asks builder roles for their portfolio', async () => {
    state.role = { _id: 'r2', name: 'مطوّر', category: 'development', portfolioPrompt: 'رابط GitHub' };
    expect((await request.POST(post({ ...VALID, subjectsOfInterest: [] }))).status).toBe(400);
    expect((await request.POST(post({ ...VALID, subjectsOfInterest: [], portfolioUrl: 'https://github.com/x' }))).status).toBe(201);
  });
});

describe('GET /api/contributors/status', () => {
  const get = (token) => status.GET(new Request(`http://test/api?token=${token}`));
  const TOKEN = 'a'.repeat(64);

  it('refuses anything that is not a token', async () => {
    expect((await get('abc')).status).toBe(400);
    expect((await get(encodeURIComponent('{"$ne":null}'))).status).toBe(400);
  });

  it('hands out the interview link only while it is the next step', async () => {
    state.found = { name: 'فاطمة', status: 'pending', interviewToken: 'i'.repeat(64), interviewExpiresAt: new Date(Date.now() + 86_400_000), roleId: 'role1', subjectsOfInterest: ['PHYSICS'], createdAt: new Date() };
    let d = (await (await get(TOKEN)).json()).data;
    expect(d.stage).toBe('invited');
    expect(d.interviewToken).toBe('i'.repeat(64));

    state.found = { ...state.found, dynamicAnswersSubmittedAt: new Date() };
    d = (await (await get(TOKEN)).json()).data;
    expect(d.stage).toBe('answered');
    expect(d.interviewToken).toBeNull();
  });

  it('gives an approved applicant their onboarding link', async () => {
    state.found = { name: 'فاطمة', status: 'approved', onboarded: false, onboardingToken: 'o'.repeat(64), roleId: 'role1', createdAt: new Date(), updatedAt: new Date() };
    const d = (await (await get(TOKEN)).json()).data;
    expect(d.stage).toBe('onboarding');
    expect(d.onboardingToken).toBe('o'.repeat(64));
  });
});
