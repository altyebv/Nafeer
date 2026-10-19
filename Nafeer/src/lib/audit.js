// ─── Audit log for team leads ─────────────────────────────────────────────────
// What leads do, and what the owner does to leads, as one append-only log
// (models/AuditEvent.js, docs/team-leads.md).
//
// Two halves: `validateAudit` checks an entry before the action happens, so a
// missing reason refuses the action itself; `recordAudit` writes it afterwards
// and never throws into the caller — the action already happened, and a failed
// log write must not turn it into an error response.

import { AuditEvent } from '@/lib/models/AuditEvent';

export const AUDIT_ACTIONS = [
  'lesson.approve', 'lesson.return', 'lesson.intervene', 'lesson.takeover', 'lesson.assign',
  'member.pause', 'member.unpause',
  'team.announce', 'team.unannounce', 'guide.edit', 'lead.away',
  'applicant.approve', 'applicant.reject', 'applicant.undo',
  'interview.edit',
  'release.publish', 'release.rollback',
  'lead.appoint', 'lead.update', 'lead.remove',
  'appeal.open', 'appeal.resolve',
];

// Actions that affect someone else carry a written reason.
export const REASON_REQUIRED = new Set([
  'lesson.intervene', 'lesson.takeover', 'member.pause',
  'applicant.reject', 'release.rollback', 'lead.remove',
]);

export const MIN_REASON_LENGTH = 10;
export const MAX_REASON_LENGTH = 500;

export class AuditError extends Error {
  constructor(message, code = 'INVALID') {
    super(message);
    this.name = 'AuditError';
    this.code = code;
  }
}

/**
 * Checks and normalises an entry. Throws AuditError for an unknown action or
 * a missing / too short reason, so callers can run it before acting.
 */
export function validateAudit({ action, reason = '' }) {
  if (!AUDIT_ACTIONS.includes(action)) throw new AuditError(`إجراء غير معروف: ${action}`);

  const text = typeof reason === 'string' ? reason.trim() : '';
  if (REASON_REQUIRED.has(action) && text.length < MIN_REASON_LENGTH) {
    throw new AuditError(`اكتب سبباً واضحاً (${MIN_REASON_LENGTH} أحرف على الأقل)`, 'REASON_REQUIRED');
  }
  if (text.length > MAX_REASON_LENGTH) {
    throw new AuditError(`السبب طويل جداً (الحد ${MAX_REASON_LENGTH} حرف)`);
  }
  return text;
}

/**
 * Writes one entry. `actor` is { id, name, kind: 'lead' | 'admin' }.
 * Returns the created document, or null if the write failed.
 */
export async function recordAudit(actor, { action, subjectId = '', target = {}, reason = '', meta = null }) {
  try {
    const text = validateAudit({ action, reason });
    return await AuditEvent.create({
      actorId:   String(actor?.id ?? ''),
      actorName: actor?.name || '',
      actorKind: actor?.kind === 'admin' ? 'admin' : 'lead',
      action,
      subjectId: subjectId || '',
      target: {
        kind:  target.kind  || '',
        id:    target.id != null ? String(target.id) : '',
        label: (target.label || '').slice(0, 120),
      },
      reason: text,
      meta,
      at: new Date(),
    });
  } catch (e) {
    console.warn('[audit write failed]', action, e.message);
    return null;
  }
}
