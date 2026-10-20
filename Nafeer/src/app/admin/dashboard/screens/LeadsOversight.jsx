'use client';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, ConfirmButton, Dialog, Field, Textarea } from '@/components/ui';
import { formatDate, formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';

// ─── The owner's oversight of leads (docs/team-leads.md L5) ───────────────────
// Two panels on the «قادة الفرق» screen, each loading its own list:
//   ReleasesPanel — leads' releases; a held one can be cancelled or sent now.
//                   Once live, the undo is the subject's app switch (publish
//                   section) and fixing forward.
//   AppealsPanel  — members contesting a lead's decision; the owner upholds or
//                   dismisses, and the member is told.
// Each renders nothing when it has nothing to show.

const subjectName = (id) => SUBJECTS_BY_ID[id]?.nameAr || id;

async function call(url, body) {
  const res = await fetch(url, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : undefined);
  if (res.status === 401) { window.location.href = '/admin/login'; return null; }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || 'تعذّر الاتصال بالخادم');
  return json;
}

function useList(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    try { const j = await call(url); if (j) { setData(j); setError(null); } }
    catch (e) { setError(e.message); }
  }, [url]);
  useEffect(() => { load(); }, [load]);
  return { data, error, load };
}

// ─── Releases ─────────────────────────────────────────────────────────────────

const STATUS = {
  held: ['محجوز', 'warn'], publishing: ['يُنشر', 'info'], published: ['نُشر', 'success'],
  noop: ['لا جديد', 'neutral'], failed: ['فشل', 'danger'], cancelled: ['أُلغي', 'neutral'],
};

export function ReleasesPanel() {
  const { data, error, load } = useList('/api/admin/releases');
  const [actionError, setActionError] = useState(null);
  if (error) return <p className="t-label text-danger">{error}</p>;
  if (!data?.releases?.length) return null;

  const act = async (body) => {
    setActionError(null);
    try { await call('/api/admin/releases', body); await load(); }
    catch (e) { setActionError(e.message); }
  };
  const held = data.releases.filter((r) => r.status === 'held');

  return (
    <Card title="إصدارات القادة" actions={held.length ? <Badge tone="warn">{held.length} محجوز</Badge> : null}>
      <ul className="flex flex-col gap-2">
        {data.releases.slice(0, 8).map((r) => (
          <li key={r._id} className="flex items-center gap-3 flex-wrap p-3 rounded-control border border-line">
            <Badge size="sm" tone={STATUS[r.status]?.[1]}>{STATUS[r.status]?.[0] || r.status}</Badge>
            <span className="t-label text-fg flex-1 min-w-0">
              <strong>{subjectName(r.subjectId)}</strong> · {r.requestedByName} · {formatRelative(r.createdAt)}
              {r.status === 'held' && ` · يُنشر ${formatDate(r.goLiveAt, 'shortDateTime')}`}
              {r.contentVersion && ` · ${r.contentVersion}`}
              {r.preview?.lessons?.changed?.length ? ` · ${r.preview.lessons.changed.length} درس جديد/معدّل` : ''}
              {r.note && <span className="block t-caption text-fg-muted">«{r.note}»</span>}
              {r.status === 'failed' && <span className="block t-caption text-danger">{r.error}</span>}
            </span>
            {r.status === 'held' && (
              <span className="flex gap-2">
                <ConfirmButton variant="secondary" size="sm" tone="danger" confirmLabel="ألغِ" align="start"
                  title="إلغاء الإصدار؟" description="لن يصل إلى الطلاب. يُبلَّغ القائد في صفحة النشر."
                  onConfirm={() => act({ action: 'cancel', id: r._id })}>إلغاء</ConfirmButton>
                <ConfirmButton variant="ghost" size="sm" tone="accent" confirmLabel="انشر" align="start"
                  title="نشره الآن؟" description="يتخطّى ما تبقّى من مهلة الحجز ويصل إلى التطبيق فوراً."
                  onConfirm={() => act({ action: 'publishNow', id: r._id })}>انشر الآن</ConfirmButton>
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="t-caption text-fg-subtle mt-3">
        بعد النشر لا رجوع بنسخة سابقة: لإخفاء مادة من التطبيق استعمل مفتاحها في قسم النشر، ثم أصلح المحتوى وأعد النشر.
      </p>
      {actionError && <p role="alert" className="t-label text-danger mt-2">{actionError}</p>}
    </Card>
  );
}

// ─── Appeals ──────────────────────────────────────────────────────────────────

const KIND = { return: 'إعادة درس', intervention: 'تدخّل في درس', pause: 'إيقاف التعديل' };

export function AppealsPanel() {
  const { data, error, load } = useList('/api/admin/appeals');
  const [resolving, setResolving] = useState(null);
  if (error) return <p className="t-label text-danger">{error}</p>;
  if (!data || (!data.open.length && !data.resolved.length)) return null;

  return (
    <Card title="الاعتراضات" actions={data.open.length ? <Badge tone="warn">{data.open.length} مفتوح</Badge> : null}>
      {data.open.length === 0 && <p className="t-label text-fg-subtle">لا اعتراضات مفتوحة.</p>}
      <ul className="flex flex-col gap-2">
        {data.open.map((a) => (
          <li key={a._id} className="flex flex-col gap-2 p-3 rounded-control border border-line">
            <span className="t-caption text-fg-subtle">
              {subjectName(a.subjectId)} · {KIND[a.kind]}{a.againstName ? ` — قرار ${a.againstName}` : ''} · {formatRelative(a.createdAt)}
            </span>
            <span className="t-label text-fg"><strong>{a.byName}</strong> على «{a.targetLabel}»</span>
            <p className="read t-body text-fg whitespace-pre-wrap">{a.text}</p>
            <Button size="sm" variant="secondary" className="self-start" onClick={() => setResolving(a)}>ردّ…</Button>
          </li>
        ))}
      </ul>
      {data.resolved.length > 0 && (
        <details className="mt-3">
          <summary className="t-caption text-fg-subtle cursor-pointer">آخر ما حُسم</summary>
          <ul className="flex flex-col gap-1 mt-2">
            {data.resolved.map((a) => (
              <li key={a._id} className="t-caption text-fg-muted">
                {a.status === 'upheld' ? 'قُبل' : 'رُدّ'} · {a.byName} · {KIND[a.kind]} «{a.targetLabel}»{a.resolution ? ` — ${a.resolution}` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}
      {resolving && <ResolveDialog appeal={resolving} onClose={() => setResolving(null)} onDone={() => { setResolving(null); load(); }} />}
    </Card>
  );
}

function ResolveDialog({ appeal, onClose, onDone }) {
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const decide = async (outcome) => {
    setBusy(outcome); setError(null);
    try { await call('/api/admin/appeals', { id: appeal._id, outcome, resolution: resolution.trim() }); onDone(); }
    catch (e) { setError(e.message); setBusy(null); }
  };

  return (
    <Dialog open onClose={onClose} title={`اعتراض ${appeal.byName}`}
      description={appeal.kind === 'pause'
        ? 'قبول الاعتراض يرفع الإيقاف فوراً. يصل ردّك إلى العضو في لوحته.'
        : 'يصل ردّك إلى العضو في لوحته. إن قبلته فأصلح الأمر بنفسك: عدّل الدرس، أو أسنده، أو راجع صلاحيات القائد.'}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={!!busy}>إلغاء</Button>
        <Button variant="secondary" onClick={() => decide('dismissed')} loading={busy === 'dismissed'} disabled={!!busy}>ردّ الاعتراض</Button>
        <Button variant="primary" onClick={() => decide('upheld')} loading={busy === 'upheld'} disabled={!!busy}>اقبله</Button>
      </>}>
      <Field label="ردّك (يراه العضو)" error={error}>
        <Textarea rows={3} value={resolution} maxLength={1000} onChange={(e) => setResolution(e.target.value)} />
      </Field>
    </Dialog>
  );
}
