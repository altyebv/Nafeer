import { NextResponse, after } from 'next/server';
import { connectDB }        from '@/lib/db';
import { verifyAdminToken } from '@/lib/adminAuth';
import { Appeal }           from '@/lib/models/Appeal';
import { AppealError, resolveAppeal } from '@/lib/appeals';
import { recordAudit }      from '@/lib/audit';

// ─── /api/admin/appeals (docs/team-leads.md L5) ───────────────────────────────
//   GET                                                  → open first, then the last resolved
//   POST { id, outcome: 'upheld'|'dismissed', resolution? } → decide; the member is told

const fail = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return fail('Unauthorized', 401);
  await connectDB();
  const [open, resolved] = await Promise.all([
    Appeal.find({ status: 'open' }).sort({ createdAt: 1 }).limit(50).lean(),
    Appeal.find({ status: { $ne: 'open' } }).sort({ resolvedAt: -1 }).limit(10).lean(),
  ]);
  return NextResponse.json({ ok: true, open, resolved });
}

export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return fail('Unauthorized', 401);
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== 'string' || !/^[a-f\d]{24}$/i.test(body.id)) return fail('المعرّف غير صالح');
  const by = { id: admin.id || 'admin', name: admin.displayName || admin.username || 'المالك', kind: 'admin' };
  try {
    const appeal = await resolveAppeal(body.id, { outcome: body.outcome, resolution: body.resolution, by });
    after(() => recordAudit(by, {
      action: 'appeal.resolve', subjectId: appeal.subjectId,
      target: { kind: appeal.kind, id: appeal.targetId, label: appeal.targetLabel },
      meta: { outcome: appeal.status, by: appeal.byName },
    }));
    return NextResponse.json({ ok: true, appeal });
  } catch (e) {
    if (e instanceof AppealError) return fail(e.message, e.status);
    console.error('[POST /api/admin/appeals]', e);
    return fail('خطأ في الخادم', 500);
  }
}
