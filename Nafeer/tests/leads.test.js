import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signInAs, signInAsAdmin, signOut } from './helpers/session.js';

vi.mock('@/lib/auth',      async () => (await import('./helpers/session.js')).authMock);
vi.mock('@/lib/adminAuth', async () => (await import('./helpers/session.js')).adminAuthMock);
vi.mock('@/lib/db',        () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/models/Contributor', async () => ({
  Contributor: (await import('./helpers/fakeModel.js')).fakeModel(),
}));
vi.mock('@/lib/models/AuditEvent', () => ({ AuditEvent: { create: vi.fn(async (d) => d) } }));
vi.mock('@/lib/models/Lesson', () => ({ Lesson: { updateOne: vi.fn() } }));

const { Contributor } = await import('@/lib/models/Contributor');
const { AuditEvent }  = await import('@/lib/models/AuditEvent');
const { fakeModel }   = await import('./helpers/fakeModel.js');
const {
  LEAD_PERMISSIONS, DEFAULT_LEAD_PERMISSIONS, leadCan, normaliseLead, pickLeadPermissions,
  isPaused, buildPause, isLeadAvailable,
} = await import('@/lib/leads');
const { requireContributor, requireLead, requireLeadOfContent } = await import('@/lib/api/guard');
const { validateAudit, recordAudit, AuditError } = await import('@/lib/audit');
const { lessonOwnerId, isOwnWork, withCredit } = await import('@/lib/credits');

async function refusal(fn) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  throw new Error('expected the guard to refuse');
}

const ALL_ON  = Object.fromEntries(LEAD_PERMISSIONS.map((p) => [p, true]));
const ALL_OFF = Object.fromEntries(LEAD_PERMISSIONS.map((p) => [p, false]));

// ─── The rules ────────────────────────────────────────────────────────────────

describe('normaliseLead', () => {
  it('is null for a non-lead', () => {
    expect(normaliseLead(undefined, 'PHYSICS')).toBeNull();
    expect(normaliseLead({ active: false, subject: 'PHYSICS' }, 'PHYSICS')).toBeNull();
  });

  it('is null once the contributor has been moved to another subject', () => {
    expect(normaliseLead({ active: true, subject: 'PHYSICS', ...ALL_ON }, 'GEOGRAPHY')).toBeNull();
  });

  it('fills permissions missing from older documents with the defaults', () => {
    const lead = normaliseLead({ active: true, subject: 'PHYSICS', canPublish: true }, 'PHYSICS');
    expect(lead).toEqual({ active: true, subject: 'PHYSICS', ...DEFAULT_LEAD_PERMISSIONS, canPublish: true, awayUntil: null });
  });

  it('starts the risky permissions off', () => {
    expect(DEFAULT_LEAD_PERMISSIONS).toMatchObject({
      canReview: true, canManageTeam: true,
      canDecideApplicants: false, canEditInterview: false, canIntervene: false, canPublish: false,
    });
  });
});

describe('leadCan — the permission matrix', () => {
  const physicsLead = (perms) => ({
    id: 'c1', role: 'contributor', subject: 'PHYSICS',
    lead: { active: true, subject: 'PHYSICS', ...perms },
  });
  const callers = {
    member:          { id: 'm', role: 'contributor', subject: 'PHYSICS', lead: null },
    leadHere:        physicsLead(ALL_ON),
    leadWithoutPerm: physicsLead(ALL_OFF),
    leadElsewhere:   { ...physicsLead(ALL_ON), subject: 'GEOGRAPHY',
                       lead: { active: true, subject: 'GEOGRAPHY', ...ALL_ON } },
    admin:           { id: 'admin', role: 'admin', subject: null },
  };
  const expected = { member: false, leadHere: true, leadWithoutPerm: false, leadElsewhere: false, admin: true };

  for (const perm of LEAD_PERMISSIONS) {
    for (const [who, user] of Object.entries(callers)) {
      it(`${perm} on PHYSICS: ${who} → ${expected[who]}`, () => {
        expect(leadCan(user, perm, 'PHYSICS')).toBe(expected[who]);
      });
    }
  }

  it('refuses a missing subject for everyone but the owner', () => {
    expect(leadCan(callers.leadHere, 'canReview', '')).toBe(false);
    expect(leadCan(callers.admin, 'canReview', '')).toBe(true);
  });

  it('throws on a permission name that does not exist', () => {
    expect(() => leadCan(callers.admin, 'canEverything', 'PHYSICS')).toThrow();
  });
});

describe('pickLeadPermissions', () => {
  it('keeps known booleans and drops everything else', () => {
    expect(pickLeadPermissions({
      canPublish: true, canReview: 'yes', active: false, since: 'x', subject: 'MATH', isAdmin: true,
    })).toEqual({ canPublish: true });
  });
});

// ─── The guard ────────────────────────────────────────────────────────────────

const Lesson = fakeModel([
  { contentId: 'les_phys', subjectId: 'PHYSICS', createdBy: 'c_member' },
  { contentId: 'les_geo',  subjectId: 'GEOGRAPHY', createdBy: 'c_other' },
]);

beforeEach(() => {
  Contributor.seed([
    { _id: 'c_member', status: 'approved', subject: 'PHYSICS' },
    { _id: 'c_lead',   status: 'approved', subject: 'PHYSICS',
      lead: { active: true, subject: 'PHYSICS', canReview: true, canPublish: false } },
    { _id: 'c_moved',  status: 'approved', subject: 'GEOGRAPHY',
      lead: { active: true, subject: 'PHYSICS', canReview: true } },
    { _id: 'c_former', status: 'approved', subject: 'PHYSICS',
      lead: { active: false, subject: 'PHYSICS', canReview: true } },
    { _id: 'c_rejected_lead', status: 'rejected', subject: 'PHYSICS',
      lead: { active: true, subject: 'PHYSICS', canReview: true } },
  ]);
  signOut();
});

describe('requireContributor carries the lead record', () => {
  it('normalised for a lead, null for a member', async () => {
    signInAs({ id: 'c_lead', role: 'contributor' });
    expect((await requireContributor()).lead).toMatchObject({ active: true, canReview: true, canPublish: false });
    signInAs({ id: 'c_member', role: 'contributor' });
    expect((await requireContributor()).lead).toBeNull();
  });
});

describe('requireLead', () => {
  it('lets a lead with the permission through on their subject', async () => {
    signInAs({ id: 'c_lead', role: 'contributor' });
    await expect(requireLead('PHYSICS', 'canReview')).resolves.toMatchObject({ id: 'c_lead' });
  });

  it('refuses a permission the lead was not given', async () => {
    signInAs({ id: 'c_lead', role: 'contributor' });
    expect((await refusal(() => requireLead('PHYSICS', 'canPublish'))).status).toBe(403);
  });

  it('refuses a lead on another subject', async () => {
    signInAs({ id: 'c_lead', role: 'contributor' });
    expect((await refusal(() => requireLead('GEOGRAPHY', 'canReview'))).status).toBe(403);
  });

  it('refuses a plain member', async () => {
    signInAs({ id: 'c_member', role: 'contributor' });
    expect((await refusal(() => requireLead('PHYSICS', 'canReview'))).status).toBe(403);
  });

  it('refuses a lead who was moved to another subject — on both subjects', async () => {
    signInAs({ id: 'c_moved', role: 'contributor' });
    expect((await refusal(() => requireLead('PHYSICS', 'canReview'))).status).toBe(403);
    expect((await refusal(() => requireLead('GEOGRAPHY', 'canReview'))).status).toBe(403);
  });

  it('refuses a removed lead on their next request', async () => {
    signInAs({ id: 'c_former', role: 'contributor' });
    expect((await refusal(() => requireLead('PHYSICS', 'canReview'))).status).toBe(403);
  });

  it('signs out a lead whose account was rejected', async () => {
    signInAs({ id: 'c_rejected_lead', role: 'contributor' });
    expect((await refusal(() => requireLead('PHYSICS', 'canReview'))).status).toBe(401);
  });

  it('lets the owner through anywhere', async () => {
    signInAsAdmin();
    await expect(requireLead('GEOGRAPHY', 'canPublish')).resolves.toMatchObject({ role: 'admin' });
  });

  it('asks for a subject', async () => {
    signInAsAdmin();
    expect((await refusal(() => requireLead('', 'canReview'))).status).toBe(400);
  });
});

describe('requireLeadOfContent', () => {
  it('uses the document\'s subject and returns its authorship', async () => {
    signInAs({ id: 'c_lead', role: 'contributor' });
    const { doc } = await requireLeadOfContent(Lesson, 'les_phys', 'canReview');
    expect(doc).toMatchObject({ subjectId: 'PHYSICS', createdBy: 'c_member' });
  });

  it('refuses a document in another subject', async () => {
    signInAs({ id: 'c_lead', role: 'contributor' });
    expect((await refusal(() => requireLeadOfContent(Lesson, 'les_geo', 'canReview'))).status).toBe(403);
  });

  it('returns 404 for a missing document and never queries with an object id', async () => {
    signInAs({ id: 'c_lead', role: 'contributor' });
    expect((await refusal(() => requireLeadOfContent(Lesson, 'nope', 'canReview'))).status).toBe(404);
    Lesson.findOne.mockClear();
    expect((await refusal(() => requireLeadOfContent(Lesson, { $ne: null }, 'canReview'))).status).toBe(404);
    expect(Lesson.findOne).not.toHaveBeenCalled();
  });
});

// ─── The audit log ────────────────────────────────────────────────────────────

describe('validateAudit', () => {
  it('refuses an unknown action', () => {
    expect(() => validateAudit({ action: 'lesson.delete_everything' })).toThrow(AuditError);
  });

  it('asks for a reason where the action affects someone else', () => {
    expect(() => validateAudit({ action: 'lesson.intervene', reason: 'typo' }))
      .toThrow(expect.objectContaining({ code: 'REASON_REQUIRED' }));
    expect(validateAudit({ action: 'lesson.intervene', reason: '  خطأ علمي في القسم الثاني  ' }))
      .toBe('خطأ علمي في القسم الثاني');
  });

  it('does not ask for a reason on an approval', () => {
    expect(validateAudit({ action: 'lesson.approve' })).toBe('');
  });
});

describe('recordAudit', () => {
  it('writes a normalised entry', async () => {
    AuditEvent.create.mockClear();
    await recordAudit({ id: 'c_lead', name: 'سارة', kind: 'lead' }, {
      action: 'lesson.approve', subjectId: 'PHYSICS', target: { kind: 'lesson', id: 'les_phys', label: 'الحركة' },
    });
    expect(AuditEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'c_lead', actorKind: 'lead', action: 'lesson.approve', subjectId: 'PHYSICS',
      target: { kind: 'lesson', id: 'les_phys', label: 'الحركة' },
    }));
  });

  it('never throws into the caller, even when the write fails', async () => {
    AuditEvent.create.mockRejectedValueOnce(new Error('atlas down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(recordAudit({ id: 'x', kind: 'lead' }, { action: 'lesson.approve' })).resolves.toBeNull();
    warn.mockRestore();
  });
});

// ─── Ownership and credit ─────────────────────────────────────────────────────

describe('lesson ownership', () => {
  it('the owner is the author until someone takes over', () => {
    expect(lessonOwnerId({ createdBy: 'a' })).toBe('a');
    expect(lessonOwnerId({ createdBy: 'a', ownerId: 'b' })).toBe('b');
  });

  it('four-eyes: the author and the current owner both count as their own work', () => {
    const lesson = { createdBy: 'a', ownerId: 'b' };
    expect(isOwnWork(lesson, 'a')).toBe(true);
    expect(isOwnWork(lesson, 'b')).toBe(true);
    expect(isOwnWork(lesson, 'c')).toBe(false);
    expect(isOwnWork(lesson, null)).toBe(false);
  });
});

describe('withCredit', () => {
  const t1 = new Date('2026-10-01');
  const t2 = new Date('2026-10-19');

  it('keeps one entry per contributor and kind, refreshing the date', () => {
    let credits = withCredit([], { contributorId: 'lead', name: 'سارة', kind: 'editor' }, t1);
    credits = withCredit(credits, { contributorId: 'lead', name: 'سارة', kind: 'editor' }, t2);
    expect(credits).toEqual([{ contributorId: 'lead', name: 'سارة', kind: 'editor', at: t2 }]);
  });

  it('keeps separate kinds for the same person', () => {
    let credits = withCredit([], { contributorId: 'lead', kind: 'editor' }, t1);
    credits = withCredit(credits, { contributorId: 'lead', kind: 'reviewer' }, t1);
    expect(credits.map((c) => c.kind)).toEqual(['editor', 'reviewer']);
  });

  it('refuses an unknown kind', () => {
    expect(() => withCredit([], { contributorId: 'x', kind: 'owner' })).toThrow();
  });
});

// ─── L2: pausing and availability ─────────────────────────────────────────────

describe('isPaused / buildPause', () => {
  const now = new Date('2026-10-19T12:00:00Z');
  const by = { id: 'lead', name: 'سارة' };

  it('a pause with an end date lifts itself', () => {
    const p = buildPause({ days: 3, reason: 'مراجعة الأسلوب أولاً', by }, now);
    expect(isPaused(p, now)).toBe(true);
    expect(isPaused(p, new Date('2026-10-22T12:00:01Z'))).toBe(false);
  });

  it('no days means until a lead lifts it', () => {
    const p = buildPause({ days: null, reason: 'x'.repeat(10), by }, now);
    expect(p.until).toBeNull();
    expect(isPaused(p, new Date('2030-01-01'))).toBe(true);
    expect(isPaused({ ...p, active: false }, now)).toBe(false);
  });

  it('refuses a length outside 1..30 days', () => {
    for (const days of [-1, 31, 2.5, '7']) {
      expect(() => buildPause({ days, reason: 'x', by }, now)).toThrow();
    }
  });
});

describe('isLeadAvailable', () => {
  const now = new Date('2026-10-19T12:00:00Z');
  const lead = (extra = {}, lastActiveAt = '2026-10-18') => ({
    lead: { active: true, subject: 'PHYSICS', ...extra }, stats: { lastActiveAt },
  });

  it('a recently active lead is available', () => {
    expect(isLeadAvailable(lead(), now)).toBe(true);
  });

  it('away mode, or two weeks of silence, makes them unavailable', () => {
    expect(isLeadAvailable(lead({ awayUntil: '2026-10-25' }), now)).toBe(false);
    expect(isLeadAvailable(lead({ awayUntil: '2026-10-01' }), now)).toBe(true);
    expect(isLeadAvailable(lead({}, '2026-10-01'), now)).toBe(false);
  });

  it('a new lead with no recorded activity counts as available', () => {
    expect(isLeadAvailable(lead({}, null), now)).toBe(true);
  });
});

describe('the guard and a paused member', () => {
  beforeEach(() => {
    Contributor.seed([
      { _id: 'c_paused',  status: 'approved', subject: 'PHYSICS',
        paused: { active: true, until: null, reason: 'راجع ملاحظات الجولة السابقة' } },
      { _id: 'c_expired', status: 'approved', subject: 'PHYSICS',
        paused: { active: true, until: new Date('2020-01-01'), reason: 'قديم' } },
    ]);
  });

  it('reads still work', async () => {
    signInAs({ id: 'c_paused', role: 'contributor' });
    await expect(requireContributor()).resolves.toMatchObject({ id: 'c_paused' });
  });

  it('writes are refused with the reason', async () => {
    signInAs({ id: 'c_paused', role: 'contributor' });
    const res = await refusal(() => requireContributor({ write: true }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('PAUSED');
    expect(body.error).toContain('راجع ملاحظات الجولة السابقة');
  });

  it('an expired pause no longer blocks', async () => {
    signInAs({ id: 'c_expired', role: 'contributor' });
    await expect(requireContributor({ write: true })).resolves.toMatchObject({ id: 'c_expired' });
  });
});
