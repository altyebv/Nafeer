import { NextResponse }                        from 'next/server';
import { connectDB }                           from '@/lib/db';
import { Admin }                               from '@/lib/models/Admin';
import { issueAdminToken, setAdminCookie }     from '@/lib/adminAuth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username?.trim() || !password) {
      return NextResponse.json({ message: 'يرجى تعبئة جميع الحقول' }, { status: 400 });
    }

    await connectDB();

    // Find by username OR email
    const admin = await Admin
      .findOne({
        $or: [
          { username: username.toLowerCase().trim() },
          { email:    username.toLowerCase().trim() },
        ],
        isActive: true,
      })
      .select('+passwordHash');

    if (!admin) {
      return NextResponse.json({ message: 'بيانات غير صحيحة' }, { status: 401 });
    }

    const valid = await admin.comparePassword(password);
    if (!valid) {
      return NextResponse.json({ message: 'بيانات غير صحيحة' }, { status: 401 });
    }

    // Stamp last sign-in
    admin.lastSignedInAt = new Date();
    await admin.save();

    const token = await issueAdminToken(admin);
    await setAdminCookie(token);

    return NextResponse.json({
      success:     true,
      displayName: admin.displayName || admin.username,
    });
  } catch (err) {
    console.error('[POST /api/admin/login]', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
