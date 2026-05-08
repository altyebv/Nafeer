import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
import {Team}             from '@/lib/models/Team';
import {Contributor}      from '@/lib/models/Contributor';

// ─── GET /api/contributors/teams?username=xxx ─────────────────────────────────
//
// Public endpoint — no auth required (profile pages are public).
// Returns the teams a contributor belongs to, with their role in each team.
//
// Response:
//   {
//     ok: true,
//     teams: [
//       {
//         teamRole: 'leader' | 'member',
//         team: { _id, name, description, membersCount }
//       }
//     ]
//   }
//
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    if (!username) return NextResponse.json({ error: 'username is required' }, { status: 400 });

    await connectDB();

    // Find contributor by username
    const contributor = await Contributor.findOne({ username }).select('_id').lean();
    if (!contributor) return NextResponse.json({ ok: true, teams: [] });

    // Find all teams that have this contributor as a member
    const memberTeams = await Team.find({
      'members.contributorId': contributor._id,
    })
      .select('_id name description members')
      .lean();

    const teams = memberTeams.map((t) => {
      const membership = t.members.find(
        (m) => m.contributorId?.toString() === contributor._id.toString()
      );
      return {
        teamRole: membership?.teamRole || 'member',
        team: {
          _id:          t._id.toString(),
          name:         t.name,
          description:  t.description || null,
          membersCount: t.members.length,
        },
      };
    });

    // Sort: leader roles first, then alphabetically by team name
    teams.sort((a, b) => {
      if (a.teamRole === 'leader' && b.teamRole !== 'leader') return -1;
      if (b.teamRole === 'leader' && a.teamRole !== 'leader') return 1;
      return a.team.name.localeCompare(b.team.name, 'ar');
    });

    return NextResponse.json({ ok: true, teams });
  } catch (err) {
    console.error('[GET /api/contributors/teams]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}