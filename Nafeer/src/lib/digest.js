// ─── The owner's daily digest of what leads did (docs/team-leads.md L3) ───────
// Built from the audit log's last 24 hours, grouped by subject. Pure: the cron
// route (app/api/cron/daily) reads the events and sends the result with the
// existing `custom_message` email template.

import { SUBJECTS_BY_ID } from '@/shared/curriculum';
import { arCount, formatDate } from '@/lib/format';

const actions = (n) => arCount(n, { one: 'إجراء واحد', two: 'إجراءان', few: 'إجراءات', many: 'إجراءً' });

const LABEL = {
  'lesson.approve':    'اعتمد',
  'lesson.return':     'أعاد مع ملاحظات',
  'lesson.assign':     'أسند درساً',
  'lesson.intervene':  'تدخّل في درس',
  'lesson.takeover':   'تولّى درساً',
  'member.pause':      'أوقف عضواً',
  'member.unpause':    'رفع إيقاف',
  'applicant.approve': 'قبل متقدماً',
  'applicant.reject':  'رفض متقدماً',
  'applicant.undo':    'تراجع عن قرار في متقدم',
  'interview.edit':    'عدّل أسئلة المقابلة',
  'team.announce':     'نشر إعلاناً',
  'team.unannounce':   'حذف إعلاناً',
  'guide.edit':        'عدّل دليل المادة',
  'lead.away':         'غيّر وضع الغياب',
  'release.publish':   'نشر إصداراً',
};

// The ones worth reading in full, with their reason.
const WITH_DETAIL = new Set([
  'applicant.approve', 'applicant.reject', 'applicant.undo',
  'member.pause', 'lesson.intervene', 'lesson.takeover',
]);

/**
 * @param events AuditEvent documents (lead actions only)
 * @returns { subject, message } for custom_message, or null when nothing happened
 */
export function buildDigest(events, now = new Date()) {
  if (!events?.length) return null;

  const bySubject = new Map();
  for (const e of events) {
    const key = e.subjectId || '—';
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key).push(e);
  }

  const lines = [];
  for (const [subjectId, list] of bySubject) {
    lines.push(`${SUBJECTS_BY_ID[subjectId]?.nameAr || subjectId} — ${actions(list.length)}`);

    // Counts per actor and action, then the decisions worth reading in full.
    const counts = new Map();
    for (const e of list) {
      const k = `${e.actorName || 'قائد'}: ${LABEL[e.action] || e.action}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    for (const [k, n] of counts) lines.push(`• ${k}${n > 1 ? ` ×${n}` : ''}`);

    for (const e of list.filter((x) => WITH_DETAIL.has(x.action))) {
      const who = e.target?.label ? ` «${e.target.label}»` : '';
      lines.push(`   – ${LABEL[e.action]}${who}${e.reason ? ` — ${e.reason}` : ''}`);
    }
  }

  return {
    subject: `ملخص قادة الفرق — ${formatDate(now, 'medium')}`,
    message: [`ما فعله قادة الفرق في آخر 24 ساعة (${actions(events.length)}):`, ...lines].join('\n'),
  };
}
