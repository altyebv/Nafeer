import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
import { Contributor }  from '@/lib/models/Contributor';

// ─── GET /api/contributors/public ─────────────────────────────────────────────
// Public — when called with ?username=xxx returns a single contributor profile.
// Without a username param, returns all approved contributors sorted by score.

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // ── Single contributor lookup (used by the profile page) ──────────────────
    if (username) {
      const contributor = await Contributor.findOne(
        { username, status: 'approved', onboarded: true },
        {
          name: 1, username: 1, avatarUrl: 1, bio: 1,
          subject: 1, role: 1, stats: 1, createdAt: 1,
        }
      ).lean();

      if (!contributor) {
        return NextResponse.json({ ok: false, contributor: null }, { status: 404 });
      }

      return NextResponse.json({
        ok: true,
        contributor: { ...contributor, _id: contributor._id.toString() },
      });
    }

    // ── Full list (leaderboard / directory) ───────────────────────────────────
    const contributors = await Contributor.find(
      { status: 'approved', onboarded: true },
      {
        name: 1, username: 1, avatarUrl: 1, bio: 1,
        subject: 1, role: 1, stats: 1, createdAt: 1,
      }
    ).lean();

    // Sort by contribution score descending
    const scored = contributors.map((c) => ({
      ...c,
      _id: c._id.toString(),
      _score:
        (c.stats?.lessonsCreated   || 0) * 3 +
        (c.stats?.questionsAdded   || 0) * 1 +
        (c.stats?.feedItemsCreated || 0) * 2 +
        (c.stats?.blocksAdded      || 0) * 0.5,
    }));

    scored.sort((a, b) => b._score - a._score);

    const result = scored.map(({ _score, ...c }) => c);

    return NextResponse.json({ ok: true, contributors: result });
  } catch {
    return NextResponse.json({ ok: false, contributors: [] }, { status: 500 });
  }
}