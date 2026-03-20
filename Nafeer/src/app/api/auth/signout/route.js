import { NextResponse } from 'next/server';
import { getCurrentUser, clearAuthCookie } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

export async function POST() {
  try {
    // Capture session duration before clearing cookie
    const user = await getCurrentUser();

    if (user?.id && user?.lastSignedInAt) {
      const sessionMs = Date.now() - new Date(user.lastSignedInAt).getTime();

      if (sessionMs > 0 && sessionMs < 24 * 60 * 60 * 1000) { // sanity cap: 24 h
        await connectDB();
        Contributor.findByIdAndUpdate(user.id, {
          $inc: { 'stats.totalTimeMs': sessionMs },
          $set: { 'stats.lastActiveAt': new Date() },
        }).catch(() => {});
      }
    }
  } catch {
    // Never block signout due to stat errors
  }

  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
