import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

// POST /api/auth/heartbeat
// Called periodically from the editor (every ~5 min) to flush accumulated time.
// Handles the tab-close scenario where signout never fires.
//
// Body: { sessionMs: number }  — ms elapsed since last heartbeat or sign-in

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { sessionMs } = await request.json();

    // Validate — must be positive and under 10 minutes (generous buffer for slow tabs)
    if (!sessionMs || sessionMs <= 0 || sessionMs > 10 * 60 * 1000) {
      return NextResponse.json({ ok: true }); // silently ignore invalid values
    }

    await connectDB();
    await Contributor.findByIdAndUpdate(user.id, {
      $inc: { 'stats.totalTimeMs': sessionMs },
      $set: { 'stats.lastActiveAt': new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[heartbeat]', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
