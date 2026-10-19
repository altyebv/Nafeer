import { after } from 'next/server';
import { requireLeadOfOwnSubject, ok, err } from '@/lib/api/guard';
import { ApplicantError, decide, listApplicants, undoDecision } from '@/lib/applicants';
import { AuditError, recordAudit, validateAudit } from '@/lib/audit';

// ─── /api/lead/applicants (docs/team-leads.md L3) ─────────────────────────────
//   GET  ?subjectId=  → { mine, alsoInterested, undoMinutes } (lib/applicants.js);
//                      subjectId only for the owner
//   POST { action: 'decide', applicantId, decision: 'approve'|'reject', reason? }
//        { action: 'undo',   applicantId }
//
// Needs canDecideApplicants. A reject needs a reason. A decision takes effect
// after the undo window; until then it can be taken back.

const OBJECT_ID = /^[a-f\d]{24}$/i;

export async function GET(request) {
  try {
    const subjectParam = new URL(request.url).searchParams.get('subjectId');
    const { subjectId } = await requireLeadOfOwnSubject('canDecideApplicants', subjectParam);
    return ok(await listApplicants(subjectId));
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/lead/applicants]', e);
    return err('خطأ في الخادم', 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user, subjectId } = await requireLeadOfOwnSubject('canDecideApplicants', body.subjectId);
    if (typeof body.applicantId !== 'string' || !OBJECT_ID.test(body.applicantId)) return err('معرّف الطلب غير صالح');

    const actor = {
      id:   user.id,
      name: user.role === 'admin' ? 'المالك' : (user.name || 'قائد الفريق'),
      kind: user.role === 'admin' ? 'admin' : 'lead',
    };

    if (body.action === 'decide') {
      const auditAction = body.decision === 'reject' ? 'applicant.reject' : 'applicant.approve';
      if (!['approve', 'reject'].includes(body.decision)) return err('قرار غير معروف');
      const reason = validateAudit({ action: auditAction, reason: body.reason });

      const { applicant, pendingDecision } = await decide(body.applicantId, {
        action: body.decision, reason, subjectId, by: actor,
      });
      after(() => recordAudit(actor, {
        action: auditAction, subjectId, reason,
        target: { kind: 'applicant', id: applicant.id, label: applicant.name },
        meta: { decideAt: pendingDecision.decideAt },
      }));
      return ok({ applicantId: applicant.id, pendingDecision: {
        action: pendingDecision.action, reason, byName: actor.name, decideAt: pendingDecision.decideAt,
      } });
    }

    if (body.action === 'undo') {
      const { applicant, undone } = await undoDecision(body.applicantId, { subjectId });
      after(() => recordAudit(actor, {
        action: 'applicant.undo', subjectId,
        target: { kind: 'applicant', id: applicant.id, label: applicant.name },
        meta: { undid: undone?.action || null, by: undone?.byName || null },
      }));
      return ok({ applicantId: applicant.id, pendingDecision: null });
    }

    return err('إجراء غير معروف');
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof AuditError) return err(e.message);
    if (e instanceof ApplicantError) return err(e.message, e.status);
    console.error('[POST /api/lead/applicants]', e);
    return err('خطأ في الخادم', 500);
  }
}
