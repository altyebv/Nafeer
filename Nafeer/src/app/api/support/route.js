import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
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
export async function POST() {
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
