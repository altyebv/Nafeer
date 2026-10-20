'use client';
import { useCallback, useEffect, useState } from 'react';
import EditorPage from '@/components/editor/layout/EditorPage';
import { Badge, Button, Card, ConfirmButton, EmptyState, Field, PageHeader, Stat, Textarea } from '@/components/ui';
import { reviewCall } from '@/components/review/LessonReview';
import { formatDate, formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';

// ─── The lead's release page (docs/team-leads.md L5) ──────────────────────────
// What publishing now would change in the app — a dry run of the real
// pipeline — and the request. A release is held for a few hours, during which
// the owner may cancel it, then goes live by itself. One per subject per day.

const TYPE_AR = {
  SUBJECT: 'المادة', TAG: 'وسوم', CONCEPT: 'مفاهيم', UNIT: 'وحدات', LESSON: 'دروس',
  SECTION: 'أقسام', BLOCK: 'عناصر', QUESTION: 'أسئلة', EXAM: 'امتحانات', FEED_ITEM: 'بطاقات',
};
const STATUS = {
  held:       { label: 'محجوز',        tone: 'warn' },
  publishing: { label: 'يُنشر الآن',   tone: 'info' },
  published:  { label: 'نُشر',         tone: 'success' },
  noop:       { label: 'لا جديد',      tone: 'neutral' },
  failed:     { label: 'فشل',          tone: 'danger' },
  cancelled:  { label: 'أُلغي',        tone: 'neutral' },
};

export default function LeadReleasePage({ subjectId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
  const load = useCallback(async () => {
    try {
      const json = await reviewCall(`/api/lead/releases${qs}`, undefined, '/signin');
      if (json) { setData(json.data); setError(null); }
    } catch (e) { setError(e.message); }
  }, [qs]);
  useEffect(() => { load(); }, [load]);

  const post = async (body) => {
    setBusy(true); setActionError(null);
    try { await reviewCall('/api/lead/releases', { method: 'POST', body: { ...body, subjectId } }, '/signin'); setNote(''); await load(); }
    catch (e) { setActionError(e.message); }
    finally { setBusy(false); }
  };

  if (error && !data) {
    return <EditorPage width="content" className="font-ui"><EmptyState title="تعذّر فتح صفحة النشر" description={error} action={<Button onClick={load}>أعد المحاولة</Button>} /></EditorPage>;
  }
  if (!data) return <EditorPage width="content" className="font-ui"><p className="t-body text-fg-subtle">جارٍ التحميل…</p></EditorPage>;

  const p = data.preview;
  const changes = p ? Object.entries(p.changed).concat(Object.entries(p.deleted).map(([t, n]) => [`${t}:deleted`, n])) : [];
  const canRequest = p && !p.nothingToPublish && !data.held && !data.cooldownUntil;

  return (
    <EditorPage width="content" className="flex flex-col gap-5 font-ui">
      <PageHeader
        title="النشر"
        description={`${SUBJECTS_BY_ID[data.subjectId]?.nameAr || data.subjectId} · يُحجز الإصدار ${data.holdHours} ساعات قبل نشره، ويستطيع المالك إلغاءه خلالها.`}
      />

      {data.held && (
        <Card tone="accent" title="إصدار محجوز">
          <div className="flex flex-col gap-3">
            <p className="t-label text-fg">
              طلبه {data.held.requestedByName} {formatRelative(data.held.createdAt)}.
              {data.held.status === 'held' ? ` يُنشر ${formatDate(data.held.goLiveAt, 'shortDateTime')} ما لم يُلغَ.` : ' يُنشر الآن.'}
            </p>
            {data.held.note && <p className="t-caption text-fg-muted">ملاحظتك: {data.held.note}</p>}
            {data.held.status === 'held' && (
              <ConfirmButton variant="secondary" size="sm" tone="danger" confirmLabel="ألغِ" align="start" className="self-start"
                title="إلغاء الإصدار؟" description="لن يُنشر شيء. يمكنك الطلب من جديد بعد انقضاء المهلة اليومية."
                onConfirm={() => post({ action: 'cancel', id: data.held._id })}>
                إلغاء الإصدار
              </ConfirmButton>
            )}
          </div>
        </Card>
      )}

      <Card title="ما الذي سيتغيّر في التطبيق">
        {data.previewError && <p className="t-label text-warn">{data.previewError}</p>}
        {p && p.nothingToPublish && <p className="t-label text-fg-subtle">لا جديد منذ آخر نشر{p.lastPublishedAt ? ` (${formatRelative(p.lastPublishedAt)})` : ''}.</p>}
        {p && !p.nothingToPublish && (
          <div className="flex flex-col gap-4">
            <p className="t-caption text-fg-subtle">
              {p.firstPublish ? 'أول نشر لهذه المادة.' : `النسخة الحالية في التطبيق: ${p.fromVersion || '—'}، نُشرت ${formatRelative(p.lastPublishedAt)}.`}
              {' '}يشمل النشر الدروس المعتمدة فقط ({p.stats.lessons}).
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {changes.map(([k, n]) => {
                const [type, del] = k.split(':');
                return <Stat key={k} value={n} label={`${TYPE_AR[type] || type}${del ? ' · حذف' : ''}`} />;
              })}
            </div>
            {p.lessons?.changed?.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="t-caption font-semibold text-fg-subtle">دروس جديدة أو معدّلة</span>
                <ul className="flex flex-wrap gap-1.5">{p.lessons.changed.map((l) => <li key={l.id}><Badge size="sm">{l.title}</Badge></li>)}</ul>
              </div>
            )}
            {p.lessons?.removed?.length > 0 && (
              <p className="t-caption text-warn">يُحذف من التطبيق {p.lessons.removed.length} درس لم يعد معتمداً.</p>
            )}
          </div>
        )}
      </Card>

      {!data.held && (
        <Card title="اطلب النشر">
          <div className="flex flex-col gap-3">
            {data.cooldownUntil && (
              <p className="t-label text-fg-subtle">إصدار واحد كل {data.cooldownHours} ساعة — يمكنك الطلب بعد {formatDate(data.cooldownUntil, 'shortDateTime')}.</p>
            )}
            <Field label="ملاحظة للمالك (اختيارية)" hint="ما الذي يحمله هذا الإصدار؟ تصله مع طلبك.">
              <Textarea rows={2} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
            </Field>
            {actionError && <p role="alert" className="t-label text-danger">{actionError}</p>}
            <ConfirmButton variant="primary" size="md" tone="accent" confirmLabel="اطلب" align="start" className="self-start" disabled={!canRequest || busy}
              title="طلب نشر المادة؟" description={`يُحجز ${data.holdHours} ساعات، ويُبلَّغ المالك فوراً. بعدها يصل إلى الطلاب في التطبيق.`}
              onConfirm={() => post({ action: 'request', note })}>
              اطلب النشر
            </ConfirmButton>
          </div>
        </Card>
      )}

      {data.recent.length > 0 && (
        <Card padding="none" className="overflow-hidden" title={<span className="block px-4 pt-4">الإصدارات الأخيرة</span>}>
          <ul>
            {data.recent.map((r) => (
              <li key={r._id} className="flex items-center gap-3 flex-wrap px-4 py-3 border-t border-line">
                <Badge size="sm" tone={STATUS[r.status]?.tone}>{STATUS[r.status]?.label || r.status}</Badge>
                <span className="t-label text-fg flex-1 min-w-0">
                  {r.requestedByName} · {formatDate(r.createdAt, 'shortDateTime')}
                  {r.contentVersion ? ` · ${r.contentVersion}` : ''}
                </span>
                {r.status === 'cancelled' && r.cancelledByName && <span className="t-caption text-fg-subtle">ألغاه {r.cancelledByName}</span>}
                {r.status === 'failed' && <span className="t-caption text-danger">{r.error}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </EditorPage>
  );
}
