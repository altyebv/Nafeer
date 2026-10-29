import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Rate limiter ─────────────────────────────────────────────────────────────
// Pins the medium finding from the security audit (October 2026): sign-in,
// admin login, contributor requests, support and visit counters had no limit.

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/models/RateLimit', async () => ({
  RateLimit: (await import('./helpers/fakeRateLimit.js')).fakeRateLimit(),
}));
vi.mock('@/lib/models/Contributor', async () => ({
  Contributor: (await import('./helpers/fakeModel.js')).fakeModel(),
}));
vi.mock('@/lib/auth', async () => (await import('./helpers/session.js')).authMock);

const { RateLimit }   = await import('@/lib/models/RateLimit');
const { Contributor } = await import('@/lib/models/Contributor');
const { hit, rateLimit, clientIp, LIMITS } = await import('@/lib/rateLimit');
const signin = await import('@/app/api/auth/signin/route.js');

const rule = { limit: 3, windowSec: 60 };
const T0   = 1_800_000_000_000; // a fixed instant aligned to a minute

const from = (ip, body = {}) =>
  new Request('http://test/api', {
    method:  'POST',
    headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` },
    body:    JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  RateLimit.reset();
});

describe('hit', () => {
  it('allows up to the limit, then reports limited', async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await hit('b', '1.1.1.1', rule, T0));
    expect(results.map((r) => r.limited)).toEqual([false, false, false, true]);
    expect(results[2].remaining).toBe(0);
  });

  it('counts each IP and each bucket separately', async () => {
    for (let i = 0; i < 3; i++) await hit('b', '1.1.1.1', rule, T0);
    expect((await hit('b', '2.2.2.2', rule, T0)).limited).toBe(false);
    expect((await hit('other', '1.1.1.1', rule, T0)).limited).toBe(false);
    expect((await hit('b', '1.1.1.1', rule, T0)).limited).toBe(true);
  });

  it('starts a fresh count in the next window, and says when that is', async () => {
    for (let i = 0; i < 4; i++) await hit('b', '1.1.1.1', rule, T0);
    const late = await hit('b', '1.1.1.1', rule, T0 + 59_000);
    expect(late.limited).toBe(true);
    expect(late.retryAfter).toBe(1);
    expect((await hit('b', '1.1.1.1', rule, T0 + 60_000)).limited).toBe(false);
  });

  it('stores a hash of the IP and an expiry at the end of the window', async () => {
    await hit('b', '1.1.1.1', rule, T0);
    const [row] = RateLimit.rows.values();
    expect(row._id).not.toContain('1.1.1.1');
    expect(row.expiresAt.getTime()).toBe(T0 + 60_000);
  });

  it('retries once when two first requests race on the upsert', async () => {
    RateLimit.failNext = Object.assign(new Error('dup'), { code: 11000 });
    expect((await hit('b', '1.1.1.1', rule, T0)).limited).toBe(false);
    expect(RateLimit.findOneAndUpdate).toHaveBeenCalledTimes(2);
  });
});

describe('clientIp', () => {
  it('prefers x-real-ip, then the first x-forwarded-for entry', () => {
    const h = (headers) => new Request('http://test', { headers });
    expect(clientIp(h({ 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '1.1.1.1' }))).toBe('9.9.9.9');
    expect(clientIp(h({ 'x-forwarded-for': ' 1.1.1.1 , 10.0.0.1' }))).toBe('1.1.1.1');
    expect(clientIp(h({}))).toBe('unknown');
  });
});

describe('rateLimit', () => {
  it('returns null under the limit and a 429 with Retry-After over it', async () => {
    const { limit } = LIMITS.support;
    for (let i = 0; i < limit; i++) expect(await rateLimit(from('3.3.3.3'), 'support')).toBeNull();
    const res = await rateLimit(from('3.3.3.3'), 'support', { ok: false });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await res.json()).toMatchObject({ ok: false, message: expect.any(String) });
  });

  it('fails open when the store is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    RateLimit.failNext = new Error('connection refused');
    expect(await rateLimit(from('3.3.3.3'), 'support')).toBeNull();
  });

  it('has a rule for every bucket the routes use', () => {
    for (const bucket of ['signin', 'adminLogin', 'contributorRequest', 'passwordResetRequest', 'passwordResetConfirm', 'support', 'visit']) {
      expect(LIMITS[bucket]).toMatchObject({ limit: expect.any(Number), windowSec: expect.any(Number) });
    }
  });
});

describe('sign-in route', () => {
  it('stops checking passwords once an IP is over the limit', async () => {
    const body = { identifier: 'someone', password: 'guess' };
    for (let i = 0; i < LIMITS.signin.limit; i++) {
      expect((await signin.POST(from('4.4.4.4', body))).status).toBe(401);
    }
    Contributor.findOne.mockClear();

    const res = await signin.POST(from('4.4.4.4', body));
    expect(res.status).toBe(429);
    expect(Contributor.findOne).not.toHaveBeenCalled();

    // A different caller is unaffected.
    expect((await signin.POST(from('5.5.5.5', body))).status).toBe(401);
  });
});
