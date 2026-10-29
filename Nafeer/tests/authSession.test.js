import { beforeEach, describe, expect, it, vi } from 'vitest';

let payload = { id: 'contributor_1', sessionVersion: 0 };
let contributor = { sessionVersion: 0 };
let cookieToken = 'signed.jwt';

const query = {
  select: vi.fn(() => query),
  lean: vi.fn(async () => contributor),
};
const findById = vi.fn(() => query);

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: () => cookieToken ? { value: cookieToken } : undefined,
  })),
}));
vi.mock('jose', () => ({
  SignJWT: class {},
  jwtVerify: vi.fn(async () => ({ payload })),
}));
vi.mock('@/lib/jwtSecret', () => ({ getJwtSecret: vi.fn(() => new Uint8Array()) }));
vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/models/Contributor', () => ({ Contributor: { findById } }));

const { getCurrentUser } = await import('@/lib/auth');

beforeEach(() => {
  payload = { id: 'contributor_1', sessionVersion: 0 };
  contributor = { sessionVersion: 0 };
  cookieToken = 'signed.jwt';
  findById.mockClear();
  query.select.mockClear();
  query.lean.mockClear();
});

describe('contributor session version', () => {
  it('accepts a current contributor session', async () => {
    await expect(getCurrentUser()).resolves.toMatchObject({ id: 'contributor_1', sessionVersion: 0 });
    expect(findById).toHaveBeenCalledWith('contributor_1');
  });

  it('rejects a session issued before a password reset', async () => {
    contributor = { sessionVersion: 1 };
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it('treats pre-version sessions as version zero until a password reset', async () => {
    payload = { id: 'contributor_1' };
    contributor = {};
    await expect(getCurrentUser()).resolves.toMatchObject({ id: 'contributor_1' });
  });

  it('rejects sessions for deleted contributors', async () => {
    contributor = null;
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it('does not perform a second lookup when a guard will validate the version in its own read', async () => {
    await expect(getCurrentUser({ skipSessionVersionCheck: true })).resolves.toMatchObject({ id: 'contributor_1' });
    expect(findById).not.toHaveBeenCalled();
  });

  it('rejects a missing cookie', async () => {
    cookieToken = null;
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(findById).not.toHaveBeenCalled();
  });
});
