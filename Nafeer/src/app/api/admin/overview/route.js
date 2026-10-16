import { NextResponse }    from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { connectDB }       from '@/lib/db';
import { Contributor }     from '@/lib/models/Contributor';
import { ContributorActivity } from '@/lib/models/ContributorActivity';
import { Lesson }          from '@/lib/models/Lesson';
import { Section }         from '@/lib/models/Section';
import { Concept }         from '@/lib/models/Concept';
import { FeedItem }        from '@/lib/models/FeedItem';
import { Question }        from '@/lib/models/Question';
import { Subject }         from '@/lib/models/Subject';
import { SiteSettings }    from '@/lib/models/SiteSettings';
import { EmailLog }        from '@/lib/models/EmailLog';
import { REAL_PEOPLE } from '@/lib/SeedActor';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';
import { dayKey, shiftKey } from '@/lib/activity';
import { pipelineStage }   from '@/lib/adminPipeline';

const DAY_MS = 86_400_000;

// ─── GET /api/admin/overview ──────────────────────────────────────────────────
// Everything the overview screen shows, in one request (free tier: one round
// trip instead of the old three). Aggregates only — no documents are shipped.
//
//   decisions   what waits on the admin: review items, new answers, subjects
//               with nobody, catalog subjects missing from the database
//   subjects    per subject: lessons, lessons with content, people, last active
//   week        the last 7 Sudan days of contributor activity, per day
//   people      pipeline counts and how many were active this week
//   site/mail   landing counters and the email log totals
export async function GET() {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    await connectDB();
    const weekStart = new Date(Date.now() - 8 * DAY_MS);

    const [
      lessonAgg, contentLessons, dbSubjects, contributors,
      reviewCounts, activity, site, mailSent, mailFailed,
    ] = await Promise.all([
      Lesson.aggregate([{ $group: { _id: { s: '$subjectId', st: '$status' }, n: { $sum: 1 } } }]),
      Section.aggregate([{ $group: { _id: { s: '$subjectId', l: '$lessonContentId' } } }, { $group: { _id: '$_id.s', n: { $sum: 1 } } }]),
      Subject.find({}, 'subjectId').lean(),
      Contributor.find(
        { ...REAL_PEOPLE },
        'status subject onboarded interviewToken interviewAnswers.submittedAt dynamicAnswersSubmittedAt stats.lastActiveAt',
      ).select('+interviewToken').lean(),
      Promise.all([Lesson, Concept, FeedItem, Question].map((M) => M.countDocuments({ status: 'review' }))),
      ContributorActivity.find({ createdAt: { $gte: weekStart } }, 'contributorId createdAt').lean(),
      SiteSettings.findOne({}, 'visitCount supportCount').lean(),
      EmailLog.countDocuments({ status: 'sent' }),
      EmailLog.countDocuments({ status: 'failed' }),
    ]);

    // ── Subjects ──────────────────────────────────────────────────────────────
    const lessons = {};
    for (const { _id, n } of lessonAgg) {
      const row = (lessons[_id.s] ??= { total: 0, draft: 0, review: 0, approved: 0, archived: 0 });
      row.total += n;
      row[_id.st] = (row[_id.st] || 0) + n;
    }
    const withContent = Object.fromEntries(contentLessons.map((r) => [r._id, r.n]));
    const seeded = new Set(dbSubjects.map((s) => s.subjectId));

    const approved = contributors.filter((c) => c.status === 'approved');
    const bySubject = {};
    for (const c of approved) {
      if (!c.subject) continue;
      const row = (bySubject[c.subject] ??= { people: 0, lastActiveAt: null });
      row.people += 1;
      const last = c.stats?.lastActiveAt;
      if (last && (!row.lastActiveAt || last > row.lastActiveAt)) row.lastActiveAt = last;
    }

    const subjects = SUBJECTS_CATALOG.map((s) => ({
      id: s.id,
      nameAr: s.nameAr,
      track: s.track,
      seeded: seeded.has(s.id),
      lessons: lessons[s.id] || { total: 0, draft: 0, review: 0, approved: 0, archived: 0 },
      withContent: withContent[s.id] || 0,
      people: bySubject[s.id]?.people || 0,
      lastActiveAt: bySubject[s.id]?.lastActiveAt || null,
    }));

    // ── People ────────────────────────────────────────────────────────────────
    const pipeline = { new: 0, invited: 0, answered: 0, onboarding: 0, approved: 0, rejected: 0 };
    for (const c of contributors) pipeline[pipelineStage(c)] += 1;

    // ── Week ──────────────────────────────────────────────────────────────────
    const today = dayKey(new Date());
    const keys = Array.from({ length: 7 }, (_, i) => shiftKey(today, i - 6));
    const perDay = Object.fromEntries(keys.map((k) => [k, 0]));
    const activeIds = new Set();
    for (const a of activity) {
      const k = dayKey(a.createdAt);
      if (k in perDay) { perDay[k] += 1; activeIds.add(String(a.contributorId)); }
    }
    const realIds = new Set(approved.map((c) => String(c._id)));

    const totals = subjects.reduce((t, s) => ({
      lessons:     t.lessons + s.lessons.total,
      withContent: t.withContent + s.withContent,
      review:      t.review + (s.lessons.review || 0),
      approved:    t.approved + (s.lessons.approved || 0),
    }), { lessons: 0, withContent: 0, review: 0, approved: 0 });

    return NextResponse.json({
      ok: true,
      data: {
        decisions: {
          review:    reviewCounts.reduce((a, b) => a + b, 0),
          answered:  pipeline.answered,
          newRequests: pipeline.new,
          nobody:    subjects.filter((s) => s.seeded && !s.people).map((s) => s.id),
          unseeded:  subjects.filter((s) => !s.seeded).map((s) => s.id),
        },
        totals,
        subjects,
        week: {
          days: keys.map((k) => ({ key: k, n: perDay[k] })),
          total: Object.values(perDay).reduce((a, b) => a + b, 0),
          activePeople: [...activeIds].filter((id) => realIds.has(id)).length,
        },
        people: { pipeline, approved: approved.length },
        site: { visits: site?.visitCount ?? 0, support: site?.supportCount ?? 0 },
        mail: { sent: mailSent, failed: mailFailed },
      },
    });
  } catch (e) {
    console.error('[GET /api/admin/overview]', e);
    return NextResponse.json({ ok: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}
