import { NextResponse, after } from 'next/server';
import { connectDB }        from '@/lib/db';
import { verifyAdminToken } from '@/lib/adminAuth';
import { Release }          from '@/lib/models/Release';
import { ReleaseError, applyDueReleases, cancelRelease, releaseNow } from '@/lib/releases';
import { recordAudit }      from '@/lib/audit';

// ─── /api/admin/releases (docs/team-leads.md L5) ──────────────────────────────
// The owner's view of leads' releases.
//   GET                                     → the last 30, every subject
//   POST { action: 'cancel', id, reason? }  → stop a held release
//        { action: 'publishNow', id }       → skip the rest of the hold

const fail = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return fail('Unauthorized', 401);
  await connectDB();
  after(() => applyDueReleases().catch((e) => console.warn('[release sweep]', e.message)));
  const releases = await Release.find({}).sort({ createdAt: -1 }).limit(30).lean();
  return NextResponse.json({ ok: true, releases });
}

export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return fail('Unauthorized', 401);
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== 'string' || !/^[a-f\d]{24}$/i.test(body.id)) return fail('المعرّف غير صالح');
  const actor = { id: admin.id || 'admin', name: admin.displayName || admin.username || 'المالك', kind: 'admin' };

  try {
    if (body.action === 'cancel') {
      const r = await cancelRelease(body.id, { by: actor, reason: body.reason });
      after(() => recordAudit(actor, {
        action: 'release.cancel', subjectId: r.subjectId, reason: '',
        target: { kind: 'release', id: body.id, label: r.subjectId }, meta: { reason: body.reason || '' },
      }));
      return NextResponse.json({ ok: true, release: r });
    }
    if (body.action === 'publishNow') {
      const r = await releaseNow(body.id);
      return NextResponse.json({ ok: true, release: r });
    }
    return fail('إجراء غير معروف');
  } catch (e) {
    if (e instanceof ReleaseError) return fail(e.message, e.status);
    console.error('[POST /api/admin/releases]', e);
    return fail('خطأ في الخادم', 500);
  }
}
