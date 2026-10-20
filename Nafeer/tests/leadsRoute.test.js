import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── /api/admin/leads ─────────────────────────────────────────────────────────
// Appoint, adjust and remove leads. Only the owner; at most two per subject;
// a body can set permissions and nothing else; removing needs a reason.

const state = { admin: { id: 'admin', username: 'owner', role: 'admin' } };

vi.mock('@/lib/adminAuth', () => ({ verifyAdminToken: vi.fn(async () => state.admin) }));
vi.mock('@/lib/db',        () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal()),
  after: (fn) => fn(),
}));
vi.mock('@/lib/models/AuditEvent', () => ({ AuditEvent: { create: vi.fn(async (d) => d), aggregate: vi.fn(async () => []) } }));
vi.mock('@/lib/models/Appeal', () => ({ Appeal: { aggregate: vi.fn(async () => []) } }));

// A small in-memory Contributor with the calls the route makes.
const people = [];
const q = (v) => ({ select: () => q(v), sort: () => q(v), lean: async () => v });
const byId = (id) => people.find((p) => p._id === id) ?? null;
const matches = (p, f) => Object.entries(f).every(([k, v]) =>
  k.split('.').reduce((o, part) => o?.[part], p) === v);

vi.mock('@/lib/models/Contributor', () => ({
  Contributor: {
    findById: vi.fn((id) => q(byId(id))),
    find: vi.fn((f) => q(people.filter((p) => matches(p, f)))),
    countDocuments: vi.fn(async (f) => people.filter((p) => matches(p, f)).length),
    findByIdAndUpdate: vi.fn((id, { $set }) => {
      const p = byId(id);
      for (const [k, v] of Object.entries($set)) {
        if (k.startsWith('lead.')) p.lead = { ...p.lead, [k.slice(5)]: v };
        else p[k] = v;
      }
      return q(p);
    }),
    updateOne: vi.fn(async ({ _id }, { $set }) => {
      const p = byId(_id);
      for (const [k, v] of Object.entries($set)) p.lead = { ...p.lead, [k.slice(5)]: v };
      return { matchedCount: 1 };
    }),
  },
}));

const { AuditEvent } = await import('@/lib/models/AuditEvent');
const { GET, POST, PATCH, DELETE } = await import('@/app/api/admin/leads/route');

const ID = (n) => n.toString(16).padStart(24, '0');
const req = (body) => new Request('http://test/api/admin/leads', {
  method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' },
});

beforeEach(() => {
  state.admin = { id: 'admin', username: 'owner', role: 'admin' };
  people.length = 0;
  people.push(
    { _id: ID(1), name: 'أ', status: 'approved', subject: 'PHYSICS' },
    { _id: ID(2), name: 'ب', status: 'approved', subject: 'PHYSICS' },
    { _id: ID(3), name: 'ج', status: 'approved', subject: 'PHYSICS' },
    { _id: ID(4), name: 'د', status: 'pending',  subject: 'PHYSICS' },
    { _id: ID(5), name: 'هـ', status: 'approved', subject: 'GEOGRAPHY',
      lead: { active: true, subject: 'PHYSICS', canReview: true } },   // moved away
  );
  AuditEvent.create.mockClear();
});

describe('POST — appoint', () => {
  it('refuses anyone who is not the owner', async () => {
    state.admin = null;
    expect((await POST(req({ contributorId: ID(1) }))).status).toBe(401);
  });

  it('appoints with the defaults, the body only adding permissions', async () => {
    const res = await POST(req({ contributorId: ID(1), canPublish: true, active: false, subject: 'MATH' }));
    expect(res.status).toBe(201);
    expect(byId(ID(1)).lead).toMatchObject({
      active: true, subject: 'PHYSICS', canReview: true, canPublish: true, canIntervene: false,
      appointedBy: 'owner',
    });
    expect(AuditEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'lead.appoint', actorKind: 'admin', subjectId: 'PHYSICS',
    }));
  });

  it('allows a co-lead and refuses a third', async () => {
    expect((await POST(req({ contributorId: ID(1) }))).status).toBe(201);
    expect((await POST(req({ contributorId: ID(2) }))).status).toBe(201);
    expect((await POST(req({ contributorId: ID(3) }))).status).toBe(409);
  });

  it('does not count a lead who has moved to another subject', async () => {
    await POST(req({ contributorId: ID(1) }));
    expect((await POST(req({ contributorId: ID(2) }))).status).toBe(201);
  });

  it('refuses an applicant who is not approved, and an unknown id', async () => {
    expect((await POST(req({ contributorId: ID(4) }))).status).toBe(400);
    expect((await POST(req({ contributorId: ID(99) }))).status).toBe(404);
    expect((await POST(req({ contributorId: { $ne: null } }))).status).toBe(404);
  });

  it('refuses appointing a current lead twice', async () => {
    await POST(req({ contributorId: ID(1) }));
    expect((await POST(req({ contributorId: ID(1) }))).status).toBe(409);
  });
});

describe('GET', () => {
  it('lists current leads only', async () => {
    await POST(req({ contributorId: ID(1) }));
    const { leads } = await (await GET()).json();
    expect(leads.map((l) => l._id)).toEqual([ID(1)]);
  });
});

describe('PATCH — permissions', () => {
  it('changes permissions and logs from → to', async () => {
    await POST(req({ contributorId: ID(1) }));
    const res = await PATCH(req({ contributorId: ID(1), canIntervene: true }));
    expect(res.status).toBe(200);
    expect(byId(ID(1)).lead.canIntervene).toBe(true);
    expect(AuditEvent.create).toHaveBeenLastCalledWith(expect.objectContaining({
      action: 'lead.update',
      meta: expect.objectContaining({
        from: expect.objectContaining({ canIntervene: false }),
        to:   expect.objectContaining({ canIntervene: true }),
      }),
    }));
  });

  it('refuses an empty change and a non-lead', async () => {
    await POST(req({ contributorId: ID(1) }));
    expect((await PATCH(req({ contributorId: ID(1), active: false }))).status).toBe(400);
    expect((await PATCH(req({ contributorId: ID(2), canPublish: true }))).status).toBe(404);
  });
});

describe('DELETE — remove', () => {
  it('needs a reason', async () => {
    await POST(req({ contributorId: ID(1) }));
    expect((await DELETE(req({ contributorId: ID(1), reason: 'لا' }))).status).toBe(400);
    expect(byId(ID(1)).lead.active).toBe(true);
  });

  it('turns the lead off and logs why', async () => {
    await POST(req({ contributorId: ID(1) }));
    const res = await DELETE(req({ contributorId: ID(1), reason: 'انتقل إلى فريق التصميم' }));
    expect(res.status).toBe(200);
    expect(byId(ID(1)).lead.active).toBe(false);
    expect(AuditEvent.create).toHaveBeenLastCalledWith(expect.objectContaining({
      action: 'lead.remove', reason: 'انتقل إلى فريق التصميم',
    }));
  });

  it('can clear a lead record left over from a previous subject', async () => {
    expect((await DELETE(req({ contributorId: ID(5), reason: 'نُقل إلى مادة الجغرافيا' }))).status).toBe(200);
    expect(byId(ID(5)).lead.active).toBe(false);
  });
});
