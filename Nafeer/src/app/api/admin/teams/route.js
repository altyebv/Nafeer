import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminToken } from '@/lib/adminAuth';
import { Team }            from '@/lib/models/Team';
import { Contributor }     from '@/lib/models/Contributor';

// ─── GET /api/admin/teams ─────────────────────────────────────────────────────
// Returns all teams with members populated (name, username, avatarUrl, subject).

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const teams = await Team
    .find({})
    .sort({ createdAt: -1 })
    .lean();

  // Populate contributor details for all members across all teams in one query
  const allIds = teams.flatMap((t) => t.members.map((m) => m.contributorId));
  const contributors = allIds.length
    ? await Contributor
        .find({ _id: { $in: allIds } })
        .select('name username avatarUrl subject roleId')
        .populate('roleId', 'name slug')
        .lean()
    : [];

  const contributorMap = Object.fromEntries(contributors.map((c) => [c._id.toString(), c]));

  const enriched = teams.map((team) => ({
    ...team,
    members: team.members.map((m) => ({
      ...m,
      contributor: contributorMap[m.contributorId.toString()] ?? null,
    })),
  }));

  return NextResponse.json({ ok: true, teams: enriched });
}

// ─── POST /api/admin/teams ────────────────────────────────────────────────────
// Creates a new team.
// Body: { name, description?, subject? }

export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { name, description, subject } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ ok: false, error: 'اسم الفريق مطلوب' }, { status: 400 });
  }

  await connectDB();

  const team = await Team.create({
    name:        name.trim(),
    description: description?.trim() || '',
    subject:     subject?.trim()     || '',
    members:     [],
  });

  return NextResponse.json({ ok: true, team }, { status: 201 });
}