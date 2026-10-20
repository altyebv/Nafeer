import { after } from 'next/server';
import { requireContributor, ok, err } from '@/lib/api/guard';
import { AppealError, fileAppeal } from '@/lib/appeals';
import { recordAudit } from '@/lib/audit';

// ─── POST /api/appeals (docs/team-leads.md L5) ────────────────────────────────
// Body: { kind: 'return' | 'intervention' | 'pause', lessonId?, text }
// A member contests a lead's decision about them; the owner is emailed.
// Not a write to content, so a paused member can appeal their pause.
export async function POST(request) {
  try {
    const user = await requireContributor();
    if (user.role === 'admin') return err('للأعضاء فقط');
    const body = await request.json().catch(() => ({}));
    const appeal = await fileAppeal(user, { kind: body.kind, lessonId: body.lessonId, text: body.text });
    after(() => recordAudit({ id: user.id, name: user.name || '', kind: 'member' }, {
      action: 'appeal.open', subjectId: appeal.subjectId,
      target: { kind: appeal.kind, id: appeal.targetId, label: appeal.targetLabel },
      meta: { against: appeal.againstName },
    }));
    return ok({ id: String(appeal._id), status: appeal.status });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof AppealError) return err(e.message, e.status);
    console.error('[POST /api/appeals]', e);
    return err('خطأ في الخادم', 500);
  }
}
