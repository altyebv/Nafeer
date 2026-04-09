import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
import { SiteSettings } from '@/lib/models/SiteSettings';

// POST /api/analytics/visit — fire-and-forget visit counter
export async function POST() {
  try {
    await connectDB();
    await SiteSettings.findOneAndUpdate(
      { key: 'global' },
      { $inc: { visitCount: 1 } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch {
    // Silent fail — never break the page for analytics
    return NextResponse.json({ ok: false });
  }
}
