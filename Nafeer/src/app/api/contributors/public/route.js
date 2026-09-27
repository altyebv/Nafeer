import { NextResponse } from 'next/server';
import { getPublicContributor, listPublicContributors } from '@/lib/api/contributors';
import { computeContributorScore } from '@/lib/contributorScore';

// ─── GET /api/contributors/public ─────────────────────────────────────────────
// Public — when called with ?username=xxx returns a single contributor profile.
// Without a username param, returns all approved contributors sorted by score.

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // ── Single contributor lookup (used by the profile page) ──────────────────
    if (username) {
      const contributor = await getPublicContributor(username);

      if (!contributor) {
        return NextResponse.json({ ok: false, contributor: null }, { status: 404 });
      }

      return NextResponse.json({ ok: true, contributor });
    }

    // ── Full list (leaderboard / directory) ───────────────────────────────────
    const contributors = await listPublicContributors();

    // Sort by contribution score descending
    const scored = contributors.map((c) => ({
      ...c,
      _score: computeContributorScore(c.stats),
    }));

    scored.sort((a, b) => b._score - a._score);

    const result = scored.map(({ _score, ...c }) => c);

    return NextResponse.json({ ok: true, contributors: result });
  } catch {
    return NextResponse.json({ ok: false, contributors: [] }, { status: 500 });
  }
}