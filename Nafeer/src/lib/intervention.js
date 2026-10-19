import { connectDB }    from '@/lib/db';
import { Lesson }       from '@/lib/models/Lesson';
import { Announcement } from '@/lib/models/announcement';
import { REAL_PEOPLE }  from '@/lib/SeedActor';
import { Contributor }  from '@/lib/models/Contributor';
import { writeHistory } from '@/lib/api/lessons';
import { creditLesson, lessonOwnerId } from '@/lib/credits';
import { INTERVENTION_CATEGORIES, INTERVENTION_HOURS, interventionOpen } from '@/lib/lessonAccess';

// ─── A lead stepping into a member's lesson (docs/team-leads.md L4) ───────────
//
// Intervene: the lead names a category and writes a reason. For
// INTERVENTION_HOURS they may change the lesson as if it were theirs
// (lib/lessonAccess.js). The owner is told at once, with the reason.
//
// Close: when the lead ends it, or it runs out (closed on the lesson's next
// open). If the lesson changed in between, the lead is credited as `editor`
// and the history says how many versions they made. Every edit in between is
// already in the history under the lead's name, with its diff.
//
// Take over: for an owner who has gone quiet — the lesson becomes the lead's.
// The author keeps their authorship (`createdBy` never changes).

export class InterventionError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'InterventionError';
    this.status = status;
  }
}

const HOUR_MS = 60 * 60 * 1000;

// Tell the people a lesson belongs to, on their dashboard (the announcements
// they already load). Never throws.
async function tellOwners(lesson, { title, body, authorName, leadId, skip }) {
  try {
    const ids = [...new Set([lessonOwnerId(lesson), lesson.createdBy && String(lesson.createdBy)].filter(Boolean))]
      .filter((id) => id !== String(skip));
    if (!ids.length) return;
    const real = await Contributor.find({ _id: { $in: ids }, ...REAL_PEOPLE }).select('_id').lean();
    if (!real.length) return;
    await Announcement.create({
      title, body, type: 'warning', authorName,
      targetContributorIds: real.map((r) => r._id),
      leadAuthorId: leadId ? String(leadId) : null,
    });
  } catch (e) {
    console.warn('[intervention notice failed]', e.message);
  }
}

/** Opens an intervention. `lead` is { id, name }. */
export async function startIntervention(contentId, { category, reason, lead }, now = new Date()) {
  if (!INTERVENTION_CATEGORIES[category]) throw new InterventionError('اختر سبب التدخل');
  await connectDB();

  const lesson = await Lesson.findOne({ contentId })
    .select('contentId subjectId title version createdBy ownerId intervention').lean();
  if (!lesson) throw new InterventionError('الدرس غير موجود', 404);
  if (lessonOwnerId(lesson) === String(lead.id)) throw new InterventionError('هذا درسك — عدّله مباشرة');
  if (interventionOpen(lesson.intervention, now)) {
    throw new InterventionError(`${lesson.intervention.byName || 'قائد'} يتدخّل في هذا الدرس الآن`, 409);
  }

  const intervention = {
    byId: String(lead.id), byName: lead.name || '',
    category, reason, startedAt: now,
    until: new Date(now.getTime() + INTERVENTION_HOURS * HOUR_MS),
    startVersion: lesson.version || 1,
  };
  // Conditional: nobody opened one in between.
  const res = await Lesson.updateOne(
    { contentId, $or: [{ intervention: null }, { 'intervention.until': { $lte: now } }] },
    { $set: { intervention } },
    { timestamps: false },
  );
  if (!res.matchedCount) throw new InterventionError('بدأ تدخّل آخر للتو — حدّث الصفحة', 409);

  await Promise.all([
    writeHistory(contentId, {
      version: lesson.version || 1, action: 'intervened', byId: lead.id, byName: lead.name,
      note: `بدأ التدخّل (${INTERVENTION_CATEGORIES[category]}): ${reason}`,
    }),
    tellOwners(lesson, {
      title: 'تدخّل قائد الفريق في درسك',
      body: `يعدّل ${lead.name || 'قائد الفريق'} درسك «${lesson.title}» — ${INTERVENTION_CATEGORIES[category]}: ${reason}. كل تعديل يظهر في سجل الدرس.`,
      authorName: lead.name, leadId: lead.id, skip: lead.id,
    }),
  ]);
  return { lesson, intervention };
}

/**
 * Closes the intervention on a lesson — by the lead who opened it, by the
 * owner (admin), or because it ran out (`expiredOnly`). Credits the lead when
 * the lesson changed meanwhile. Returns null when there was nothing to close.
 */
export async function closeIntervention(contentId, { byId = null, expiredOnly = false } = {}, now = new Date()) {
  await connectDB();
  const filter = { contentId, intervention: { $ne: null } };
  if (byId) filter['intervention.byId'] = String(byId);
  if (expiredOnly) filter['intervention.until'] = { $lte: now };

  // Returns the document as it was, so we know what the intervention held.
  const before = await Lesson.findOneAndUpdate(filter, { $set: { intervention: null } }, { timestamps: false })
    .select('contentId title version intervention').lean();
  if (!before?.intervention) return null;

  const iv = before.intervention;
  const made = Math.max(0, (before.version || 1) - (iv.startVersion || 1));
  await Promise.all([
    made > 0 && creditLesson(contentId, { contributorId: iv.byId, name: iv.byName, kind: 'editor' }),
    writeHistory(contentId, {
      version: before.version || 1, action: 'intervened', byId: iv.byId, byName: iv.byName,
      note: `${expiredOnly ? 'انتهت مدة التدخّل' : 'انتهى التدخّل'} — ${made ? `${made} نسخة جديدة` : 'بلا تعديل'}`,
    }),
  ]);
  return { intervention: iv, versionsMade: made };
}

/** Makes the lead the lesson's owner. The author stays the author. */
export async function takeOver(contentId, { reason, lead }, now = new Date()) {
  await connectDB();
  const lesson = await Lesson.findOne({ contentId })
    .select('contentId subjectId title version createdBy ownerId').lean();
  if (!lesson) throw new InterventionError('الدرس غير موجود', 404);
  if (lessonOwnerId(lesson) === String(lead.id)) throw new InterventionError('الدرس لك بالفعل');

  const from = lessonOwnerId(lesson);
  await Lesson.updateOne({ contentId }, { $set: { ownerId: lead.id } }, { timestamps: false });
  // An intervention by this lead has no purpose now; close it with credit.
  await closeIntervention(contentId, { byId: lead.id }, now);

  await Promise.all([
    writeHistory(contentId, {
      version: lesson.version || 1, action: 'intervened', byId: lead.id, byName: lead.name,
      note: `تولّى ${lead.name || 'قائد الفريق'} الدرس: ${reason}`,
    }),
    tellOwners(lesson, {
      title: 'تولّى قائد الفريق درساً من دروسك',
      body: `صار الدرس «${lesson.title}» في عهدة ${lead.name || 'قائد الفريق'}: ${reason}. يبقى اسمك مؤلفاً له.`,
      authorName: lead.name, leadId: lead.id, skip: lead.id,
    }),
  ]);
  return { lesson, from };
}
