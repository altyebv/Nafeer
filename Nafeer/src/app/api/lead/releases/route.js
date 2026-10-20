import { after } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireLeadOfOwnSubject, ok, err } from '@/lib/api/guard';
import { Release } from '@/lib/models/Release';
import {
  RELEASE_COOLDOWN_HOURS, RELEASE_HOLD_HOURS, ReleaseError,
  applyDueReleases, cancelRelease, cooldownUntil, previewRelease, requestRelease,
} from '@/lib/releases';
import { recordAudit } from '@/lib/audit';

// ─── /api/lead/releases (docs/team-leads.md L5) ───────────────────────────────
//   GET  ?subjectId=  → what would be published now, the held release if
//                      any, recent releases, and when the next may be asked
//   POST { action: 'request', note? }  → hold a release; the owner is emailed
//        { action: 'cancel', id }      → take back a held one
//
// Needs canPublish. Opening the page also lets a release whose hold has
// passed go live (after the response).

export async function GET(request) {
  try {
    const subjectParam = new URL(request.url).searchParams.get('subjectId');
    const { subjectId } = await requireLeadOfOwnSubject('canPublish', subjectParam);
    await connectDB();
    after(() => applyDueReleases().catch((e) => console.warn('[release sweep]', e.message)));

    const [recent, until] = await Promise.all([
      Release.find({ subjectId }).sort({ createdAt: -1 }).limit(10).lean(),
      cooldownUntil(subjectId),
    ]);
    let preview = null;
    let previewError = null;
    try { preview = await previewRelease(subjectId); } catch (e) { previewError = e.message; }

    return ok({
      subjectId,
      holdHours: RELEASE_HOLD_HOURS,
      cooldownHours: RELEASE_COOLDOWN_HOURS,
      cooldownUntil: until && until > new Date() ? until : null,
      held: recent.find((r) => r.status === 'held' || r.status === 'publishing') || null,
      recent,
      preview,
      previewError,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/lead/releases]', e);
    return err('خطأ في الخادم', 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user, subjectId } = await requireLeadOfOwnSubject('canPublish', body.subjectId);
    const isAdmin = user.role === 'admin';
    const actor = { id: user.id, name: isAdmin ? 'المالك' : (user.name || 'قائد الفريق'), kind: isAdmin ? 'admin' : 'lead' };

    if (body.action === 'request') {
      if (isAdmin) return err('المالك ينشر مباشرة من قسم النشر');
      const release = await requestRelease(subjectId, { lead: actor, note: body.note });
      after(() => recordAudit(actor, {
        action: 'release.request', subjectId,
        target: { kind: 'release', id: String(release._id), label: subjectId },
        meta: { goLiveAt: release.goLiveAt, changed: release.preview?.changed },
      }));
      return ok(release);
    }

    if (body.action === 'cancel') {
      if (typeof body.id !== 'string' || !/^[a-f\d]{24}$/i.test(body.id)) return err('المعرّف غير صالح');
      const release = await cancelRelease(body.id, { by: actor, reason: body.reason, subjectId });
      after(() => recordAudit(actor, {
        action: 'release.cancel', subjectId, target: { kind: 'release', id: body.id, label: subjectId },
      }));
      return ok(release);
    }

    return err('إجراء غير معروف');
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof ReleaseError) return err(e.message, e.status);
    console.error('[POST /api/lead/releases]', e);
    return err('خطأ في الخادم', 500);
  }
}
