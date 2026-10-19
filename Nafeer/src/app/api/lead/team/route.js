import { after } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireContributor, requireLeadOfOwnSubject, ok, err } from '@/lib/api/guard';
import { Contributor }  from '@/lib/models/Contributor';
import { Lesson }       from '@/lib/models/Lesson';
import { Announcement } from '@/lib/models/announcement';
import { getTeam } from '@/lib/api/leadTeam';
import { buildPause, MAX_AWAY_DAYS, normaliseLead } from '@/lib/leads';
import { AuditError, recordAudit, validateAudit } from '@/lib/audit';

// ─── /api/lead/team (docs/team-leads.md L2) ───────────────────────────────────
//   GET  ?subjectId=   → the team page (lib/api/leadTeam.js); subjectId only
//                        for the owner, a lead always gets their own subject
//   POST { action, … } →
//     pause      { contributorId, days?, reason }  days 1..30, none = until lifted
//     unpause    { contributorId }
//     assign     { contentId, contributorId|null } null hands it back to the author
//     announce   { title, body, pinned? }          to everyone in the subject
//     unannounce { id }
//     away       { days|null }                     the lead's own away mode
//
// Everything but `away` needs canManageTeam on the subject. Every change goes
// to the audit log; pausing needs a reason.

const OBJECT_ID = /^[a-f\d]{24}$/i;
const DAY_MS = 24 * 60 * 60 * 1000;

const fail = (message, status = 400) => err(message, status);

export async function GET(request) {
  try {
    const subjectParam = new URL(request.url).searchParams.get('subjectId');
    const { subjectId } = await requireLeadOfOwnSubject('canManageTeam', subjectParam);
    return ok(await getTeam(subjectId));
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/lead/team]', e);
    return err('خطأ في الخادم', 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'away') return await setAway(body);

    const handler = ACTIONS[body.action];
    if (!handler) return fail('إجراء غير معروف');

    const { user, subjectId } = await requireLeadOfOwnSubject('canManageTeam', body.subjectId);
    const actor = {
      id:   user.id,
      name: user.role === 'admin' ? 'المالك' : (user.name || 'قائد الفريق'),
      kind: user.role === 'admin' ? 'admin' : 'lead',
    };
    await connectDB();
    return await handler({ body, user, subjectId, actor });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof AuditError) return fail(e.message);
    console.error('[POST /api/lead/team]', e);
    return err('خطأ في الخادم', 500);
  }
}

// A member of this subject, approved, by id — or null.
async function memberOf(subjectId, contributorId) {
  if (typeof contributorId !== 'string' || !OBJECT_ID.test(contributorId)) return null;
  return Contributor.findOne({ _id: contributorId, subject: subjectId, status: 'approved' })
    .select('name subject lead paused').lean();
}

const ACTIONS = {
  async pause({ body, user, subjectId, actor }) {
    const reason = validateAudit({ action: 'member.pause', reason: body.reason });
    const m = await memberOf(subjectId, body.contributorId);
    if (!m) return fail('العضو غير موجود في هذه المادة', 404);
    if (String(m._id) === String(user.id)) return fail('لا يمكنك إيقاف نفسك');
    // Leads answer to the owner, not to each other.
    if (normaliseLead(m.lead, m.subject)) return fail('لا يوقف قائدٌ قائداً — هذا للمالك', 403);

    let paused;
    try {
      paused = buildPause({ days: body.days ?? null, reason, by: actor });
    } catch (e) { return fail(e.message); }

    await Contributor.updateOne({ _id: m._id }, { $set: { paused } });
    after(() => recordAudit(actor, {
      action: 'member.pause', subjectId, reason,
      target: { kind: 'contributor', id: m._id, label: m.name },
      meta: { until: paused.until },
    }));
    return ok({ contributorId: String(m._id), paused: { until: paused.until, reason } });
  },

  async unpause({ body, subjectId, actor }) {
    const m = await memberOf(subjectId, body.contributorId);
    if (!m) return fail('العضو غير موجود في هذه المادة', 404);
    if (!m.paused?.active) return fail('هذا العضو غير موقوف');

    await Contributor.updateOne({ _id: m._id }, { $set: { 'paused.active': false } });
    after(() => recordAudit(actor, {
      action: 'member.unpause', subjectId,
      target: { kind: 'contributor', id: m._id, label: m.name },
    }));
    return ok({ contributorId: String(m._id), paused: null });
  },

  async assign({ body, user, subjectId, actor }) {
    if (typeof body.contentId !== 'string' || !body.contentId) return fail('contentId مطلوب');
    const lesson = await Lesson.findOne({ contentId: body.contentId, subjectId })
      .select('contentId title createdBy ownerId').lean();
    if (!lesson) return fail('الدرس غير موجود في هذه المادة', 404);

    let to = null;
    if (body.contributorId != null) {
      to = await memberOf(subjectId, body.contributorId);
      if (!to) return fail('العضو غير موجود في هذه المادة', 404);
    }

    const from = lesson.ownerId ? String(lesson.ownerId) : null;
    await Lesson.updateOne({ contentId: lesson.contentId }, { $set: { ownerId: to ? to._id : null } });

    after(() => Promise.all([
      recordAudit(actor, {
        action: 'lesson.assign', subjectId,
        target: { kind: 'lesson', id: lesson.contentId, label: lesson.title },
        meta: { from, to: to ? String(to._id) : null },
      }),
      // Tell the new owner on their dashboard — the announcement list they
      // already load, so no new request on their side.
      to && String(to._id) !== String(user.id) && Announcement.create({
        title: 'أُسند إليك درس',
        body: `أسند إليك ${actor.name} الدرس «${lesson.title}».`,
        type: 'info',
        authorName: actor.name,
        targetContributorIds: [to._id],
        leadAuthorId: actor.kind === 'lead' ? String(user.id) : null,
      }).catch((e) => console.warn('[assign notice failed]', e.message)),
    ]));
    return ok({ contentId: lesson.contentId, ownerId: to ? String(to._id) : null });
  },

  async announce({ body, user, subjectId, actor }) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const text  = typeof body.body === 'string' ? body.body.trim() : '';
    if (!title || title.length > 120) return fail('العنوان مطلوب (120 حرفاً على الأكثر)');
    if (!text || text.length > 2000)  return fail('النص مطلوب (2000 حرف على الأكثر)');

    const a = await Announcement.create({
      title, body: text, type: 'update', pinned: body.pinned === true,
      authorName: actor.name,
      targetSubjects: [subjectId],
      leadAuthorId: String(user.id),
    });
    after(() => recordAudit(actor, {
      action: 'team.announce', subjectId, target: { kind: 'announcement', id: a._id, label: title },
    }));
    return ok({ id: String(a._id) });
  },

  async unannounce({ body, user, subjectId, actor }) {
    if (typeof body.id !== 'string' || !OBJECT_ID.test(body.id)) return fail('المعرّف غير صالح');
    // A lead removes only their own; the owner any lead's in the subject.
    const filter = { _id: body.id, targetSubjects: subjectId, leadAuthorId: { $ne: null } };
    if (actor.kind === 'lead') filter.leadAuthorId = String(user.id);
    const a = await Announcement.findOneAndDelete(filter).lean();
    if (!a) return fail('الإعلان غير موجود، أو ليس من إعلاناتك', 404);
    after(() => recordAudit(actor, {
      action: 'team.unannounce', subjectId, target: { kind: 'announcement', id: a._id, label: a.title },
    }));
    return ok({ id: body.id });
  },
};

// The lead's own away mode: any active lead, whatever their permissions.
async function setAway(body) {
  const user = await requireContributor();
  if (!user.lead?.active) return fail('وضع الغياب لقادة الفرق فقط', 403);

  const days = body.days ?? null;
  if (days !== null && !(Number.isInteger(days) && days >= 1 && days <= MAX_AWAY_DAYS)) {
    return fail(`مدة الغياب من 1 إلى ${MAX_AWAY_DAYS} يوماً`);
  }
  const awayUntil = days ? new Date(Date.now() + days * DAY_MS) : null;

  await connectDB();
  await Contributor.updateOne({ _id: user.id }, { $set: { 'lead.awayUntil': awayUntil } });
  after(() => recordAudit({ id: user.id, name: user.name || '', kind: 'lead' }, {
    action: 'lead.away', subjectId: user.subject, target: { kind: 'lead', id: user.id, label: user.name || '' },
    meta: { awayUntil },
  }));
  return ok({ awayUntil });
}
