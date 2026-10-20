import { connectDB }   from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { Lesson }      from '@/lib/models/Lesson';
import { Release }     from '@/lib/models/Release';
import { REAL_PEOPLE } from '@/lib/SeedActor';
import { sendEmail }   from '@/lib/email/emailService';
import { appUrl }      from '@/lib/appUrl';
import { arCount }     from '@/lib/format';
import { normaliseLead } from '@/lib/leads';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';

// ─── The lead's daily digest (docs/team-leads.md L5) ──────────────────────────
// At most one email a day per lead, from the daily cron, and only when
// something is waiting for them: lessons to review, answered applicants with
// no decision, a release on hold. Nothing waiting, nothing sent. A lead in
// away mode gets nothing. Everything else lives in the editor's inbox.

const lessons    = (n) => arCount(n, { one: 'درس واحد', two: 'درسان', few: 'دروس', many: 'درساً' });
const applicants = (n) => arCount(n, { one: 'متقدم واحد', two: 'متقدمان', few: 'متقدمين', many: 'متقدماً' });

/** The email for one lead, or null when nothing waits. Pure. */
export function buildLeadDigest({ name, subjectId, review = 0, applicants: waiting = 0, heldRelease = null }) {
  const lines = [];
  if (review) lines.push(`• ${lessons(review)} بانتظار مراجعتك.`);
  if (waiting) lines.push(`• ${applicants(waiting)} أجابوا عن المقابلة ولم يُقرَّر فيهم.`);
  if (heldRelease) lines.push('• إصدار المادة محجوز وسيُنشر قريباً.');
  if (!lines.length) return null;
  const subject = SUBJECTS_BY_ID[subjectId]?.nameAr || subjectId;
  return {
    subject: `${subject}: ما ينتظرك اليوم`,
    message: [`صباح الخير ${name || ''}،`.trim(), `في ${subject}:`, ...lines, '', `صندوقك: ${appUrl('/editor/lead')}`].join('\n'),
  };
}

/** Sends today's digests. Returns how many went out. */
export async function sendLeadDigests(now = new Date()) {
  await connectDB();
  const leads = (await Contributor.find({ 'lead.active': true, status: 'approved', ...REAL_PEOPLE })
    .select('name email subject lead').lean())
    .map((c) => ({ ...c, lead: normaliseLead(c.lead, c.subject) }))
    .filter((c) => c.lead && !(c.lead.awayUntil && new Date(c.lead.awayUntil) > now));
  if (!leads.length) return 0;

  // Per subject, not per lead: co-leads share the counts.
  const subjects = [...new Set(leads.map((l) => l.subject))];
  const perSubject = Object.fromEntries(await Promise.all(subjects.map(async (s) => {
    const [review, waiting, held] = await Promise.all([
      Lesson.countDocuments({ subjectId: s, status: 'review' }),
      Contributor.countDocuments({
        status: 'pending', 'subjectsOfInterest.0': s,
        $or: [{ dynamicAnswersSubmittedAt: { $ne: null } }, { 'interviewAnswers.submittedAt': { $ne: null } }],
        pendingDecision: null,
      }),
      Release.exists({ subjectId: s, status: 'held' }),
    ]);
    return [s, { review, waiting, held: !!held }];
  })));

  let sent = 0;
  for (const l of leads) {
    const p = perSubject[l.subject];
    const digest = buildLeadDigest({
      name: l.name, subjectId: l.subject,
      review: l.lead.canReview ? p.review : 0,
      applicants: l.lead.canDecideApplicants ? p.waiting : 0,
      heldRelease: l.lead.canPublish && p.held,
    });
    if (!digest) continue;
    const r = await sendEmail({ to: l.email, template: 'custom_message', data: { name: l.name, ...digest } });
    if (r.ok) sent++;
  }
  return sent;
}
