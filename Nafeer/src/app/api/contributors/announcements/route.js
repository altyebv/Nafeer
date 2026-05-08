import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/mongodb';
import Announcement     from '@/models/Announcement';
import Contributor      from '@/models/Contributor';
import Team             from '@/models/Team';
import { getContributorSession } from '@/lib/auth';

// ─── GET /api/contributors/announcements ──────────────────────────────────────
//
// Returns announcements relevant to the authenticated contributor:
//   • Broadcast (no targets set on any targeting field)
//   • Targeted at contributor's subject
//   • Targeted at a team the contributor belongs to
//   • Targeted directly at the contributor by _id
//
// Response shape:
//   { ok: true, data: Announcement[] }
//
// Each item:
//   { id, title, body, type, pinned, authorName, createdAt }
//
export async function GET(req) {
  try {
    const session = await getContributorSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    // Fetch contributor record for subject + _id
    const contributor = await Contributor.findById(session.id).select('subject _id').lean();
    if (!contributor) return NextResponse.json({ error: 'Contributor not found' }, { status: 404 });

    const contributorId = contributor._id.toString();

    // Fetch teams this contributor belongs to
    const memberTeams = await Team.find({
      'members.contributorId': contributor._id,
    }).select('_id').lean();
    const teamIds = memberTeams.map((t) => t._id.toString());

    // Query: broadcast OR subject match OR team match OR direct target
    const query = {
      $or: [
        // Broadcast — all three targeting arrays are empty
        {
          targetSubjects:       { $size: 0 },
          targetTeamIds:        { $size: 0 },
          targetContributorIds: { $size: 0 },
        },
        // Subject-targeted and contributor has that subject
        ...(contributor.subject
          ? [{ targetSubjects: contributor.subject }]
          : []),
        // Team-targeted and contributor is in that team
        ...(teamIds.length > 0
          ? [{ targetTeamIds: { $in: teamIds } }]
          : []),
        // Directly targeted contributor
        { targetContributorIds: contributorId },
      ],
    };

    const items = await Announcement.find(query)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(40)
      .lean();

    const data = items.map((a) => ({
      id:         a._id.toString(),
      title:      a.title,
      body:       a.body,
      type:       a.type       || 'info',
      pinned:     a.pinned     || false,
      authorName: a.authorName || 'الإدارة',
      createdAt:  a.createdAt,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[GET /api/contributors/announcements]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}