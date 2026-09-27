import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Contributor } from '@/lib/models/Contributor';
import { ContributorActivity } from '@/lib/models/ContributorActivity';
import { PUBLIC_FILTER } from '@/lib/api/contributors';
import { computeContributorScore } from '@/lib/contributorScore';

const DAY_MS = 86_400_000;

// Builds { 'YYYY-MM-DD': count } from raw activity docs, oldest key first.
function heatmapFromDocs(docs) {
  const map = {};
  for (const doc of docs) {
    const key = doc.createdAt.toISOString().slice(0, 10);
    map[key] = (map[key] || 0) + 1;
  }
  return map;
}

// Consecutive-day streak ending today (or yesterday, if nothing logged yet today).
function computeStreak(dayMap) {
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  const todayKey = cursor.toISOString().slice(0, 10);
  if (!dayMap[todayKey]) cursor.setUTCDate(cursor.getUTCDate() - 1);

  let streak = 0;
  while (dayMap[cursor.toISOString().slice(0, 10)]) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

// ─── GET /api/contributors/activity ────────────────────────────────────────────
// Two modes, mirroring /api/contributors/public:
//
// - No `username` (session-authenticated): private heatmap for the editor
//   dashboard. Returns { ok, data: { 'YYYY-MM-DD': count } } for the last 16 weeks.
//
// - `?username=xxx` (public): richer activity summary for the public profile —
//   stats, rank among contributors, tenure, streak, and a heatmap of its own.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    await connectDB();

    // ── Public profile mode ────────────────────────────────────────────────
    if (username) {
      const contributor = await Contributor
        .findOne({ ...PUBLIC_FILTER, username }, '_id stats createdAt')
        .lean();

      if (!contributor) {
        return NextResponse.json({ ok: false, activity: null }, { status: 404 });
      }

      const since = new Date(Date.now() - 400 * DAY_MS);
      const docs = await ContributorActivity
        .find({ contributorId: contributor._id, createdAt: { $gte: since } }, 'createdAt')
        .lean();

      const fullMap    = heatmapFromDocs(docs);
      const streakDays = computeStreak(fullMap);
      const tenureDays = Math.floor((Date.now() - new Date(contributor.createdAt).getTime()) / DAY_MS);

      // Trim the heatmap sent to the client down to the last 20 weeks — plenty
      // to render, no need to ship a year of near-empty days.
      const heatmapSince = Date.now() - 140 * DAY_MS;
      const heatmap = Object.fromEntries(
        Object.entries(fullMap).filter(([key]) => new Date(key).getTime() >= heatmapSince)
      );

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
          stats:            contributor.stats || {},
          streakDays,
          tenureDays,
          joinRank:         joinRank + 1,
          rank:             rank || null,
          totalContributors: scored.length,
          heatmap,
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
      return NextResponse.json({ ok: true, data: {} });
    }

    const since = new Date(Date.now() - 112 * DAY_MS); // 16 weeks
    const docs = await ContributorActivity
      .find({ contributorId: user.id, createdAt: { $gte: since } }, 'createdAt')
      .lean();

    return NextResponse.json({ ok: true, data: heatmapFromDocs(docs) });
  } catch (err) {
    console.error('[GET /api/contributors/activity]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
