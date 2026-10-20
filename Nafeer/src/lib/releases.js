import { connectDB }      from '@/lib/db';
import { Release }        from '@/lib/models/Release';
import { Admin }          from '@/lib/models/Admin';
import { Announcement }   from '@/lib/models/announcement';
import { publishSubject } from '@/lib/publishSubject';
import { sendEmail }      from '@/lib/email/emailService';
import { recordAudit }    from '@/lib/audit';
import { appUrl }         from '@/lib/appUrl';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';
import { formatDate }     from '@/lib/format';

// ─── Team leads' releases (docs/team-leads.md L5) ─────────────────────────────
//
// A lead with canPublish requests a release of their subject:
//   - it must have something to publish (a dry run of the real pipeline);
//   - one release per subject per RELEASE_COOLDOWN_HOURS;
//   - it is HELD for RELEASE_HOLD_HOURS, and the owner is emailed at once, so
//     they can cancel it before students get it;
//   - then it runs lib/publishSubject.js, exactly as the owner's publish.
//
// The owner's undo once it is live is the app on/off switch per subject
// (the manifest's `enabled`, in the publish section) and fixing forward —
// chosen over a version rollback, which the app's sync may not handle.
//
// Going live needs a request to notice the hold has passed: Vercel's free plan
// runs cron once a day. `applyDueReleases` runs after the responses the lead
// and the owner load anyway, with the daily cron as the backstop.

export const RELEASE_HOLD_HOURS = 3;
export const RELEASE_COOLDOWN_HOURS = 24;
const HOUR_MS = 60 * 60 * 1000;

export class ReleaseError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ReleaseError';
    this.status = status;
  }
}

const subjectName = (id) => SUBJECTS_BY_ID[id]?.nameAr || id;

/** What publishing now would change. Throws ReleaseError when it cannot run. */
export async function previewRelease(subjectId) {
  const res = await publishSubject({ subjectId, dryRun: true });
  const json = await res.json();
  if (!json.ok) throw new ReleaseError(json.error || 'تعذّرت المعاينة', res.status === 422 ? 400 : res.status);
  return {
    fromVersion:      json.contentVersion,
    lastPublishedAt:  json.lastPublishedAt,
    firstPublish:     json.delta.firstPublish,
    nothingToPublish: json.delta.nothingToPublish,
    changed:          json.delta.changed,
    deleted:          json.delta.deleted,
    lessons:          json.delta.lessons,
    stats:            json.stats,
  };
}

/** When the subject may next be released by a lead, or null if it may now. */
export async function cooldownUntil(subjectId, now = new Date()) {
  const since = new Date(now.getTime() - RELEASE_COOLDOWN_HOURS * HOUR_MS);
  const last = await Release.findOne({
    subjectId, status: { $in: ['held', 'publishing', 'published'] }, createdAt: { $gt: since },
  }).sort({ createdAt: -1 }).select('createdAt').lean();
  return last ? new Date(new Date(last.createdAt).getTime() + RELEASE_COOLDOWN_HOURS * HOUR_MS) : null;
}

async function emailOwners(subject, message) {
  try {
    const owners = await Admin.find({ isActive: true, email: { $not: /@nafeer\.local$/i } }).select('email username').lean();
    await Promise.all(owners.map((o) => sendEmail({
      to: o.email, template: 'custom_message', data: { name: o.username, subject, message },
    })));
  } catch (e) {
    console.warn('[release email failed]', e.message);
  }
}

/** A lead requests a release. `lead` is { id, name }. */
export async function requestRelease(subjectId, { lead, note = '' }, now = new Date()) {
  await connectDB();
  if (await Release.exists({ subjectId, status: { $in: ['held', 'publishing'] } })) {
    throw new ReleaseError('هناك إصدار بانتظار النشر بالفعل', 409);
  }
  const until = await cooldownUntil(subjectId, now);
  if (until && until > now) {
    throw new ReleaseError(`إصدار واحد كل ${RELEASE_COOLDOWN_HOURS} ساعة — التالي بعد ${formatDate(until, 'shortDateTime')}`, 429);
  }

  const preview = await previewRelease(subjectId);
  if (preview.nothingToPublish) throw new ReleaseError('لا جديد في المادة منذ آخر نشر');

  const release = await Release.create({
    subjectId,
    requestedById: String(lead.id), requestedByName: lead.name || '',
    note: (note || '').trim().slice(0, 500),
    goLiveAt: new Date(now.getTime() + RELEASE_HOLD_HOURS * HOUR_MS),
    preview: { changed: preview.changed, deleted: preview.deleted, lessons: preview.lessons, fromVersion: preview.fromVersion },
  });

  const changedLessons = preview.lessons?.changed?.length || 0;
  const removedLessons = preview.lessons?.removed?.length || 0;
  await emailOwners(
    `إصدار ${subjectName(subjectId)} بانتظار النشر`,
    [
      `طلب ${lead.name || 'قائد الفريق'} نشر ${subjectName(subjectId)} في التطبيق.`,
      `يُنشر ${formatDate(release.goLiveAt, 'shortDateTime')} ما لم تلغه.`,
      `الدروس: ${changedLessons} جديد أو معدّل، ${removedLessons} محذوف.`,
      release.note ? `ملاحظة القائد: ${release.note}` : '',
      `للإلغاء: ${appUrl('/admin/dashboard#leads')}`,
    ].filter(Boolean).join('\n'),
  );
  return release.toObject ? release.toObject() : release;
}

/** Cancels a held release. `by` is { name }. */
export async function cancelRelease(releaseId, { by, reason = '', subjectId = null }) {
  await connectDB();
  const filter = { _id: releaseId, status: 'held' };
  if (subjectId) filter.subjectId = subjectId;
  const r = await Release.findOneAndUpdate(
    filter,
    { $set: { status: 'cancelled', cancelledByName: by?.name || '', cancelReason: (reason || '').slice(0, 500) } },
    { new: true },
  ).lean();
  if (!r) throw new ReleaseError('لا إصدار محجوز بهذا المعرّف — ربما نُشر', 409);
  return r;
}

/** Owner: skip the rest of the hold. */
export async function releaseNow(releaseId, now = new Date()) {
  await connectDB();
  const r = await Release.findOneAndUpdate({ _id: releaseId, status: 'held' }, { $set: { goLiveAt: now } }, { new: true }).lean();
  if (!r) throw new ReleaseError('لا إصدار محجوز بهذا المعرّف', 409);
  return (await applyDueReleases(now, 1, releaseId))[0] || r;
}

/**
 * Publishes every held release whose hold has passed. Each is claimed first
 * (held → publishing, conditional), so two sweeps never publish twice.
 */
export async function applyDueReleases(now = new Date(), limit = 2, onlyId = null) {
  await connectDB();
  await failStuckReleases(now);
  const filter = { status: 'held', goLiveAt: { $lte: now } };
  if (onlyId) filter._id = onlyId;
  const due = await Release.find(filter).sort({ goLiveAt: 1 }).limit(limit).select('_id').lean();

  const done = [];
  for (const { _id } of due) {
    const r = await Release.findOneAndUpdate(
      { _id, status: 'held' },
      { $set: { status: 'publishing', publishingStartedAt: new Date() } },
      { new: true },
    ).lean();
    if (!r) continue;   // another sweep took it

    let $set;
    try {
      const res = await publishSubject({ subjectId: r.subjectId, mode: 'delta' });
      const json = await res.json();
      $set = !json.ok
        ? { status: 'failed', error: json.error || `HTTP ${res.status}` }
        : json.noChange
          ? { status: 'noop', publishedAt: new Date(), contentVersion: json.contentVersion || null }
          : { status: 'published', publishedAt: new Date(), contentVersion: json.contentVersion || null };
    } catch (e) {
      $set = { status: 'failed', error: e.message || 'خطأ' };
    }
    const after = await Release.findOneAndUpdate({ _id }, { $set }, { new: true }).lean();
    done.push(after);

    await Promise.all([
      $set.status === 'published' && recordAudit({ id: r.requestedById, name: r.requestedByName, kind: 'lead' }, {
        action: 'release.publish', subjectId: r.subjectId,
        target: { kind: 'release', id: String(_id), label: $set.contentVersion || '' },
        meta: { contentVersion: $set.contentVersion, fromVersion: r.preview?.fromVersion || null },
      }),
      Announcement.create({
        title: $set.status === 'failed' ? 'تعذّر نشر الإصدار' : 'نُشر الإصدار',
        body: $set.status === 'failed'
          ? `لم يُنشر إصدار ${subjectName(r.subjectId)}: ${$set.error}. أُبلغ المالك.`
          : `وصل إصدار ${subjectName(r.subjectId)}${$set.contentVersion ? ` (${$set.contentVersion})` : ''} إلى التطبيق.`,
        type: $set.status === 'failed' ? 'warning' : 'milestone',
        authorName: 'نفير',
        targetContributorIds: [r.requestedById],
      }).catch(() => {}),
      $set.status === 'failed' && emailOwners(`تعذّر نشر ${subjectName(r.subjectId)}`, `فشل إصدار طلبه ${r.requestedByName}: ${$set.error}`),
    ]);
  }
  return done;
}

// ─── Releases cut off mid-publish ─────────────────────────────────────────────
// Publishing runs inside a request's after() or the cron, and a serverless
// function can be stopped at its time limit. A release still `publishing`
// STUCK_MINUTES after it started will never finish. It is marked failed — not
// retried: a publish stopped halfway may already have moved the app's
// manifest, which someone should check before trying again. The lead and the
// owner are told. Each is claimed conditionally, like everything here.

export const STUCK_MINUTES = 15;

export async function failStuckReleases(now = new Date()) {
  const cutoff = new Date(now.getTime() - STUCK_MINUTES * 60 * 1000);
  const stuck = await Release.find({
    status: 'publishing',
    // Releases claimed before publishingStartedAt existed: judge by updatedAt.
    $or: [{ publishingStartedAt: { $lte: cutoff } }, { publishingStartedAt: null, updatedAt: { $lte: cutoff } }],
  }).limit(5).lean();

  const failed = [];
  for (const s of stuck) {
    const error = 'انقطع النشر قبل أن يكتمل — تحقق من حالة المادة في قسم النشر قبل طلب إصدار جديد';
    const r = await Release.findOneAndUpdate(
      { _id: s._id, status: 'publishing' },
      { $set: { status: 'failed', error } },
      { new: true },
    ).lean();
    if (!r) continue;
    failed.push(r);
    await Promise.all([
      Announcement.create({
        title: 'تعذّر نشر الإصدار', body: `لم يكتمل نشر ${subjectName(r.subjectId)}. أُبلغ المالك.`,
        type: 'warning', authorName: 'نفير', targetContributorIds: [r.requestedById],
      }).catch(() => {}),
      emailOwners(`انقطع نشر ${subjectName(r.subjectId)}`, `إصدار طلبه ${r.requestedByName} بدأ النشر ولم يكتمل بعد ${STUCK_MINUTES} دقيقة. ${error}.`),
    ]);
  }
  return failed;
}
