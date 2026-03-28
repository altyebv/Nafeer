import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
import { SiteSettings } from '@/lib/models/SiteSettings';

// ─── GET /api/site-settings ───────────────────────────────────────────────────
// Public — returns non-sensitive settings for landing page use.

export async function GET() {
  try {
    await connectDB();
    const settings = await SiteSettings.getGlobal();
    return NextResponse.json({
      ok: true,
      showContributorsOnLanding: settings.showContributorsOnLanding,
    });
  } catch {
    // Safe fallback — default to showing the section
    return NextResponse.json({ ok: true, showContributorsOnLanding: true });
  }
}