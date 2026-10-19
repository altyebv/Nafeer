import { after } from 'next/server';
import { requireLeadOfContent, ok, err } from '@/lib/api/guard';
import { Lesson } from '@/lib/models/Lesson';
import { AuditError, recordAudit, validateAudit } from '@/lib/audit';
import { InterventionError, closeIntervention, startIntervention, takeOver } from '@/lib/intervention';
import { INTERVENTION_CATEGORIES } from '@/lib/lessonAccess';

// ─── POST /api/lead/lessons (docs/team-leads.md L4) ───────────────────────────
//   { action: 'intervene', contentId, category, reason } → edit a member's lesson for 24 h
//   { action: 'end',       contentId }                   → close your intervention
//   { action: 'takeover',  contentId, reason }           → the lesson becomes yours
//
// Needs canIntervene on the lesson's subject. A reason is required to
// intervene and to take over; both go to the audit log and to the owner.

const label = (lesson) => lesson?.title || '';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user, doc } = await requireLeadOfContent(Lesson, body.contentId, 'canIntervene');
    const isAdmin = user.role === 'admin';
    const lead = { id: user.id, name: isAdmin ? 'المالك' : (user.name || 'قائد الفريق') };
    const actor = { ...lead, kind: isAdmin ? 'admin' : 'lead' };

    if (body.action === 'intervene') {
      if (isAdmin) return err('المالك يعدّل أي درس دون تدخّل');
      const reason = validateAudit({ action: 'lesson.intervene', reason: body.reason });
      const { lesson, intervention } = await startIntervention(doc.contentId, { category: body.category, reason, lead });
      after(() => recordAudit(actor, {
        action: 'lesson.intervene', subjectId: doc.subjectId, reason,
        target: { kind: 'lesson', id: doc.contentId, label: label(lesson) },
        meta: { category: body.category, categoryLabel: INTERVENTION_CATEGORIES[body.category], until: intervention.until },
      }));
      return ok({ intervention });
    }

    if (body.action === 'end') {
      const closed = await closeIntervention(doc.contentId, { byId: isAdmin ? null : user.id });
      if (!closed) return err('لا تدخّل مفتوح لك في هذا الدرس', 409);
      return ok({ versionsMade: closed.versionsMade });
    }

    if (body.action === 'takeover') {
      if (isAdmin) return err('المالك يُسند الدرس من صفحة الفريق');
      const reason = validateAudit({ action: 'lesson.takeover', reason: body.reason });
      const { lesson, from } = await takeOver(doc.contentId, { reason, lead });
      after(() => recordAudit(actor, {
        action: 'lesson.takeover', subjectId: doc.subjectId, reason,
        target: { kind: 'lesson', id: doc.contentId, label: label(lesson) },
        meta: { from, to: String(user.id) },
      }));
      return ok({ ownerId: String(user.id) });
    }

    return err('إجراء غير معروف');
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof AuditError) return err(e.message);
    if (e instanceof InterventionError) return err(e.message, e.status);
    console.error('[POST /api/lead/lessons]', e);
    return err('خطأ في الخادم', 500);
  }
}
