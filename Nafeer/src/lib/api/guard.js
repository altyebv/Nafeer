import { getCurrentUser } from '@/lib/auth';
import { getAdminAsUser } from '@/lib/adminAuth';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

const unauthorized = () =>
  Response.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

const forbidden = () =>
  Response.json(
    { ok: false, error: 'ليس لديك صلاحية الوصول إلى هذه المادة' },
    { status: 403 }
  );

const notFound = () =>
  Response.json({ ok: false, error: 'غير موجود' }, { status: 404 });

// Use at the top of any content API route handler.
// Returns the contributor/admin JWT payload, or throws a Response if unauthorized.
//
// A contributor's JWT lives for 7 days and carries their subject, so on its own
// it outlives a rejection and keeps a subject the admin has since changed. The
// record is read back on every call: anyone no longer approved is signed out,
// and `subject` is always the one on file.
export async function requireContributor() {
  const admin = await getAdminAsUser();
  if (admin) return admin;

  const user = await getCurrentUser();
  if (!user?.id) throw unauthorized();

  await connectDB();
  const contributor = await Contributor.findById(user.id).select('status subject').lean();
  if (!contributor || contributor.status !== 'approved') throw unauthorized();

  return { ...user, subject: contributor.subject || null };
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
  if (!user.subject || user.subject !== subjectId) throw forbidden();

  return user;
}

// For routes addressed by a document's contentId ([id] routes). Loads the
// document's subject and applies the same rule as requireSubjectAccess, so a
// contributor can't reach another subject's content just by knowing its id.
// Returns { user, doc } where doc carries only contentId and subjectId.
export async function requireContentAccess(Model, contentId) {
  const user = await requireContributor();

  if (typeof contentId !== 'string' || !contentId) throw notFound();

  await connectDB();
  const doc = await Model.findOne({ contentId }).select('contentId subjectId').lean();
  if (!doc) throw notFound();

  if (user.role !== 'admin' && (!user.subject || doc.subjectId !== user.subject)) {
    throw forbidden();
  }

  return { user, doc };
}

// For batch writes. Throws 403 unless every existing document of Model whose
// contentId is in `ids` belongs to the user's subject. Ids with no document
// yet pass — the caller checks the subject a new document is created under.
// Every id must be a string: they go into a Mongo $in filter.
export async function assertInSubject(user, Model, ids) {
  if (ids.some((id) => id != null && typeof id !== 'string')) {
    throw Response.json({ ok: false, error: 'معرّف غير صالح' }, { status: 400 });
  }
  if (user.role === 'admin') return;
  if (!user.subject) throw forbidden();

  const wanted = [...new Set(ids.filter(Boolean))];
  if (wanted.length === 0) return;

  await connectDB();
  const outside = await Model.exists({
    contentId: { $in: wanted },
    subjectId: { $ne: user.subject },
  });
  if (outside) throw forbidden();
}

// Standard response helpers - keeps route handlers clean.
export const ok = (data, extra = {}) =>
  Response.json({ ok: true, ...extra, data });

export const err = (message, status = 400) =>
  Response.json({ ok: false, error: message }, { status });
