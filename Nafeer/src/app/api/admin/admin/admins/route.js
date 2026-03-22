import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { Admin }           from '@/lib/models/Admin';
import { verifyAdminAuth } from '@/lib/adminAuth';

// ─── GET /api/admin/admins ────────────────────────────────────────────────────

export async function GET(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  await connectDB();
  const admins = await Admin.find().sort({ createdAt: 1 });
  return NextResponse.json({ admins });
}

// ─── POST /api/admin/admins — create new admin ────────────────────────────────

export async function POST(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    const { username, email, password, displayName } = await request.json();

    if (!username?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ ok: false, error: 'اسم المستخدم والبريد وكلمة المرور مطلوبة' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
    }

    await connectDB();

    const existing = await Admin.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });
    if (existing) {
      return NextResponse.json({ ok: false, error: 'اسم المستخدم أو البريد مستخدم بالفعل' }, { status: 409 });
    }

    const passwordHash = await Admin.hashPassword(password);
    const admin = await Admin.create({
      username:    username.toLowerCase().trim(),
      email:       email.toLowerCase().trim(),
      displayName: displayName?.trim() || username.trim(),
      passwordHash,
    });

    const { passwordHash: _, ...safe } = admin.toObject();
    return NextResponse.json({ ok: true, admin: safe }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ ok: false, error: 'اسم المستخدم أو البريد مستخدم بالفعل' }, { status: 409 });
    }
    console.error('[POST /api/admin/admins]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ─── PATCH /api/admin/admins — update or reset password ──────────────────────

export async function PATCH(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    const { id, action, ...body } = await request.json();
    await connectDB();

    const admin = await Admin.findById(id).select('+passwordHash');
    if (!admin) return NextResponse.json({ ok: false, error: 'المشرف غير موجود' }, { status: 404 });

    if (action === 'set_password') {
      if (!body.password || body.password.length < 8) {
        return NextResponse.json({ ok: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
      }
      admin.passwordHash = await Admin.hashPassword(body.password);
    } else if (action === 'toggle_active') {
      admin.isActive = !admin.isActive;
    } else if (action === 'update') {
      if (body.displayName !== undefined) admin.displayName = body.displayName.trim();
      if (body.email !== undefined)       admin.email       = body.email.toLowerCase().trim();
    }

    await admin.save();
    const { passwordHash: _, ...safe } = admin.toObject();
    return NextResponse.json({ ok: true, admin: safe });
  } catch (err) {
    console.error('[PATCH /api/admin/admins]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ─── DELETE /api/admin/admins ─────────────────────────────────────────────────

export async function DELETE(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    const { id } = await request.json();
    await connectDB();

    // Prevent deleting last active admin
    const activeCount = await Admin.countDocuments({ isActive: true });
    const target = await Admin.findById(id);
    if (target?.isActive && activeCount <= 1) {
      return NextResponse.json(
        { ok: false, error: 'لا يمكن حذف المشرف الوحيد النشط' },
        { status: 409 }
      );
    }

    await Admin.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/admins]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
