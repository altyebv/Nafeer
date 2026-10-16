import { NextResponse }    from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { connectDB }       from '@/lib/db';
import { ContributorActivity } from '@/lib/models/ContributorActivity';
import { bucketActivity, summarizeActivity, dayKey, shiftKey } from '@/lib/activity';
import { countAuthored }   from '@/lib/authoredStats';

const DAY_MS = 86_400_000;
const WINDOW = 112; // 16 weeks, the same window as the contributor's own dashboard

// ─── GET /api/admin/contributors/[id]/activity ────────────────────────────────
// The person page: their activity graph and what they have authored now,
// counted from the content (never the stored counters).
export async function GET(_request, { params }) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;
  const { id } = await params;

  try {
    await connectDB();
    const since = new Date(Date.now() - (WINDOW + 1) * DAY_MS);
    const [docs, authored] = await Promise.all([
      ContributorActivity.find({ contributorId: id, createdAt: { $gte: since } }, 'createdAt type').lean(),
      countAuthored(id),
    ]);

    const today = dayKey(new Date());
    const from = shiftKey(today, -(WINDOW - 1));
    const days = Object.fromEntries(Object.entries(bucketActivity(docs)).filter(([k]) => k >= from));

    return NextResponse.json({
      ok: true,
      data: { days, summary: summarizeActivity(days, today, WINDOW), authored },
    });
  } catch (e) {
    console.error('[GET /api/admin/contributors/[id]/activity]', e);
    return NextResponse.json({ ok: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}
