import { getCurrentUser } from '@/lib/auth';
import { getAdminAsUser } from '@/lib/adminAuth';

// Use at the top of any content API route handler.
// Returns the contributor/admin JWT payload, or throws a Response if unauthorized.
export async function requireContributor() {
  const user = await getAdminAsUser() || await getCurrentUser();
  if (!user) {
    throw Response.json({ ok: false, error: 'غير مصرح' }, { status: 401 });
  }
  return user;
}

// Like requireContributor, but also checks the user is assigned
// to the requested subjectId (or is an admin).
//
// Admins always pass — they are not bound to a single subject and must
// be able to access all subjects, including test/remote subjects created
// outside the main curriculum catalog.
export async function requireSubjectAccess(subjectId) {
  if (!subjectId) {
    throw Response.json(
      { ok: false, error: 'subjectId مطلوب' },
      { status: 400 }
    );
  }

  const user = await requireContributor();

  // Admins bypass the subject assignment check entirely.
  if (user.role === 'admin') return user;

  // Contributors must be assigned to exactly this subject.
  if (user.subject !== subjectId) {
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