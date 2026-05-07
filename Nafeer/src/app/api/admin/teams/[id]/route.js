import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminToken } from '@/lib/adminAuth';
import { Team }            from '@/lib/models/Team';
import { Contributor }     from '@/lib/models/Contributor';

// ─── PATCH /api/admin/teams/[id] ─────────────────────────────────────────────
// Actions:
//   update_info    — { name, description, subject }
//   add_member     — { contributorId, teamRole? }
//   remove_member  — { contributorId }
//   set_role       — { contributorId, teamRole }   (change leader / member)

export async function PATCH(request, { params }) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id }     = await params;
  const body       = await request.json();
  const { action } = body;

  if (!action) {
    return NextResponse.json({ ok: false, error: 'الإجراء مطلوب' }, { status: 400 });
  }

  await connectDB();

  const team = await Team.findById(id);
  if (!team) return NextResponse.json({ ok: false, error: 'الفريق غير موجود' }, { status: 404 });

  // ── update_info ─────────────────────────────────────────────────────────────
  if (action === 'update_info') {
    const { name, description, subject } = body;
    if (name !== undefined)        team.name        = name.trim();
    if (description !== undefined) team.description = description.trim();
    if (subject !== undefined)     team.subject     = subject.trim();

    if (!team.name) {
      return NextResponse.json({ ok: false, error: 'اسم الفريق لا يمكن أن يكون فارغاً' }, { status: 400 });
    }
  }

  // ── add_member ──────────────────────────────────────────────────────────────
  else if (action === 'add_member') {
    const { contributorId, teamRole = 'member' } = body;
    if (!contributorId) {
      return NextResponse.json({ ok: false, error: 'contributorId مطلوب' }, { status: 400 });
    }

    // Verify contributor exists
    const exists = await Contributor.exists({ _id: contributorId });
    if (!exists) {
      return NextResponse.json({ ok: false, error: 'المساهم غير موجود' }, { status: 404 });
    }

    // Prevent duplicates
    const already = team.members.some((m) => m.contributorId.toString() === contributorId);
    if (already) {
      return NextResponse.json({ ok: false, error: 'المساهم عضو بالفعل في هذا الفريق' }, { status: 409 });
    }

    // A team can only have one leader
    if (teamRole === 'leader') {
      const existingLeader = team.members.find((m) => m.teamRole === 'leader');
      if (existingLeader) {
        existingLeader.teamRole = 'member';
      }
    }

    team.members.push({ contributorId, teamRole });
  }

  // ── remove_member ────────────────────────────────────────────────────────────
  else if (action === 'remove_member') {
    const { contributorId } = body;
    if (!contributorId) {
      return NextResponse.json({ ok: false, error: 'contributorId مطلوب' }, { status: 400 });
    }
    const before = team.members.length;
    team.members = team.members.filter((m) => m.contributorId.toString() !== contributorId);
    if (team.members.length === before) {
      return NextResponse.json({ ok: false, error: 'المساهم ليس عضواً في الفريق' }, { status: 404 });
    }
  }

  // ── set_role ─────────────────────────────────────────────────────────────────
  else if (action === 'set_role') {
    const { contributorId, teamRole } = body;
    if (!contributorId || !teamRole) {
      return NextResponse.json({ ok: false, error: 'contributorId و teamRole مطلوبان' }, { status: 400 });
    }

    const member = team.members.find((m) => m.contributorId.toString() === contributorId);
    if (!member) {
      return NextResponse.json({ ok: false, error: 'المساهم ليس عضواً في الفريق' }, { status: 404 });
    }

    // Demote previous leader if promoting someone new
    if (teamRole === 'leader') {
      team.members.forEach((m) => { if (m.teamRole === 'leader') m.teamRole = 'member'; });
    }

    member.teamRole = teamRole;
  }

  else {
    return NextResponse.json({ ok: false, error: `إجراء غير معروف: ${action}` }, { status: 400 });
  }

  await team.save();

  // Re-populate for the response
  const populated = await Team.findById(team._id).lean();
  const allIds    = populated.members.map((m) => m.contributorId);
  const contribs  = allIds.length
    ? await Contributor
        .find({ _id: { $in: allIds } })
        .select('name username avatarUrl subject')
        .lean()
    : [];
  const map = Object.fromEntries(contribs.map((c) => [c._id.toString(), c]));
  populated.members = populated.members.map((m) => ({
    ...m,
    contributor: map[m.contributorId.toString()] ?? null,
  }));

  return NextResponse.json({ ok: true, team: populated });
}

// ─── DELETE /api/admin/teams/[id] ────────────────────────────────────────────

export async function DELETE(_, { params }) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const deleted = await Team.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ ok: false, error: 'الفريق غير موجود' }, { status: 404 });

  return NextResponse.json({ ok: true });
}