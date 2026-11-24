import { describe, it, expect, beforeEach, vi } from 'vitest';

const state = vi.hoisted(() => ({
  admin: true,
  existing: false,
  created: null,
  emailResult: { ok: true },
}));

vi.mock('@/lib/adminAuth', () => ({
  verifyAdminToken: vi.fn(async () => state.admin ? { id: 'admin' } : null),
}));
vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/models/Contributor', () => ({
  Contributor: {
    exists: vi.fn(async () => state.existing),
    create: vi.fn(async (doc) => {
      state.created = doc;
      return { _id: 'contributor-1' };
    }),
  },
}));
vi.mock('@/lib/email/emailService', () => ({
  sendEmail: vi.fn(async () => state.emailResult),
}));

const { Contributor } = await import('@/lib/models/Contributor');
const { sendEmail } = await import('@/lib/email/emailService');
const route = await import('@/app/api/admin/contributors/invite/route.js');

const post = (body) => new Request('http://test/api/admin/contributors/invite', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

beforeEach(() => {
  vi.clearAllMocks();
  state.admin = true;
  state.existing = false;
  state.created = null;
  state.emailResult = { ok: true };
});

describe('POST /api/admin/contributors/invite', () => {
  it('requires an admin session', async () => {
    state.admin = false;
    expect((await route.POST(post({ name: 'Nura', email: 'nura@example.com' }))).status).toBe(401);
    expect(Contributor.create).not.toHaveBeenCalled();
  });

  it('validates required fields and the optional subject', async () => {
    expect((await route.POST(post(null))).status).toBe(400);
    expect((await route.POST(post({ name: '', email: 'nura@example.com' }))).status).toBe(400);
    expect((await route.POST(post({ name: 'Nura', email: 'not-an-email' }))).status).toBe(400);
    expect((await route.POST(post({ name: 'Nura', email: 'nura@example.com', subject: 'NOPE' }))).status).toBe(400);
    expect((await route.POST(post({ name: 'Nura', email: 'nura@example.com', subject: { $ne: '' } }))).status).toBe(400);
    expect((await route.POST(post({ name: 'Nura', email: 'nura@example.com', emailSubject: 'x'.repeat(161) }))).status).toBe(400);
    expect((await route.POST(post({ name: 'Nura', email: 'nura@example.com', emailBody: 'x'.repeat(5001) }))).status).toBe(400);
    expect(Contributor.create).not.toHaveBeenCalled();
  });

  it('creates an approved, not-yet-onboarded contributor and emails a setup link', async () => {
    const before = Date.now();
    const res = await route.POST(post({
      name: ' Nura Hassan ',
      email: 'NURA@example.com',
      subject: 'PHYSICS',
      emailSubject: 'أهلاً بك',
      emailBody: 'رسالة ترحيب مخصصة',
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.onboardingLink).toContain('/onboard?token=');
    expect(state.created).toMatchObject({
      name: 'Nura Hassan',
      email: 'nura@example.com',
      subject: 'PHYSICS',
      status: 'approved',
      onboarded: false,
    });
    expect(state.created.onboardingToken).toMatch(/^[a-f0-9]{64}$/);
    const expiry = state.created.onboardingExpiresAt.getTime();
    expect(expiry).toBeGreaterThanOrEqual(before + 7 * 24 * 60 * 60 * 1000);
    expect(expiry).toBeLessThanOrEqual(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'nura@example.com',
      template: 'onboarding_invite',
      subject: 'أهلاً بك',
      data: expect.objectContaining({ name: 'Nura Hassan', link: body.onboardingLink, isDirectInvite: true }),
    }));
    expect(sendEmail.mock.calls[0][0].data.body).toBe('رسالة ترحيب مخصصة');
  });

  it('does not duplicate an existing contributor', async () => {
    state.existing = true;
    const res = await route.POST(post({ name: 'Nura', email: 'nura@example.com' }));
    expect(res.status).toBe(409);
    expect(Contributor.create).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns the setup link when email delivery reports failure', async () => {
    state.emailResult = { ok: false, error: 'provider unavailable' };
    const res = await route.POST(post({ name: 'Nura', email: 'nura@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.email).toMatchObject({ ok: false, error: 'provider unavailable' });
    expect(body.onboardingLink).toContain('/onboard?token=');
  });
});
