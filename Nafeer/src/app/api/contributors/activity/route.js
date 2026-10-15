import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Contributor } from '@/lib/models/Contributor';
import { ContributorActivity } from '@/lib/models/ContributorActivity';
import { PUBLIC_FILTER } from '@/lib/api/contributors';
import { computeContributorScore } from '@/lib/contributorScore';
import { bucketActivity, summarizeActivity, dayKey, shiftKey } from '@/lib/activity';

const DAY_MS = 86_400_000;

// Keep only the last `windowDays` of a day map — no need to ship a year of
// near-empty days to draw a few months.
function trimDays(days, todayKey, windowDays) {
  const from = shiftKey(todayKey, -(windowDays - 1));
  return Object.fromEntries(Object.entries(days).filter(([key]) => key >= from));
}

// ─── GET /api/contributors/activity ────────────────────────────────────────────
// Days are calendar dates in Sudan time (src/lib/activity.js), each with its
// total and a per-type breakdown: { 'YYYY-MM-DD': { n, by: { type: count } } }.
// The type was always stored on every event; it used to be thrown away here.
//
// Two modes, mirroring /api/contributors/public:
//
// - No `username` (session-authenticated): the editor dashboard's graph for
//   the last 16 weeks, its summary, and the contributor's current stats. The
//   stats ride along so the dashboard stops reading the stale copy in the
//   session — that copy is why it showed 0 blocks while the public profile,
//   which reads the database, showed 7. Same request; one extra findById.
//
// - `?username=xxx` (public): richer summary for the public profile — stats,
//   rank, tenure, streak, and 20 weeks of days.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const todayKey = dayKey(new Date());

    await connectDB();

    // ── Public profile mode ────────────────────────────────────────────────
    if (username) {
      const contributor = await Contributor
        .findOne({ ...PUBLIC_FILTER, username }, '_id stats createdAt')
        .lean();

      if (!contributor) {
        return NextResponse.json({ ok: false, activity: null }, { status: 404 });
      }

      // 400 days so a long streak is counted in full; only 20 weeks are sent.
      const since = new Date(Date.now() - 400 * DAY_MS);
      const docs = await ContributorActivity
        .find({ contributorId: contributor._id, createdAt: { $gte: since } }, 'createdAt type')
        .lean();

      const allDays    = bucketActivity(docs);
      const summary    = summarizeActivity(allDays, todayKey, 140);
      const longStreak = summarizeActivity(allDays, todayKey, 400).streak;
      const tenureDays = Math.floor((Date.now() - new Date(contributor.createdAt).getTime()) / DAY_MS);

      const [joinRank, allStats] = await Promise.all([
        Contributor.countDocuments({ ...PUBLIC_FILTER, createdAt: { $lt: contributor.createdAt } }),
        Contributor.find(PUBLIC_FILTER, '_id stats').lean(),
      ]);

      const scored = allStats
        .map((c) => ({ id: c._id.toString(), score: computeContributorScore(c.stats) }))
        .sort((a, b) => b.score - a.score);
      const rank = scored.findIndex((c) => c.id === contributor._id.toString()) + 1;

      return NextResponse.json({
        ok: true,
        activity: {
          stats:             contributor.stats || {},
          streakDays:        longStreak,
          tenureDays,
          joinRank:          joinRank + 1,
          rank:              rank || null,
          totalContributors: scored.length,
          days:              trimDays(allDays, todayKey, 140),
          summary:           { ...summary, streak: longStreak },
        },
      });
    }

    // ── Private dashboard mode ─────────────────────────────────────────────
    // getCurrentUser() only ever decodes the contributor sign-in cookie — a
    // separate admin session (see src/lib/api/guard.js's getAdminAsUser) has no
    // Contributor _id and simply won't be signed in here, so no extra role
    // check is needed: any user resolved below has real stats to show.
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ ok: true, data: { days: {}, summary: null, stats: null } });
    }

    const WINDOW = 112; // 16 weeks
    const since = new Date(Date.now() - (WINDOW + 1) * DAY_MS);
    const [docs, contributor] = await Promise.all([
      ContributorActivity.find({ contributorId: user.id, createdAt: { $gte: since } }, 'createdAt type').lean(),
      Contributor.findById(user.id, 'stats').lean(),
    ]);

    const days = trimDays(bucketActivity(docs), todayKey, WINDOW);
    return NextResponse.json({
      ok: true,
      data: {
        days,
        summary: summarizeActivity(days, todayKey, WINDOW),
        stats:   contributor?.stats || null,
      },
    });
  } catch (err) {
    console.error('[GET /api/contributors/activity]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
