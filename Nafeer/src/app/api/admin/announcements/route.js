import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/mongodb';
import Announcement     from '@/models/Announcement';
import { getAdminSession } from '@/lib/auth';

// ─── GET /api/admin/announcements ─────────────────────────────────────────────
export async function GET(req) {
  try {
    const session = await getAdminSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const items = await Announcement.find()
      .sort({ pinned: -1, createdAt: -1 })
      .limit(80)
      .lean();

    const data = items.map((a) => ({
      id:                   a._id.toString(),
      title:                a.title,
      body:                 a.body,
      type:                 a.type,
      pinned:               a.pinned,
      authorId:             a.authorId?.toString(),
      authorName:           a.authorName,
      targetSubjects:       a.targetSubjects       || [],
      targetTeamIds:        a.targetTeamIds        || [],
      targetContributorIds: a.targetContributorIds || [],
      createdAt:            a.createdAt,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[GET /api/admin/announcements]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ─── POST /api/admin/announcements ────────────────────────────────────────────
//
// Body:
//   title                string   required
//   body                 string   required
//   type                 string   'info' | 'update' | 'warning' | 'urgent'
//   pinned               boolean
//   targetSubjects       string[] subject IDs  (existing)
//   targetTeamIds        string[] team _ids    (new)
//   targetContributorIds string[] contributor _ids (new)
//
// Audience priority (mutually exclusive, in order):
//   1. targetContributorIds → send to specific contributors only
//   2. targetTeamIds        → send to all members of given teams
//   3. targetSubjects       → send to contributors assigned those subjects
//   4. (none)               → broadcast to all
//
export async function POST(req) {
  try {
    const session = await getAdminSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      title,
      body: content,
      type                 = 'info',
      pinned               = false,
      targetSubjects       = [],
      targetTeamIds        = [],
      targetContributorIds = [],
    } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }

    const VALID_TYPES = ['info', 'update', 'warning', 'urgent'];
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }

    await connectDB();

    const doc = await Announcement.create({
      title:                title.trim(),
      body:                 content.trim(),
      type,
      pinned:               Boolean(pinned),
      authorId:             session.id,
      authorName:           session.name || session.email || 'الإدارة',
      targetSubjects:       Array.isArray(targetSubjects)       ? targetSubjects       : [],
      targetTeamIds:        Array.isArray(targetTeamIds)        ? targetTeamIds        : [],
      targetContributorIds: Array.isArray(targetContributorIds) ? targetContributorIds : [],
    });

    return NextResponse.json({
      ok:  true,
      id:  doc._id.toString(),
      doc: {
        id:                   doc._id.toString(),
        title:                doc.title,
        body:                 doc.body,
        type:                 doc.type,
        pinned:               doc.pinned,
        targetSubjects:       doc.targetSubjects,
        targetTeamIds:        doc.targetTeamIds,
        targetContributorIds: doc.targetContributorIds,
        createdAt:            doc.createdAt,
      },
    });
  } catch (err) {
    console.error('[POST /api/admin/announcements]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ─── DELETE /api/admin/announcements?id=xxx ───────────────────────────────────
export async function DELETE(req) {
  try {
    const session = await getAdminSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    await connectDB();
    await Announcement.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/announcements]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ─── PATCH /api/admin/announcements ──────────────────────────────────────────
// Toggle pinned, update fields, etc.
export async function PATCH(req) {
  try {
    const session = await getAdminSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    // Whitelist updatable fields
    const allowed = ['title', 'body', 'type', 'pinned', 'targetSubjects', 'targetTeamIds', 'targetContributorIds'];
    const patch   = {};
    for (const key of allowed) {
      if (key in updates) patch[key] = updates[key];
    }

    await connectDB();
    const doc = await Announcement.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ok: true, doc });
  } catch (err) {
    console.error('[PATCH /api/admin/announcements]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}