import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signInAs, signInAsAdmin, signOut } from './helpers/session.js';

// ─── /api/lead/team and /api/content/guide (docs/team-leads.md L2) ────────────
// Pausing, assigning, team announcements, away mode, and the subject guide —
// who may do each, and what each refuses. The real guard runs.

vi.mock('@/lib/auth',      async () => (await import('./helpers/session.js')).authMock);
vi.mock('@/lib/adminAuth', async () => (await import('./helpers/session.js')).adminAuthMock);
vi.mock('@/lib/db',        () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('next/server', async (importOriginal) => ({ ...(await importOriginal()), after: (fn) => fn() }));

const { model } = vi.hoisted(() => ({
  model: (name) => async () => {
    const m = (await import('./helpers/fakeModel.js')).fakeModel();
    // Writes the routes make, applied to the in-memory documents.
    m.updateOne = vi.fn(async (filter, { $set }) => {
      const doc = m.docs.find((d) => Object.entries(filter).every(([k, v]) => d[k] === v));
      if (!doc) return { matchedCount: 0 };
      for (const [k, v] of Object.entries($set)) {
        const [head, tail] = k.split('.');
        if (tail) doc[head] = { ...doc[head], [tail]: v }; else doc[k] = v;
      }
      return { matchedCount: 1 };
    });
    m.create = vi.fn(async (d) => ({ _id: 'a'.repeat(24), ...d }));
    m.findOneAndDelete = vi.fn((filter) => {
      const i = m.docs.findIndex((d) => Object.entries(filter).every(([k, v]) =>
        (v && typeof v === 'object' && '$ne' in v) ? d[k] !== v.$ne
          : Array.isArray(d[k]) ? d[k].includes(v) : d[k] === v));
      const [doc] = i >= 0 ? m.docs.splice(i, 1) : [null];
      return { lean: async () => doc };
    });
    m.findOneAndUpdate = vi.fn((filter, { $set }) => ({ lean: async () => ({ ...filter, ...$set, updatedAt: new Date() }) }));
    return { [name]: m };
  },
}));
vi.mock('@/lib/models/Contributor',  model('Contributor'));
vi.mock('@/lib/models/Lesson',       model('Lesson'));
vi.mock('@/lib/models/announcement', model('Announcement'));
vi.mock('@/lib/models/SubjectGuide', async () => ({
  ...(await model('SubjectGuide')()),
  MAX_HANDBOOK_LENGTH: 20000, MAX_CHECKLIST_ITEMS: 15, MAX_CHECKLIST_ITEM_LENGTH: 200,
}));
vi.mock('@/lib/api/leadTeam', () => ({ getTeam: vi.fn(async (subjectId) => ({ subjectId })) }));
vi.mock('@/lib/audit', async (importOriginal) => ({
  ...(await importOriginal()),
  recordAudit: vi.fn(async () => null),
}));

const { Contributor }  = await import('@/lib/models/Contributor');
const { Lesson }       = await import('@/lib/models/Lesson');
const { Announcement } = await import('@/lib/models/announcement');
const { SubjectGuide } = await import('@/lib/models/SubjectGuide');
const { recordAudit }  = await import('@/lib/audit');
const team  = await import('@/app/api/lead/team/route');
const guide = await import('@/app/api/content/guide/route');

const ID = (n) => n.toString(16).padStart(24, '0');
const LEAD = ID(1), COLEAD = ID(2), MEMBER = ID(3), OTHER = ID(4), MANAGERLESS = ID(5);
const LEADREC = { active: true, subject: 'PHYSICS', canReview: true, canManageTeam: true };

const req = (url, method, body) => new Request(`http://test${url}`, {
  method, ...(body && { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
});
const act = async (body) => {
  const res = await team.POST(req('/api/lead/team', 'POST', body));
  await new Promise((r) => setTimeout(r, 0));
  return res;
};
const as = (id) => signInAs({ id, role: 'contributor', name: id === LEAD ? 'سارة' : 'عضو' });
const byId = (id) => Contributor.docs.find((d) => d._id === id);

beforeEach(() => {
  vi.clearAllMocks();
  Contributor.seed([
    { _id: LEAD,        name: 'سارة',  status: 'approved', subject: 'PHYSICS', lead: LEADREC },
    { _id: COLEAD,      name: 'خالد',  status: 'approved', subject: 'PHYSICS', lead: LEADREC },
    { _id: MEMBER,      name: 'منى',   status: 'approved', subject: 'PHYSICS' },
    { _id: OTHER,       name: 'عمر',   status: 'approved', subject: 'GEOGRAPHY' },
    { _id: MANAGERLESS, name: 'هالة',  status: 'approved', subject: 'PHYSICS',
      lead: { ...LEADREC, canManageTeam: false } },
  ]);
  Lesson.seed([
    { contentId: 'PHY_L1', subjectId: 'PHYSICS',   title: 'الحركة', createdBy: COLEAD },
    { contentId: 'GEO_L1', subjectId: 'GEOGRAPHY', title: 'الخرائط', createdBy: OTHER },
  ]);
  Announcement.seed([
    { _id: ID(10), title: 'من سارة', targetSubjects: ['PHYSICS'], leadAuthorId: LEAD },
    { _id: ID(11), title: 'من خالد', targetSubjects: ['PHYSICS'], leadAuthorId: COLEAD },
  ]);
  signOut();
});

describe('who may manage the team', () => {
  it('a member, and a lead without canManageTeam, are refused', async () => {
    as(MEMBER);
    expect((await act({ action: 'unpause', contributorId: MEMBER })).status).toBe(403);
    as(MANAGERLESS);
    expect((await team.GET(req('/api/lead/team', 'GET'))).status).toBe(403);
  });

  it('an unknown action is refused', async () => {
    as(LEAD);
    expect((await act({ action: 'promote' })).status).toBe(400);
  });
});

describe('pause / unpause', () => {
  it('needs a written reason', async () => {
    as(LEAD);
    expect((await act({ action: 'pause', contributorId: MEMBER, days: 7, reason: 'لا' })).status).toBe(400);
    expect(byId(MEMBER).paused).toBeUndefined();
  });

  it('pauses a member of the subject, with the reason and an end date', async () => {
    as(LEAD);
    const res = await act({ action: 'pause', contributorId: MEMBER, days: 7, reason: 'راجع ملاحظات الجولة الثانية' });
    expect(res.status).toBe(200);
    expect(byId(MEMBER).paused).toMatchObject({ active: true, reason: 'راجع ملاحظات الجولة الثانية', byName: 'سارة' });
    expect(byId(MEMBER).paused.until).toBeInstanceOf(Date);
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ kind: 'lead' }),
      expect.objectContaining({ action: 'member.pause', subjectId: 'PHYSICS' }));
  });

  it('refuses pausing a co-lead, yourself, someone in another subject, or a bad length', async () => {
    as(LEAD);
    const reason = 'سبب واضح بما يكفي';
    expect((await act({ action: 'pause', contributorId: COLEAD, reason })).status).toBe(403);
    expect((await act({ action: 'pause', contributorId: LEAD,   reason })).status).toBe(400);
    expect((await act({ action: 'pause', contributorId: OTHER,  reason })).status).toBe(404);
    expect((await act({ action: 'pause', contributorId: MEMBER, reason, days: 90 })).status).toBe(400);
  });

  it('unpause lifts it', async () => {
    as(LEAD);
    await act({ action: 'pause', contributorId: MEMBER, reason: 'سبب واضح بما يكفي' });
    expect((await act({ action: 'unpause', contributorId: MEMBER })).status).toBe(200);
    expect(byId(MEMBER).paused.active).toBe(false);
    expect((await act({ action: 'unpause', contributorId: MEMBER })).status).toBe(400);
  });
});

describe('assign', () => {
  it('makes a member the lesson\'s owner and tells them', async () => {
    as(LEAD);
    expect((await act({ action: 'assign', contentId: 'PHY_L1', contributorId: MEMBER })).status).toBe(200);
    expect(Lesson.docs[0].ownerId).toBe(MEMBER);
    expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({ targetContributorIds: [MEMBER] }));
    expect(recordAudit).toHaveBeenCalledWith(expect.anything(),
      expect.objectContaining({ action: 'lesson.assign', meta: { from: null, to: MEMBER } }));
  });

  it('null hands it back to the author', async () => {
    as(LEAD);
    await act({ action: 'assign', contentId: 'PHY_L1', contributorId: MEMBER });
    expect((await act({ action: 'assign', contentId: 'PHY_L1', contributorId: null })).status).toBe(200);
    expect(Lesson.docs[0].ownerId).toBeNull();
  });

  it('refuses a lesson or a member from another subject', async () => {
    as(LEAD);
    expect((await act({ action: 'assign', contentId: 'GEO_L1', contributorId: MEMBER })).status).toBe(404);
    expect((await act({ action: 'assign', contentId: 'PHY_L1', contributorId: OTHER })).status).toBe(404);
  });
});

describe('announcements', () => {
  it('goes to the whole subject under the lead\'s name', async () => {
    as(LEAD);
    expect((await act({ action: 'announce', title: 'اجتماع الخميس', body: 'نراجع الوحدة الثالثة.' })).status).toBe(200);
    expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({
      targetSubjects: ['PHYSICS'], authorName: 'سارة', leadAuthorId: LEAD,
    }));
  });

  it('a lead removes only their own', async () => {
    as(LEAD);
    expect((await act({ action: 'unannounce', id: ID(11) })).status).toBe(404);
    expect((await act({ action: 'unannounce', id: ID(10) })).status).toBe(200);
  });

  it('the owner may remove any lead\'s announcement in the subject', async () => {
    signInAsAdmin();
    expect((await act({ action: 'unannounce', id: ID(11), subjectId: 'PHYSICS' })).status).toBe(200);
  });
});

describe('away mode', () => {
  it('a lead sets and ends their own', async () => {
    as(LEAD);
    expect((await act({ action: 'away', days: 7 })).status).toBe(200);
    expect(byId(LEAD).lead.awayUntil).toBeInstanceOf(Date);
    expect((await act({ action: 'away', days: null })).status).toBe(200);
    expect(byId(LEAD).lead.awayUntil).toBeNull();
  });

  it('even a lead without canManageTeam; never a member; bounded length', async () => {
    as(MANAGERLESS);
    expect((await act({ action: 'away', days: 3 })).status).toBe(200);
    as(MEMBER);
    expect((await act({ action: 'away', days: 3 })).status).toBe(403);
    as(LEAD);
    expect((await act({ action: 'away', days: 365 })).status).toBe(400);
  });
});

describe('/api/content/guide', () => {
  const url = '/api/content/guide?subjectId=PHYSICS';

  it('any member of the subject reads it', async () => {
    as(MEMBER);
    expect((await guide.GET(req(url, 'GET'))).status).toBe(200);
    as(OTHER);
    expect((await guide.GET(req(url, 'GET'))).status).toBe(403);
  });

  it('only the lead edits it', async () => {
    as(MEMBER);
    expect((await guide.PUT(req(url, 'PUT', { handbook: 'x' }))).status).toBe(403);
    as(LEAD);
    const res = await guide.PUT(req(url, 'PUT', { handbook: 'اكتب بالفصحى', checklist: [' الأمثلة محلولة ', '', 'المصطلحات موحّدة'] }));
    expect(res.status).toBe(200);
    expect(SubjectGuide.findOneAndUpdate).toHaveBeenCalledWith(
      { subjectId: 'PHYSICS' },
      expect.objectContaining({ $set: expect.objectContaining({ checklist: ['الأمثلة محلولة', 'المصطلحات موحّدة'] }) }),
      expect.anything(),
    );
  });

  it('refuses too many checklist items', async () => {
    as(LEAD);
    const checklist = Array.from({ length: 16 }, (_, i) => `بند ${i}`);
    expect((await guide.PUT(req(url, 'PUT', { checklist }))).status).toBe(400);
  });
});
