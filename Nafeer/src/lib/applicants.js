import { connectDB }       from '@/lib/db';
import { Contributor }     from '@/lib/models/Contributor';
import { ContributorRole } from '@/lib/models/ContributorRole';
import { REAL_PEOPLE }     from '@/lib/SeedActor';
import { pipelineStage }   from '@/lib/adminPipeline';
import { newToken, onboardingLink } from '@/lib/applicationLinks';
import { sendEmail }       from '@/lib/email/emailService';

// ─── Applicants, as a team lead sees and decides them (docs/team-leads.md L3) ─
//
// Which applicants: those whose FIRST subject of interest is the lead's — the
// subject the interview was tailored to. Leads of a subject the applicant
// picked second or third see them read-only, as "also interested".
//
// What a lead sees: what they need to judge the application — background,
// availability, the interview answers and the micro-task. Not the email, age
// or town: those stay with the owner until the person is approved.
//
// Deciding: a lead's approve or reject waits UNDO_MINUTES before it takes
// effect, so a slip can be taken back before anything is sent. Vercel's free
// plan runs cron at most once a day, so due decisions are applied by
// `applyDueDecisions`, called from requests that happen anyway — the lead's
// applicant list, the owner's contributors list, the applicant's own status
// page — with the daily cron as a backstop.

export const UNDO_MINUTES = 30;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const ONBOARDING_DAYS = 7;

// Fields read for a lead. Anything not listed never leaves the database here.
const LEAD_FIELDS = [
  'name', 'gender', 'background', 'fieldOfStudy', 'subjectsOfInterest', 'portfolioUrl',
  'subjectRelation', 'weeklyHours', 'hasPcOrTablet', 'hasStableInternet', 'usesAiTools', 'aiToolsList',
  'roleId', 'status', 'onboarded', 'dynamicAnswers', 'dynamicAnswersSubmittedAt', 'dynamicMicroTask',
  'interviewAnswers', 'interviewSnapshot.questions', 'createdAt', 'pendingDecision', '+interviewToken',
].join(' ');

export class ApplicantError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ApplicantError';
    this.status = status;
  }
}

/** The applicant as a lead may see them. `interviewToken` is read for the stage only. */
export function shapeForLead(c, { subjectId, roleName = null, now = new Date() } = {}) {
  const subjects = c.subjectsOfInterest || [];
  const legacy = c.interviewAnswers?.submittedAt
    ? [
        ['الدافع', c.interviewAnswers.motivation],
        ['نقد التعليم', c.interviewAnswers.educationCritique],
        ['لحظة تعليمية', c.interviewAnswers.teachingMoment],
        ['الالتزام الأسبوعي', c.interviewAnswers.weeklyCommitment],
      ].filter(([, a]) => a).map(([question, answer]) => ({ question, answer }))
    : [];
  const pending = c.pendingDecision && new Date(c.pendingDecision.decideAt) > now ? c.pendingDecision : null;

  return {
    id:              String(c._id),
    name:            c.name,
    gender:          c.gender || '',
    background:      c.background || '',
    fieldOfStudy:    c.fieldOfStudy || '',
    subjects,
    primary:         subjects[0] === subjectId,
    portfolioUrl:    c.portfolioUrl || '',
    subjectRelation: c.subjectRelation || '',
    weeklyHours:     c.weeklyHours || '',
    hasDevice:       c.hasPcOrTablet,
    stableInternet:  c.hasStableInternet,
    aiTools:         c.usesAiTools ? (c.aiToolsList || []) : [],
    roleName,
    stage:           pipelineStage(c),
    appliedAt:       c.createdAt,
    answeredAt:      c.dynamicAnswersSubmittedAt || c.interviewAnswers?.submittedAt || null,
    answers:         c.dynamicAnswers?.length
      ? c.dynamicAnswers.map((a) => ({ question: a.question, answer: a.answer }))
      : legacy,
    microTask:       c.dynamicMicroTask || c.interviewAnswers?.microTask || '',
    pendingDecision: pending && {
      action: pending.action, reason: pending.reason, byName: pending.byName, decideAt: pending.decideAt,
    },
  };
}

/** Pending applicants for a subject, split by whether it is their first choice. */
export async function listApplicants(subjectId, now = new Date()) {
  await connectDB();
  await applyDueDecisions(now);

  const docs = await Contributor.find({ status: 'pending', subjectsOfInterest: subjectId, ...REAL_PEOPLE })
    .select(LEAD_FIELDS).sort({ createdAt: 1 }).lean();

  const roleIds = [...new Set(docs.map((d) => d.roleId).filter(Boolean).map(String))];
  const roles = roleIds.length ? await ContributorRole.find({ _id: { $in: roleIds } }).select('name').lean() : [];
  const roleName = Object.fromEntries(roles.map((r) => [String(r._id), r.name]));

  const all = docs.map((d) => shapeForLead(d, { subjectId, roleName: roleName[String(d.roleId)] || null, now }));
  return {
    subjectId,
    undoMinutes: UNDO_MINUTES,
    mine:  all.filter((a) => a.primary),
    alsoInterested: all.filter((a) => !a.primary),
  };
}

/**
 * Records a lead's decision, to take effect after UNDO_MINUTES. Only for a
 * pending applicant whose first subject is the lead's, who has answered the
 * interview, and who has no decision waiting already.
 */
export async function decide(applicantId, { action, reason = '', subjectId, by }, now = new Date()) {
  if (!['approve', 'reject'].includes(action)) throw new ApplicantError('قرار غير معروف');
  await connectDB();

  const c = await Contributor.findOne({ _id: applicantId, status: 'pending' })
    .select('name subjectsOfInterest status onboarded dynamicAnswersSubmittedAt interviewAnswers.submittedAt pendingDecision +interviewToken')
    .lean();
  if (!c) throw new ApplicantError('الطلب غير موجود أو حُسم', 404);
  if ((c.subjectsOfInterest || [])[0] !== subjectId) {
    throw new ApplicantError('هذا الطلب يقرّر فيه قائد مادته الأولى', 403);
  }
  if (pipelineStage(c) !== 'answered') throw new ApplicantError('لم يُجب المتقدم عن المقابلة بعد');
  if (c.pendingDecision && new Date(c.pendingDecision.decideAt) > now) {
    throw new ApplicantError('هناك قرار بانتظار التنفيذ — تراجع عنه أولاً', 409);
  }

  const pendingDecision = {
    action, reason, subject: subjectId,
    byId: String(by.id), byName: by.name || '',
    at: now, decideAt: new Date(now.getTime() + UNDO_MINUTES * MINUTE_MS),
  };
  // Conditional: still pending, and nobody else decided in between.
  const res = await Contributor.updateOne(
    { _id: c._id, status: 'pending', $or: [{ pendingDecision: null }, { 'pendingDecision.decideAt': { $lte: now } }] },
    { $set: { pendingDecision } },
  );
  if (!res.matchedCount) throw new ApplicantError('تغيّر الطلب للتو — حدّث الصفحة', 409);
  return { applicant: { id: String(c._id), name: c.name }, pendingDecision };
}

/** Takes a decision back while its window is open. */
export async function undoDecision(applicantId, { subjectId }, now = new Date()) {
  await connectDB();
  const c = await Contributor.findOneAndUpdate(
    { _id: applicantId, status: 'pending', 'pendingDecision.subject': subjectId, 'pendingDecision.decideAt': { $gt: now } },
    { $set: { pendingDecision: null } },
    { projection: { name: 1, pendingDecision: 1 } },
  ).lean();
  if (!c) throw new ApplicantError('لا قرار قابل للتراجع — ربما نُفّذ بالفعل', 409);
  return { applicant: { id: String(c._id), name: c.name }, undone: c.pendingDecision };
}

/**
 * Applies every decision whose window has passed. Each one is claimed with a
 * conditional write first, so two requests sweeping at once never apply — or
 * email — the same decision twice. Returns what it applied.
 */
export async function applyDueDecisions(now = new Date(), limit = 20) {
  await connectDB();
  const due = await Contributor.find({ 'pendingDecision.decideAt': { $lte: now } })
    .select('name email status onboarded pendingDecision').limit(limit).lean();

  const applied = [];
  for (const c of due) {
    const d = c.pendingDecision;
    // Decided elsewhere since (the owner, usually): just drop the stale one.
    if (c.status !== 'pending') {
      await Contributor.updateOne({ _id: c._id, 'pendingDecision.decideAt': d.decideAt }, { $set: { pendingDecision: null } });
      continue;
    }

    const $set = { pendingDecision: null };
    let token = null;
    if (d.action === 'approve') {
      $set.status = 'approved';
      $set.subject = d.subject;
      if (!c.onboarded) {
        token = newToken();
        $set.onboardingToken = token;
        $set.onboardingExpiresAt = new Date(now.getTime() + ONBOARDING_DAYS * DAY_MS);
      }
    } else {
      $set.status = 'rejected';
    }

    const claimed = await Contributor.updateOne(
      { _id: c._id, status: 'pending', 'pendingDecision.decideAt': d.decideAt },
      { $set },
    );
    if (!claimed.matchedCount) continue;   // another sweep took it

    // Only after the write is claimed, so it goes once: an approval sends the
    // onboarding link, a rejection the standard apology (never the reason).
    if (token) {
      await sendEmail({
        to: c.email,
        template: 'onboarding_invite',
        data: { name: c.name, link: onboardingLink(token), expiresIn: '7 أيام' },
      }).catch((e) => console.warn('[onboarding email failed]', e.message));
    } else if (d.action === 'reject' && c.email) {
      await sendEmail({ to: c.email, template: 'application_rejected', data: { name: c.name } })
        .catch((e) => console.warn('[rejection email failed]', e.message));
    }
    applied.push({ id: String(c._id), action: d.action });
  }
  return applied;
}
