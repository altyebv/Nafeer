import { NextResponse, after } from 'next/server';
import { connectDB }   from '@/lib/db';
import { rateLimit }   from '@/lib/rateLimit';
import { Contributor } from '@/lib/models/Contributor';
import { ContributorRole } from '@/lib/models/ContributorRole';
import { sendEmail }   from '@/lib/email/emailService';
import { pipelineStage } from '@/lib/adminPipeline';
import { statusLink, interviewLink, INTERVIEW_DAYS } from '@/lib/applicationLinks';

// ─── GET /api/contributors/status?token=… ─────────────────────────────────────
// The applicant's own view of their application (/join/status). The token is
// the credential, as with the interview and onboarding links. Returns where
// the application stands and, when there is one, the link for the next step.
export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token');
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ ok: false, error: 'رابط غير صالح' }, { status: 400 });
  }

  await connectDB();
  const c = await Contributor.findOne({ statusToken: token })
    .select('+statusToken +interviewToken +onboardingToken')
    .lean();
  if (!c) return NextResponse.json({ ok: false, error: 'لم نجد طلباً بهذا الرابط' }, { status: 404 });

  const role = c.roleId ? await ContributorRole.findById(c.roleId, 'name').lean() : null;
  const stage = pipelineStage(c);
  const interviewOpen = stage === 'invited' && c.interviewToken
    && (!c.interviewExpiresAt || new Date(c.interviewExpiresAt) > new Date());
  const onboardingOpen = stage === 'onboarding' && c.onboardingToken
    && (!c.onboardingExpiresAt || new Date(c.onboardingExpiresAt) > new Date());

  return NextResponse.json({
    ok: true,
    data: {
      name: c.name,
      roleName: role?.name || null,
      subjects: c.subjectsOfInterest || [],
      submittedAt: c.createdAt,
      answeredAt: c.dynamicAnswersSubmittedAt || c.interviewAnswers?.submittedAt || null,
      decidedAt: c.status !== 'pending' ? c.updatedAt : null,
      stage,
      interviewExpiresAt: c.interviewExpiresAt || null,
      // The next link, only while it is the next step.
      interviewToken: interviewOpen ? c.interviewToken : null,
      interviewExpired: stage === 'invited' && !interviewOpen,
      onboardingToken: onboardingOpen ? c.onboardingToken : null,
    },
  });
}

// ─── POST /api/contributors/status ────────────────────────────────────────────
// Body: { email } — re-send the status link to that address. Always answers
// the same, so the form cannot tell anyone whether an address applied.
export async function POST(request) {
  const limited = await rateLimit(request, 'statusResend');
  if (limited) return limited;

  let email = '';
  try { email = String((await request.json()).email || '').trim().toLowerCase().slice(0, 120); } catch { /* empty */ }
  const done = NextResponse.json({ ok: true });
  if (!email) return done;

  await connectDB();
  const c = await Contributor.findOne({ email, onboarded: { $ne: true } })
    .select('+statusToken +interviewToken name email status interviewExpiresAt dynamicAnswersSubmittedAt interviewAnswers.submittedAt');
  if (!c) return done;

  // Applications made before status links existed get one now.
  if (!c.statusToken) {
    const { newToken } = await import('@/lib/applicationLinks');
    c.statusToken = newToken();
    await c.save();
  }
  const invited = c.status === 'pending' && c.interviewToken && !c.dynamicAnswersSubmittedAt && !c.interviewAnswers?.submittedAt;
  after(() => sendEmail({
    to: c.email,
    template: 'application_received',
    data: {
      name: c.name.slice(0, 60),
      statusLink: statusLink(c.statusToken),
      interviewLink: invited ? interviewLink(c.interviewToken) : undefined,
      interviewDays: INTERVIEW_DAYS,
    },
  }));
  return done;
}
