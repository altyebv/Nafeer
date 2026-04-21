import { NextResponse }     from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { connectDB }        from '@/lib/db';
import { SiteSettings }     from '@/lib/models/SiteSettings';

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });
}

// ─── GET /api/admin/site-setting ──────────────────────────────────────────────
// Returns full settings including visitsByDay for sparkline display.
export async function GET() {
  if (!(await verifyAdminToken())) return unauthorized();
  await connectDB();
  const settings = await SiteSettings.getGlobal();
  return NextResponse.json({ ok: true, data: settings });
}

// ─── PATCH /api/admin/site-setting ────────────────────────────────────────────
export async function PATCH(request) {
  if (!(await verifyAdminToken())) return unauthorized();

  const body   = await request.json();
  const update = {};

  if (typeof body.showContributorsOnLanding === 'boolean') {
    update.showContributorsOnLanding = body.showContributorsOnLanding;
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ ok: false, error: 'لا يوجد تحديثات' }, { status: 400 });
  }

  await connectDB();
  const settings = await SiteSettings.findOneAndUpdate(
    { key: 'global' },
    { $set: update },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true, data: settings });
}