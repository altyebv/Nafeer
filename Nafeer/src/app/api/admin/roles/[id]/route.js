import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { ContributorRole } from '@/lib/models/ContributorRole';
import { Contributor }     from '@/lib/models/Contributor';

// ─── PUT /api/admin/roles/[id] ────────────────────────────────────────────────
// Full or partial update of a role.

export async function PUT(request, { params }) {
  const authErr = await verifyAdminAuth(request);
  if (authErr) return authErr;

  const { id } = await params;

  try {
    const body = await request.json();
    await connectDB();

    const role = await ContributorRole.findById(id);
    if (!role) {
      return NextResponse.json({ ok: false, error: 'الدور غير موجود' }, { status: 404 });
    }

    const allowed = ['name', 'category', 'subcategory', 'description', 'portfolioPrompt', 'interviewQuestions', 'microTask', 'isActive', 'order'];
    allowed.forEach((key) => {
      if (body[key] !== undefined) role[key] = body[key];
    });

    // Re-slug if name changed
    if (body.name && body.name !== role.name) {
      role.slug = body.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0600-\u06FF-]/g, '')
        .slice(0, 60);
    }

    await role.save();
    return NextResponse.json({ ok: true, role });
  } catch (err) {
    console.error('[PUT /api/admin/roles/[id]]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ─── DELETE /api/admin/roles/[id] ────────────────────────────────────────────
// Deletes a role. Blocks deletion if contributors are assigned to it.

export async function DELETE(request, { params }) {
  const authErr = await verifyAdminAuth(request);
  if (authErr) return authErr;

  const { id } = await params;

  try {
    await connectDB();

    // Safety check — don't orphan contributors
    const assignedCount = await Contributor.countDocuments({ roleId: id });
    if (assignedCount > 0) {
      return NextResponse.json(
        { ok: false, error: `لا يمكن حذف هذا الدور — ${assignedCount} مساهم مرتبط به` },
        { status: 409 }
      );
    }

    await ContributorRole.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/roles/[id]]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}