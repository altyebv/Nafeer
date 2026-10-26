import { verifyAdminToken } from '@/lib/adminAuth';
import { connectDB } from '@/lib/db';
import { Subject } from '@/lib/models/Subject';
import { Lesson } from '@/lib/models/Lesson';
import { applyVersionBump } from '@/lib/models/versioning';
import { deleteSubjectContent } from '@/lib/subjectContent';

const ok  = (data)          => Response.json({ ok: true, data });
const err = (msg, status=400) => Response.json({ ok: false, error: msg }, { status });

// ─── PATCH /api/content/subject/[id] ─────────────────────────────────────────
// Admin-only. Updates cosmetic / metadata fields on the Subject document.
// Immutable fields (subjectId, path, isMajor, order) are intentionally excluded.
//
// Body: { nameAr?, nameEn?, colorHex?, mathNotation?, note? }
export async function PATCH(request, { params }) {
  const admin = await verifyAdminToken();
  if (!admin) return err('غير مصرح', 401);

  const { id } = await params;
  const body = await request.json();
  const { note, ...updates } = body;

  const allowed = ['nameAr', 'nameEn', 'colorHex', 'iconUrl', 'mathNotation'];
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  if (Object.keys(safeUpdates).length === 0) {
    return err('لا توجد حقول قابلة للتعديل في الطلب');
  }

  await connectDB();

  const subject = await Subject.findOne({ subjectId: id });
  if (!subject) return err('المادة غير موجودة', 404);

  const versionedUpdates = applyVersionBump(safeUpdates, subject, 'admin', note || 'تعديل بيانات المادة');

  const updated = await Subject.findOneAndUpdate(
    { subjectId: id },
    { $set: versionedUpdates },
    { new: true }
  ).lean();

  return ok(updated);
}

// ─── DELETE /api/content/subject/[id] ────────────────────────────────────────
// Admin-only. Hard-deletes the subject and ALL its content (cascade).
// This is destructive and irreversible — use with extreme caution.
// The subject must have zero approved lessons to proceed (safety guard).
//
// Override the safety guard by passing ?force=true in the query string.
export async function DELETE(request, { params }) {
  const admin = await verifyAdminToken();
  if (!admin) return err('غير مصرح', 401);

  const { id } = await params;
  const force = new URL(request.url).searchParams.get('force') === 'true';

  await connectDB();

  const subject = await Subject.findOne({ subjectId: id });
  if (!subject) return err('المادة غير موجودة', 404);

  // Safety guard: block deletion if there are approved lessons (unless forced)
  if (!force) {
    const approvedCount = await Lesson.countDocuments({ subjectId: id, status: 'approved' });
    if (approvedCount > 0) {
      return err(
        `لا يمكن حذف المادة: تحتوي على ${approvedCount} درس معتمد. أرسل ?force=true للمتابعة.`,
        409
      );
    }
  }

  await deleteSubjectContent(id);

  return ok({ deleted: id });
}