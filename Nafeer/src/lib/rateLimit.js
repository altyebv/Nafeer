import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RateLimit } from '@/lib/models/RateLimit';

// ─── Per-IP fixed-window rate limiting ────────────────────────────────────────
// Serverless instances share nothing in memory, so the counter lives in Mongo:
// one atomic upsert-and-increment per request, rows expired by a TTL index.
// Fails open — a limiter outage must not take sign-in down with it.

export const LIMITS = {
  signin:             { limit: 10, windowSec: 15 * 60 },
  adminLogin:         { limit: 5,  windowSec: 15 * 60 },
  contributorRequest: { limit: 3,  windowSec: 60 * 60 },
  support:            { limit: 5,  windowSec: 60 * 60 },
  visit:              { limit: 60, windowSec: 10 * 60 },
};

export function clientIp(request) {
  // Vercel sets x-real-ip and overwrites x-forwarded-for, so neither can be
  // spoofed by the caller there.
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return 'unknown';
}

// Counts this request against `bucket` and reports whether it is over.
export async function hit(bucket, ip, { limit, windowSec }, now = Date.now()) {
  const windowMs = windowSec * 1000;
  const index    = Math.floor(now / windowMs);
  const ipHash   = createHash('sha256').update(ip).digest('hex').slice(0, 32);
  const _id      = `${bucket}:${ipHash}:${index}`;
  const resetAt  = (index + 1) * windowMs;

  const bump = () =>
    RateLimit.findOneAndUpdate(
      { _id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(resetAt) } },
      { upsert: true, new: true }
    ).lean();

  let row;
  try {
    row = await bump();
  } catch (err) {
    // Two first requests racing on the upsert: one loses with E11000, and the
    // row now exists, so a second try just increments it.
    if (err?.code !== 11000) throw err;
    row = await bump();
  }

  return {
    limited:    row.count > limit,
    remaining:  Math.max(0, limit - row.count),
    retryAfter: Math.ceil((resetAt - now) / 1000),
  };
}

// Route helper: returns a 429 response when the caller is over the limit,
// null otherwise. `body` lets a route keep its own response shape.
export async function rateLimit(request, bucket, body = {}) {
  try {
    await connectDB();
    const result = await hit(bucket, clientIp(request), LIMITS[bucket]);
    if (!result.limited) return null;
    return NextResponse.json(
      { message: 'محاولات كثيرة. يرجى المحاولة لاحقاً.', ...body },
      { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
    );
  } catch (err) {
    console.error(`[rateLimit:${bucket}]`, err);
    return null;
  }
}
