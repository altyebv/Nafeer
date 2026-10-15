import { vi } from 'vitest';

// ─── Session doubles ──────────────────────────────────────────────────────────
// Stand-ins for '@/lib/auth' and '@/lib/adminAuth'. A test picks who is calling
// with signInAs / signInAsAdmin / signOut; the routes read it through the same
// functions they use in production.

export const session = { contributor: null, admin: null };

export function signInAs(payload) {
  session.contributor = payload;
  session.admin = null;
}

export function signInAsAdmin() {
  session.contributor = null;
  session.admin = { id: 'admin', role: 'admin', subject: null, email: 'admin@test' };
}

export function signOut() {
  session.contributor = null;
  session.admin = null;
}

export const authMock = {
  getCurrentUser:    vi.fn(async () => session.contributor),
  signToken:         vi.fn(async () => 'signed.jwt'),
  setAuthCookie:     vi.fn(async () => {}),
  buildTokenPayload: vi.fn((c) => ({ id: String(c._id) })),
};

export const adminAuthMock = {
  getAdminAsUser: vi.fn(async () => session.admin),
};
