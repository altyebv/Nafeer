import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
import { Contributor }  from '@/lib/models/Contributor';

// ─── GET /api/contributors/public ─────────────────────────────────────────────
// Public — returns approved contributors with safe fields only.
// Sorted by total contribution score (lessons * 3 + questions + feedItems * 2).

export async function GET() {
  try {
    await connectDB();

    const contributors = await Contributor.find(
      { status: 'approved', onboarded: true },
      {
        name: 1, username: 1, avatarUrl: 1, bio: 1,
        subject: 1, stats: 1, createdAt: 1,
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

    // Remove internal score field
    const result = scored.map(({ _score, ...c }) => c);

    return NextResponse.json({ ok: true, contributors: result });
  } catch {
    return NextResponse.json({ ok: true, contributors: [] });
  }
}