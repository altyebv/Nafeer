// ─── npm run seed:dev ─────────────────────────────────────────────────────────
// Fills the dev database (MONGODB_DB=nafeer_dev, docs/dev-database.md) with
// everything needed to try the app locally: the contributor roles and the
// admin (scripts/seed.js), the Geography and Physics scaffolds, and the test
// personas of src/lib/devPersonas.js in the states the team-leads work needs —
// a lesson waiting for review, one returned, one stale, a lead's own lesson,
// a paused member, applicants.
//
// Safe to run again: everything is upserted by a stable key, and the lessons
// are put back into the same states. Refuses to run on any database whose
// name does not end in `_dev`.

import nextEnv from '@next/env';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

nextEnv.loadEnvConfig(process.cwd(), true);   // dev: .env.development.local on top of .env.local

const dbName = process.env.MONGODB_DB || '';
if (!dbName.endsWith('_dev')) {
  console.error(`❌  Refusing to seed "${dbName || '(the URI\'s default database)'}" — set MONGODB_DB=nafeer_dev in .env.development.local.`);
  process.exit(1);
}

// 1. Roles and the admin, through the existing seed script.
const base = spawnSync(process.execPath, ['scripts/seed.js'], { stdio: 'inherit', env: process.env });
if (base.status !== 0) process.exit(base.status ?? 1);

const { default: mongoose } = await import('mongoose');
const { connectDB } = await import('@/lib/db');
const { Contributor } = await import('@/lib/models/Contributor');
const { ContributorRole } = await import('@/lib/models/ContributorRole');
const { Lesson } = await import('@/lib/models/Lesson');
const { Unit } = await import('@/lib/models/Unit');
const { openSubject, createUnit } = await import('@/lib/api/subject');
const { ensureSystemSeedContributor } = await import('@/lib/SeedActor');
const { initialChangelog } = await import('@/lib/models/versioning');
const { interviewSnapshot } = await import('@/lib/interview');
const { DEV_PERSONAS, DEV_APPLICANTS, DEV_SUBJECT, DEV_OTHER_SUBJECT, devEmail } = await import('@/lib/devPersonas');
const { DEFAULT_LEAD_PERMISSIONS } = await import('@/lib/leads');

await connectDB();
console.log(`\n🧪  Seeding personas into ${mongoose.connection.name}…`);

// 2. The two subjects, opened, with a few units of empty lessons owned by the
//    seed actor — what the owner would add from the textbook. Lesson counts
//    per unit; a subject that already has units is left as it is.
const FIXTURE = {
  [DEV_SUBJECT]:       [4, 4, 3],
  [DEV_OTHER_SUBJECT]: [3, 3],
};
const seedActor = await ensureSystemSeedContributor();
for (const [s, counts] of Object.entries(FIXTURE)) {
  await openSubject(s);
  if (await Unit.exists({ subjectId: s })) {
    console.log(`   ✓  ${s} units (already there)`);
    continue;
  }
  for (const [i, n] of counts.entries()) {
    const unit = await createUnit(s, { title: `الوحدة ${i + 1}`, targetLessons: n });
    await Lesson.insertMany(Array.from({ length: n }, (_, k) => ({
      contentId: `${unit.contentId}_L${k + 1}`, subjectId: s, unitContentId: unit.contentId,
      title: `الدرس ${k + 1}`, order: k + 1, estimatedMinutes: 15, summary: null,
      createdBy: seedActor, changelog: initialChangelog(seedActor),
    })));
  }
  console.log(`   ✓  ${s}: ${counts.length} units, ${counts.reduce((a, b) => a + b, 0)} lessons`);
}

const DAY = 86_400_000;
const now = Date.now();

// 3. Personas.
const byUsername = {};
for (const p of DEV_PERSONAS) {
  const lead = p.lead
    ? { active: true, subject: p.subject, ...DEFAULT_LEAD_PERMISSIONS, ...p.lead, since: new Date(now - 30 * DAY), appointedBy: 'seed:dev', awayUntil: null }
    : { active: false };
  const paused = p.paused
    ? { active: true, until: new Date(now + p.paused.days * DAY), reason: p.paused.reason, byId: '', byName: 'سارة القائدة', at: new Date(now - DAY) }
    : { active: false };

  const doc = await Contributor.findOneAndUpdate(
    { email: devEmail(p.username) },
    {
      $set: {
        name: p.name, username: p.username, subject: p.subject,
        role: 'contributor', status: 'approved', onboarded: true,
        lead, paused, bio: p.about,
        'stats.lastActiveAt': new Date(now - DAY),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  byUsername[p.username] = doc;
  console.log(`   ✓  @${p.username} — ${p.about}`);
}
// The pause names its lead.
await Contributor.updateOne({ username: 'dev_paused' }, { $set: { 'paused.byId': String(byUsername.dev_lead._id) } });

// 4. Lessons in the dev subject, put into known states.
const lessons = await Lesson.find({ subjectId: DEV_SUBJECT }).sort({ unitContentId: 1, order: 1 }).limit(6).lean();
if (lessons.length < 5) throw new Error(`Expected at least 5 ${DEV_SUBJECT} lessons, found ${lessons.length}`);
const id = (u) => byUsername[u]._id;
const reset = { reviewState: { returned: false, round: 0, returnedAt: null, returnedByName: '', submittedAt: null }, notes: [], notesCount: 0, intervention: null, credits: [] };

const states = [
  { l: lessons[0], owner: 'dev_member',  title: 'الخريطة ومقياس الرسم', status: 'review',
    extra: { 'reviewState.submittedAt': new Date(now - 2 * DAY) }, label: 'بانتظار المراجعة (منى)' },
  { l: lessons[1], owner: 'dev_member',  title: 'خطوط الطول ودوائر العرض', status: 'approved',
    extra: { reviewedAt: new Date(now - 5 * DAY) }, label: 'معتمد (منى)' },
  { l: lessons[2], owner: 'dev_member2', title: 'التضاريس الكبرى', status: 'draft',
    extra: {
      'reviewState.returned': true, 'reviewState.round': 1, 'reviewState.returnedAt': new Date(now - DAY),
      'reviewState.returnedByName': 'سارة القائدة',
      notes: [{
        text: 'المثال عن الهضاب يحتاج خريطة، والملخص أطول من اللازم.', authorId: id('dev_lead'),
        authorName: 'سارة القائدة', authorRole: 'lead', noteType: 'review_feedback', resolved: false,
        anchor: { kind: 'lesson', id: null, label: 'الدرس كله' }, round: 1, createdAt: new Date(now - DAY),
      }],
      notesCount: 1,
    }, label: 'أُعيد بملاحظة (عمر)' },
  { l: lessons[3], owner: 'dev_lead',    title: 'المناخ وعناصره', status: 'review',
    extra: { 'reviewState.submittedAt': new Date(now - DAY) }, label: 'درس سارة بانتظار المراجعة — يراجعه خالد' },
  { l: lessons[4], owner: 'dev_member2', title: 'الأنهار في السودان', status: 'draft',
    extra: {}, stale: true, label: 'مسودة راكدة (عمر)' },
];

for (const s of states) {
  // Fold `reviewState.x` into the reset reviewState: one update cannot set the
  // object and a path inside it.
  const extra = {};
  const reviewState = { ...reset.reviewState };
  for (const [k, v] of Object.entries(s.extra)) {
    if (k.startsWith('reviewState.')) reviewState[k.slice('reviewState.'.length)] = v;
    else extra[k] = v;
  }
  await Lesson.updateOne(
    { contentId: s.l.contentId },
    { $set: { ...reset, reviewState, ownerId: id(s.owner), title: s.title, summary: `ملخص تجريبي: ${s.title}`, status: s.status, ...extra,
      credits: [{ contributorId: id(s.owner), name: byUsername[s.owner].name, kind: 'author', at: new Date(now - 10 * DAY) }] } },
    { timestamps: false },
  );
  // "Stale" is measured on updatedAt, which the update above left alone.
  await Lesson.collection.updateOne(
    { contentId: s.l.contentId },
    { $set: { updatedAt: new Date(now - (s.stale ? 20 : 1) * DAY) } },
  );
  console.log(`   ✓  ${s.l.contentId} — ${s.label}`);
}

// 5. Applicants for the dev subject.
const role = await ContributorRole.findOne({ category: 'learning', isActive: true }).lean();
for (const a of DEV_APPLICANTS) {
  const snapshot = role ? interviewSnapshot(role, [DEV_SUBJECT]) : null;
  await Contributor.findOneAndUpdate(
    { email: devEmail(a.key) },
    {
      $set: {
        name: a.name, status: 'pending', onboarded: false, subject: '',
        subjectsOfInterest: [DEV_SUBJECT, DEV_OTHER_SUBJECT],
        background: 'طالبة جامعية — كلية التربية، قسم الجغرافيا',
        fieldOfStudy: 'الجغرافيا', subjectRelation: 'uni', weeklyHours: '5-10',
        hasPcOrTablet: true, hasStableInternet: true, usesAiTools: true, aiToolsList: ['chatgpt'],
        age: '18-22', town: 'كسلا',
        roleId: role?._id || null,
        statusToken: randomBytes(32).toString('hex'),
        interviewToken: randomBytes(32).toString('hex'),
        interviewExpiresAt: new Date(now + 14 * DAY),
        interviewSnapshot: snapshot,
        pendingDecision: null,
        ...(a.answered
          ? {
              dynamicAnswers: (snapshot?.questions || []).map((q) => ({
                questionId: q._id, question: q.text,
                answer: 'أدرّس إخوتي الجغرافيا منذ سنتين، وأحب أن أربط الخريطة بما يعرفه الطالب من حوله قبل المصطلح.',
              })),
              dynamicMicroTask: 'شرح مختصر: خط الاستواء دائرة وهمية تقسم الأرض نصفين، شمالي وجنوبي…',
              dynamicAnswersSubmittedAt: new Date(now - DAY),
            }
          : { dynamicAnswers: [], dynamicMicroTask: '', dynamicAnswersSubmittedAt: null }),
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );
  console.log(`   ✓  applicant ${a.name} — ${a.about}`);
}

console.log('\n✅  Dev data ready. Start `npm run dev`, then open http://localhost:3000/dev/login\n');
await mongoose.disconnect();
