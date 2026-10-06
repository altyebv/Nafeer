// ─── JWT signing key ──────────────────────────────────────────────────────────
// Single source for the key that signs both contributor and admin sessions.
// Dependency-free on purpose: middleware.js runs on the edge runtime and
// imports this too.
//
// This used to be `process.env.JWT_SECRET || '<placeholder>'`, inlined in three
// files. The repository is public, so a deploy that lost the variable would
// have signed sessions with a key anyone can read — and accepted forged admin
// tokens. Production now refuses to run without it; the fallback only exists so
// a fresh clone works locally.
//
// Resolved on call rather than at import so a missing variable fails the
// request, not the build. Callers that verify do so inside try/catch, which
// makes a missing key fail closed: every session reads as signed out.

const DEV_FALLBACK = 'dev-only-secret-not-for-production';

let cached = null;

export function getJwtSecret() {
  if (cached) return cached;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[auth] JWT_SECRET is not set — refusing to sign or verify sessions');
    }
    return new TextEncoder().encode(DEV_FALLBACK);
  }

  cached = new TextEncoder().encode(secret);
  return cached;
}
