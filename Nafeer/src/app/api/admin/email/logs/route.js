import { NextResponse }     from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { connectDB }        from '@/lib/db';
import { EmailLog }         from '@/lib/models/EmailLog';

// ─── GET /api/admin/email/logs ────────────────────────────────────────────────
// Returns the most recent 50 email log entries, newest first.
// Query params:
//   ?limit=N    (default 50, max 200)
//   ?status=sent|failed
//   ?to=email   (exact address, case-insensitive — per-contributor history)

export async function GET(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
  const limit    = Math.min(Math.max(rawLimit, 1), 200);
  const status   = searchParams.get('status');

  await connectDB();

  const to       = searchParams.get('to')?.trim();

  const filter = status ? { status } : {};
  if (to) {
    filter.to = new RegExp(`^${to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }
  const logs   = await EmailLog.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ ok: true, logs });
}