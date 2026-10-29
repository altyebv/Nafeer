import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

const contributors = [];
const sendEmail = vi.fn(async () => ({ ok: true, id: 'mail_1' }));
const rateLimit = vi.fn(async () => null);
const after = vi.fn((callback) => callback());
const genericResponse = {
  ok: true,
  message: 'إذا كان لهذا البريد حساب مؤهل، فستصلك رسالة برابط إعادة التعيين.',
};

function query(value) {
  const q = {
    select: () => q,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return q;
}

function matchesForRequest(doc, filter) {
  return doc.email === filter.email
    && doc.status === filter.status
    && doc.onboarded === filter.onboarded
    && typeof doc.passwordHash === 'string';
}

const Contributor = {
  findOne: vi.fn((filter) => query(contributors.find((doc) => matchesForRequest(doc, filter)) || null)),
  exists: vi.fn(async (filter) => contributors.some((doc) =>
    doc.passwordResetTokenHash === filter.passwordResetTokenHash
    && doc.passwordResetExpiresAt > filter.passwordResetExpiresAt.$gt
    && doc.status === filter.status
    && doc.onboarded === filter.onboarded
    && typeof doc.passwordHash === 'string'
  ) ? { _id: 'contributor_1' } : null),
  findOneAndUpdate: vi.fn(async (filter, update) => {
    const doc = contributors.find((candidate) =>
      candidate.passwordResetTokenHash === filter.passwordResetTokenHash
      && candidate.passwordResetExpiresAt > filter.passwordResetExpiresAt.$gt
      && candidate.status === filter.status
      && candidate.onboarded === filter.onboarded
      && typeof candidate.passwordHash === 'string'
    );
    if (!doc) return null;
    Object.assign(doc, update.$set);
    for (const [key, increment] of Object.entries(update.$inc || {})) {
      doc[key] = (doc[key] || 0) + increment;
    }
    for (const key of Object.keys(update.$unset)) delete doc[key];
    return doc;
  }),
  hashPassword: vi.fn(async (password) => `bcrypt:${password}`),
};

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/rateLimit', () => ({ rateLimit }));
vi.mock('@/lib/models/Contributor', () => ({ Contributor }));
vi.mock('@/lib/email/emailService', () => ({ sendEmail }));
vi.mock('@/lib/appUrl', () => ({ appUrl: (path) => `https://nafeer.test${path}` }));
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return { ...actual, after };
});

const { POST: requestReset } = await import('@/app/api/auth/password-reset/request/route.js');
const { POST: confirmReset } = await import('@/app/api/auth/password-reset/confirm/route.js');

const post = (body) => new Request('http://localhost/api/auth/password-reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

beforeEach(() => {
  contributors.length = 0;
  sendEmail.mockClear();
  rateLimit.mockClear();
  after.mockClear();
  Contributor.findOne.mockClear();
  Contributor.exists.mockClear();
  Contributor.findOneAndUpdate.mockClear();
  Contributor.hashPassword.mockClear();
});

describe('password reset request', () => {
  it('uses the same response for unknown addresses and does not send an email', async () => {
    const response = await requestReset(post({ email: 'unknown@example.com' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(genericResponse);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('stores only a token hash and emails the one-hour reset link to eligible contributors', async () => {
    const contributor = {
      name: 'Contributor',
      email: 'person@example.com',
      status: 'approved',
      onboarded: true,
      passwordHash: 'existing-hash',
      save: vi.fn(async () => {}),
    };
    contributors.push(contributor);

    const response = await requestReset(post({ email: ' PERSON@example.com ' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(genericResponse);
    expect(contributor.passwordResetTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(contributor.passwordResetExpiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(contributor.passwordResetExpiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 60 * 60 * 1000);
    expect(contributor.save).toHaveBeenCalledOnce();
    expect(after).toHaveBeenCalledOnce();

    const email = sendEmail.mock.calls[0][0];
    const emailedToken = new URL(email.data.link).hash.slice('#token='.length);
    expect(email).toMatchObject({ to: contributor.email, template: 'password_reset' });
    expect(emailedToken).toMatch(/^[a-f0-9]{64}$/);
    expect(contributor.passwordResetTokenHash).toBe(createHash('sha256').update(emailedToken).digest('hex'));
    expect(email.data.link).not.toContain('?token=');
  });
});

describe('password reset confirmation', () => {
  it('hashes the new password and consumes the token atomically', async () => {
    const token = 'a'.repeat(64);
    const contributor = {
      status: 'approved',
      onboarded: true,
      passwordHash: 'old-hash',
      passwordResetTokenHash: createHash('sha256').update(token).digest('hex'),
      passwordResetExpiresAt: new Date(Date.now() + 60_000),
    };
    contributors.push(contributor);
    const storedTokenHash = contributor.passwordResetTokenHash;

    const response = await confirmReset(post({ token, password: 'a-new-password' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
    expect(Contributor.exists).toHaveBeenCalledOnce();
    expect(Contributor.hashPassword).toHaveBeenCalledWith('a-new-password');
    expect(Contributor.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ passwordResetTokenHash: storedTokenHash }),
      expect.objectContaining({
        $set: { passwordHash: 'bcrypt:a-new-password' },
        $inc: { sessionVersion: 1 },
        $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
      }),
      { new: true }
    );
    expect(contributor.passwordHash).toBe('bcrypt:a-new-password');
    expect(contributor.sessionVersion).toBe(1);
    expect(contributor.passwordResetTokenHash).toBeUndefined();
    expect(contributor.passwordResetExpiresAt).toBeUndefined();
  });

  it('rejects expired or already-consumed tokens', async () => {
    const token = 'b'.repeat(64);
    contributors.push({
      status: 'approved',
      onboarded: true,
      passwordHash: 'old-hash',
      passwordResetTokenHash: createHash('sha256').update(token).digest('hex'),
      passwordResetExpiresAt: new Date(Date.now() - 1),
    });

    const response = await confirmReset(post({ token, password: 'a-new-password' }));
    expect(response.status).toBe(400);
    expect(Contributor.hashPassword).not.toHaveBeenCalled();
    expect(Contributor.findOneAndUpdate).not.toHaveBeenCalled();
    expect(contributors[0].passwordHash).toBe('old-hash');
  });

  it('rejects passwords shorter than eight characters before hashing', async () => {
    const response = await confirmReset(post({ token: 'c'.repeat(64), password: 'short' }));
    expect(response.status).toBe(400);
    expect(Contributor.hashPassword).not.toHaveBeenCalled();
  });
});
