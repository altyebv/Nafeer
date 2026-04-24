import { getCurrentUser } from '@/lib/auth';
import { getAdminAsUser } from '@/lib/adminAuth';

// Use at the top of any content API route handler.
// Returns the contributor/admin JWT payload, or throws a Response if unauthorized.
export async function requireContributor() {
  const user = await getCurrentUser() || await getAdminAsUser();
  if (!user) {
    throw Response.json({ ok: false, error: 'غير مصرح' }, { status: 401 });
  }
  return user;
}

// Like requireContributor, but also checks the user is assigned
// to the requested subjectId (or is an admin).
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

// Standard response helpers - keeps route handlers clean.
export const ok = (data, extra = {}) =>
  Response.json({ ok: true, ...extra, data });

export const err = (message, status = 400) =>
  Response.json({ ok: false, error: message }, { status });
