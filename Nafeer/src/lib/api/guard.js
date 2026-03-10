import { getCurrentUser } from '@/lib/auth';

// ─── requireContributor ───────────────────────────────────────────────────────
// Use at the top of any content API route handler.
// Returns the contributor JWT payload, or throws a Response if unauthorized.
//
// Usage:
//   const user = await requireContributor();
//   // user.id, user.subject, user.role are available
//
export async function requireContributor() {
  const user = await getCurrentUser();
  if (!user) {
    throw Response.json({ ok: false, error: 'غير مصرح' }, { status: 401 });
  }
  return user;
}

// ─── requireSubjectAccess ─────────────────────────────────────────────────────
// Like requireContributor, but also checks the contributor is assigned
// to the requested subjectId (or is an admin).
//
export async function requireSubjectAccess(subjectId) {
  const user = await requireContributor();

  const isAdmin = user.role === 'admin';
  const isAssigned = user.subject === subjectId;

  if (!isAdmin && !isAssigned) {
    throw Response.json(
      { ok: false, error: 'ليس لديك صلاحية الوصول إلى هذه المادة' },
      { status: 403 }
    );
  }

  return user;
}

// ─── ok / err ─────────────────────────────────────────────────────────────────
// Standard response helpers — keeps route handlers clean.

export const ok = (data, extra = {}) =>
  Response.json({ ok: true, ...extra, data });

export const err = (message, status = 400) =>
  Response.json({ ok: false, error: message }, { status });