import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
import { rateLimit }    from '@/lib/rateLimit';
import { SiteSettings } from '@/lib/models/SiteSettings';

// GET /api/support — returns current support count
export async function GET() {
  try {
    await connectDB();
    const settings = await SiteSettings.getGlobal();
    return NextResponse.json({ ok: true, count: settings.supportCount ?? 0 });
  } catch {
    return NextResponse.json({ ok: false, count: 0 });
  }
}

// POST /api/support — increments support count, returns new total
export async function POST(request) {
  const limited = await rateLimit(request, 'support', { ok: false, count: null });
  if (limited) return limited;

  try {
    await connectDB();
    const updated = await SiteSettings.findOneAndUpdate(
      { key: 'global' },
      { $inc: { supportCount: 1 } },
      { upsert: true, new: true }
    );
    return NextResponse.json({ ok: true, count: updated.supportCount });
  } catch {
    return NextResponse.json({ ok: false, count: 0 });
  }
}
