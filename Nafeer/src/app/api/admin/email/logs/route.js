import { NextResponse }     from 'next/server';
import mongoose             from 'mongoose';
import { verifyAdminToken } from '@/lib/adminAuth';
import { connectDB }        from '@/lib/db';
import { EmailLog }         from '@/lib/models/EmailLog';
import { EmailArchive }     from '@/lib/models/EmailArchive';

const DAY_MS = 24 * 60 * 60 * 1000;

// A row that never left us, bounced, or was reported as spam.
function isProblem(log) {
  return log.status === 'failed' || ['bounced', 'complained', 'failed'].includes(log.delivery);
}

// ─── GET /api/admin/email/logs ────────────────────────────────────────────────
// Returns the most recent 50 email log entries, newest first.
// Query params:
//   ?limit=N    (default 50, max 200)
//   ?status=sent|failed
//   ?to=email   (exact address, case-insensitive — per-contributor history)
//
// Without ?to, the response also carries `archive`: per-month counts of rows
// that were deleted from the log, newest month first.

export async function GET(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
  const limit    = Math.min(Math.max(rawLimit, 1), 200);
  const status   = searchParams.get('status');
  const to       = searchParams.get('to')?.trim();

  await connectDB();

  const filter = status ? { status } : {};
  if (to) {
    filter.to = new RegExp(`^${to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }

  const logs   = await EmailLog.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  if (to) return NextResponse.json({ ok: true, logs });

  // Collapse the per-template archive rows into one line per month.
  const months = new Map();
  for (const row of await EmailArchive.find().lean()) {
    const m = months.get(row.month) || { month: row.month, total: 0, delivered: 0, problems: 0 };
    m.total     += row.total;
    m.delivered += row.delivered;
    m.problems  += row.problems;
    months.set(row.month, m);
  }
  const archive = [...months.values()].sort((a, b) => b.month.localeCompare(a.month));

  return NextResponse.json({ ok: true, logs, archive });
}

// ─── DELETE /api/admin/email/logs ─────────────────────────────────────────────
// Removes log rows and folds them into the monthly archive first, so the
// counts survive while recipients and subjects do not.
// Body — exactly one of:
//   { ids: [...] }            specific rows
//   { olderThanDays: N }      everything older than N days (N ≥ 1)
//   { all: true }             the whole log

export async function DELETE(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { ids, olderThanDays, all } = body;

  let filter;
  if (Array.isArray(ids) && ids.length > 0) {
    filter = { _id: { $in: ids.filter((id) => mongoose.isValidObjectId(id)) } };
  } else if (Number.isFinite(olderThanDays) && olderThanDays >= 1) {
    filter = { timestamp: { $lt: new Date(Date.now() - olderThanDays * DAY_MS) } };
  } else if (all === true) {
    filter = {};
  } else {
    return NextResponse.json(
      { ok: false, error: 'Provide ids, olderThanDays (≥ 1) or all: true.' },
      { status: 400 }
    );
  }

  await connectDB();

  const doomed = await EmailLog.find(filter).select('timestamp template status delivery').lean();
  if (doomed.length === 0) return NextResponse.json({ ok: true, deleted: 0 });

  // Archive before deleting: if the delete then fails, nothing is lost.
  const buckets = new Map();
  for (const log of doomed) {
    const month = new Date(log.timestamp).toISOString().slice(0, 7);
    const key   = `${month}|${log.template}`;
    const b     = buckets.get(key) || { month, template: log.template, total: 0, delivered: 0, problems: 0 };
    b.total += 1;
    if (isProblem(log))                    b.problems  += 1;
    else if (log.delivery === 'delivered') b.delivered += 1;
    buckets.set(key, b);
  }

  await EmailArchive.bulkWrite(
    [...buckets.values()].map(({ month, template, ...counts }) => ({
      updateOne: { filter: { month, template }, update: { $inc: counts }, upsert: true },
    }))
  );

  // Delete exactly the rows that were counted, not whatever matches now.
  const result = await EmailLog.deleteMany({ _id: { $in: doomed.map((log) => log._id) } });

  return NextResponse.json({ ok: true, deleted: result.deletedCount });
}
