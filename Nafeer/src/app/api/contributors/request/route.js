import { NextResponse, after } from 'next/server';
import { connectDB }    from '@/lib/db';
import { rateLimit }    from '@/lib/rateLimit';
import { Contributor }  from '@/lib/models/Contributor';
import { ContributorRole } from '@/lib/models/ContributorRole';
import { sendEmail }    from '@/lib/email/emailService';
import { SUBJECT_IDS }  from '@/shared/curriculum';
import { newToken, issueInterview, statusLink, interviewLink, INTERVIEW_DAYS } from '@/lib/applicationLinks';

// Answers the form offers; anything else is refused.
const GENDERS   = ['male', 'female'];
const AGES      = ['under-18', '18-22', '23-27', '28-35', 'over-35'];
const RELATIONS = ['uni', 'grad', 'teacher', 'student', 'other'];
const HOURS     = ['1-2', '2-4', '5+', '?'];
const AI_TOOLS  = ['chatgpt', 'gemini', 'notebooklm', 'claude', 'copilot', 'perplexity'];

const bad = (message) => NextResponse.json({ message }, { status: 400 });
const str = (v, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// ─── POST /api/contributors/request ───────────────────────────────────────────
// The join form. Every field the admission guidelines use is required (the
// team evaluates against them). On success the applicant gets, at once:
//   - a status link that lasts the whole application  (/join/status)
//   - the interview link, so they can answer while they are here (/interview)
// Both go out by email too, so leaving the page loses nothing.
export async function POST(request) {
  const limited = await rateLimit(request, 'contributorRequest');
  if (limited) return limited;

  try {
    const body = await request.json();
    const name = str(body.name, 80);
    const email = str(body.email, 120).toLowerCase();
    const town = str(body.town, 80);
    const background = str(body.background, 600);
    const portfolioUrl = str(body.portfolioUrl, 300);

    if (!name || !email) return bad('يرجى تعبئة الاسم والبريد الإلكتروني');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('البريد الإلكتروني غير صحيح');
    if (!GENDERS.includes(body.gender)) return bad('يرجى اختيار الجنس');
    if (!AGES.includes(body.age)) return bad('يرجى اختيار الفئة العمرية');
    if (!town) return bad('يرجى كتابة المدينة أو الولاية');
    if (!background) return bad('يرجى كتابة خلفيتك التعليمية أو المهنية');
    if (typeof body.hasPcOrTablet !== 'boolean') return bad('يرجى الإجابة عن سؤال الجهاز');
    if (!['yes', 'mostly', 'no'].includes(body.internet)) return bad('يرجى الإجابة عن سؤال الإنترنت');
    if (!HOURS.includes(body.weeklyHours)) return bad('يرجى اختيار الساعات الأسبوعية');
    if (typeof body.usesAiTools !== 'boolean') return bad('يرجى الإجابة عن سؤال أدوات الذكاء الاصطناعي');

    await connectDB();
    const role = body.roleId ? await ContributorRole.findOne({ _id: body.roleId, isActive: true }).lean().catch(() => null) : null;
    if (!role) return bad('يرجى اختيار مجال المساهمة');

    const learning = role.category === 'learning';
    const subjects = Array.isArray(body.subjectsOfInterest) ? body.subjectsOfInterest.filter((s) => SUBJECT_IDS.includes(s)).slice(0, 3) : [];
    if (learning && !subjects.length) return bad('يرجى اختيار المادة');
    if (learning && !RELATIONS.includes(body.subjectRelation)) return bad('يرجى اختيار علاقتك بالمادة');
    if (role.portfolioPrompt && !portfolioUrl) return bad('يرجى إضافة رابط أعمالك');

    if (await Contributor.exists({ email })) {
      return NextResponse.json({ message: 'هذا البريد الإلكتروني مسجّل بالفعل. تابع طلبك من الرابط في بريدك، أو اطلب إعادة إرساله.', code: 'EXISTS' }, { status: 409 });
    }

    const contributor = new Contributor({
      name, email, town, background, portfolioUrl,
      gender:             body.gender,
      age:                body.age,
      subjectsOfInterest: subjects,
      subjectRelation:    learning ? body.subjectRelation : '',
      weeklyHours:        body.weeklyHours,
      hasPcOrTablet:      body.hasPcOrTablet,
      // Stored as a boolean like before; "mostly" counts as stable.
      hasStableInternet:  body.internet !== 'no',
      usesAiTools:        body.usesAiTools,
      aiToolsList:        body.usesAiTools && Array.isArray(body.aiToolsList) ? body.aiToolsList.filter((t) => AI_TOOLS.includes(t)) : [],
      roleId:             role._id,
      status:             'pending',
    });
    const statusToken = newToken();
    contributor.statusToken = statusToken;
    const interviewToken = issueInterview(contributor, role);
    await contributor.save();

    // After the response: a slow or failed send never breaks the application.
    after(() => sendEmail({
      to:       contributor.email,
      template: 'application_received',
      data: {
        name: contributor.name.slice(0, 60),
        statusLink: statusLink(statusToken),
        interviewLink: interviewLink(interviewToken),
        interviewDays: INTERVIEW_DAYS,
      },
    }));

    return NextResponse.json({ success: true, statusToken, interviewToken }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ message: 'هذا البريد الإلكتروني مسجّل بالفعل', code: 'EXISTS' }, { status: 409 });
    }
    console.error('Contributor request error:', err);
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
