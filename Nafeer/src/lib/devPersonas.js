// ─── Test personas for the dev database (docs/dev-database.md) ────────────────
// One person for every situation the team-leads work needs to be tried in
// (docs/team-leads.md). `npm run seed:dev` creates them in `nafeer_dev`;
// /dev/login signs in as any of them with one click (/api/dev/autologin?as=).
// They exist only on the dev database: the sign-in route refuses elsewhere.
//
// Emails are on example.com (reserved, never delivered — and on the dev
// database nothing is sent anyway).

export const DEV_SUBJECT = 'GEOGRAPHY';
export const DEV_OTHER_SUBJECT = 'PHYSICS';

const ALL_PERMS = {
  canReview: true, canManageTeam: true, canDecideApplicants: true,
  canEditInterview: true, canIntervene: true, canPublish: true,
};

export const DEV_PERSONAS = [
  {
    username: 'dev_lead', name: 'سارة القائدة', subject: DEV_SUBJECT,
    about: 'قائدة الجغرافيا بكل الصلاحيات',
    lead: ALL_PERMS,
  },
  {
    username: 'dev_colead', name: 'خالد القائد الثاني', subject: DEV_SUBJECT,
    about: 'قائد ثانٍ بالصلاحيات الافتراضية — يراجع دروس سارة',
    lead: { canReview: true, canManageTeam: true },
  },
  {
    username: 'dev_member', name: 'منى العضو', subject: DEV_SUBJECT,
    about: 'عضو: درس بانتظار المراجعة، ودرس معتمد',
  },
  {
    username: 'dev_member2', name: 'عمر العضو', subject: DEV_SUBJECT,
    about: 'عضو: درس أُعيد بملاحظات، ومسودة راكدة',
  },
  {
    username: 'dev_paused', name: 'هالة الموقوفة', subject: DEV_SUBJECT,
    about: 'عضو أوقفته سارة سبعة أيام',
    paused: { days: 7, reason: 'تعديلات كثيرة على دروس لم تُسند إليها — نراجعها معاً أولاً' },
  },
  {
    username: 'dev_physics_lead', name: 'ياسر قائد الفيزياء', subject: DEV_OTHER_SUBJECT,
    about: 'قائد مادة أخرى — لا سلطة له على الجغرافيا',
    lead: ALL_PERMS,
  },
];

// Applicants have no sign-in: they are seen from the lead's recruiting page.
export const DEV_APPLICANTS = [
  { key: 'dev_applicant',  name: 'ريم المتقدمة', about: 'أجابت عن المقابلة — تنتظر قراراً', answered: true },
  { key: 'dev_applicant2', name: 'طارق المتقدم', about: 'دُعي للمقابلة ولم يُجب بعد', answered: false },
];

export const devEmail = (key) => `${key}@example.com`;
export const isDevPersona = (username) => DEV_PERSONAS.some((p) => p.username === username);
