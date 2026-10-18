import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Admin } from '@/lib/models/Admin';
import { issueAdminToken, setAdminCookie } from '@/lib/adminAuth';

// ─── Dev-only route — disabled in production ─────────────────────────────────
// The admin twin of /api/dev/autologin: visit
// http://localhost:3000/api/dev/admin-login to get an admin session for the
// first active admin and land on the dashboard, without typing a password.
// Only works when NODE_ENV=development, like its contributor counterpart.
export async function GET(request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    await connectDB();
    const admin = await Admin.findOne({ isActive: true }).sort({ createdAt: 1 }).lean();
    if (!admin) return NextResponse.json({ error: 'No active admin — run npm run seed:admin' }, { status: 404 });

    await setAdminCookie(await issueAdminToken(admin));

    // Same reason as autologin: never redirect a local session to the deployed site.
    const next = new URL(request.url).searchParams.get('next') || '/admin/dashboard';
    return NextResponse.redirect(new URL(next.startsWith('/') ? next : '/admin/dashboard', 'http://localhost:3000'));
  } catch (err) {
    console.error('[GET /api/dev/admin-login]', err);
    return NextResponse.json({ error: 'Dev admin login failed', detail: String(err?.message || err) }, { status: 500 });
  }
}
