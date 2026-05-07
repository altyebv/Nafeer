import { NextResponse } from 'next/server';
import { connectDB }         from '@/lib/db';
import { Contributor }       from '@/lib/models/Contributor';
import { requireContributor } from '@/lib/api/guard';

// ─── GET /api/contributor/profile ─────────────────────────────────────────────
// Returns the currently authenticated contributor's profile.

export async function GET() {
  try {
    const user = await requireContributor();
    await connectDB();

    const contributor = await Contributor
      .findById(user.id)
      .populate('roleId', 'name slug category');

    if (!contributor) {
      return NextResponse.json({ ok: false, error: 'المساهم غير موجود' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      profile: {
        id:          contributor._id,
        name:        contributor.name,
        username:    contributor.username,
        email:       contributor.email,
        bio:         contributor.bio,
        avatarUrl:   contributor.avatarUrl,
        subject:     contributor.subject,
        gender:      contributor.gender,
        role:        contributor.role,
        roleId:      contributor.roleId,
        stats:       contributor.stats,
        lastSignedInAt: contributor.lastSignedInAt,
        createdAt:   contributor.createdAt,
      },
    });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error('[GET /api/contributor/profile]', res);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ─── PATCH /api/contributor/profile ───────────────────────────────────────────
// Allows contributors to update their own: username, bio, name.

export async function PATCH(request) {
  try {
    const user = await requireContributor();
    const { username, bio, name } = await request.json();

    await connectDB();

    const contributor = await Contributor.findById(user.id);
    if (!contributor) {
      return NextResponse.json({ ok: false, error: 'المساهم غير موجود' }, { status: 404 });
    }

    // ── Username ──────────────────────────────────────────────────────────────
    if (username !== undefined) {
      const trimmed = username.trim().toLowerCase();
      if (!trimmed) {
        return NextResponse.json({ ok: false, error: 'اسم المستخدم لا يمكن أن يكون فارغاً' }, { status: 400 });
      }
      // Uniqueness check — exclude self
      const taken = await Contributor.findOne({ username: trimmed, _id: { $ne: user.id } });
      if (taken) {
        return NextResponse.json({ ok: false, error: 'اسم المستخدم مأخوذ بالفعل' }, { status: 409 });
      }
      contributor.username = trimmed;
    }

    // ── Bio ───────────────────────────────────────────────────────────────────
    if (bio !== undefined) {
      if (bio.length > 280) {
        return NextResponse.json({ ok: false, error: 'النبذة لا يمكن أن تتجاوز 280 حرفاً' }, { status: 400 });
      }
      contributor.bio = bio.trim();
    }

    // ── Display name ──────────────────────────────────────────────────────────
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ ok: false, error: 'الاسم مطلوب' }, { status: 400 });
      }
      contributor.name = name.trim();
    }

    await contributor.save();

    return NextResponse.json({
      ok: true,
      profile: {
        id:        contributor._id,
        name:      contributor.name,
        username:  contributor.username,
        bio:       contributor.bio,
        avatarUrl: contributor.avatarUrl,
      },
    });
  } catch (res) {
    if (res instanceof Response) return res;
    // Mongoose validation errors
    if (res.name === 'ValidationError') {
      const msg = Object.values(res.errors)[0]?.message || 'بيانات غير صالحة';
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
    console.error('[PATCH /api/contributor/profile]', res);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}