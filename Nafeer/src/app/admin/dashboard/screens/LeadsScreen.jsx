'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Dialog, EmptyState, Field, PageHeader, Select, Textarea } from '@/components/ui';
import { formatDate, formatRelative } from '@/lib/format';
import { ReleasesPanel, AppealsPanel } from './LeadsOversight';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';
import { ScreenBody } from './AdminFrame';

// ─── Team leads ───────────────────────────────────────────────────────────────
// The owner appoints a lead per subject — one by default, a co-lead when the
// subject needs a second reviewer — and decides what each may do
// (docs/team-leads.md). Leads come from /api/admin/leads; candidates are the
// approved members of each subject, from the contributor list the dashboard
// already holds, so the screen adds one request.
//
// A permission change saves on its own, at once. Removing a lead asks why;
// their credits and history stay.

const PERMISSIONS = [
  { id: 'canReview',           label: 'المراجعة',          hint: 'اعتماد دروس المادة وإعادتها بملاحظات' },
  { id: 'canManageTeam',       label: 'إدارة الفريق',      hint: 'الإسناد والإيقاف والإعلانات ودليل المادة' },
  { id: 'canDecideApplicants', label: 'قرار المتقدمين',    hint: 'قبول ورفض، بعد مهلة تراجع 30 دقيقة' },
  { id: 'canEditInterview',    label: 'أسئلة المقابلة',    hint: 'أسئلة المادة لكل دور' },
  { id: 'canIntervene',        label: 'التدخل في الدروس',  hint: 'تعديل درس عضو 24 ساعة بسبب مكتوب، أو تولّيه' },
  { id: 'canPublish',          label: 'النشر',             hint: 'طلب إصدار يُحجز 3 ساعات قبل نشره' },
];
const MIN_REASON = 10;

async function call(method, body) {
  const res = await fetch('/api/admin/leads', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (res.status === 401) { window.location.href = '/admin/login'; return null; }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || 'تعذّر الاتصال بالخادم');
  return json;
}

export function LeadsScreen({ allContributors = [], onChange }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    try {
      const json = await call('GET');
      if (json) { setData(json); setError(null); }
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => { load(); onChange?.(); }, [load, onChange]);

  // Per subject: its leads, and the approved members who could become one.
  const subjects = useMemo(() => {
    if (!data) return [];
    const leadIds = new Set(data.leads.map((l) => String(l._id)));
    return SUBJECTS_CATALOG.map((s) => ({
      ...s,
      leads: data.leads.filter((l) => l.subject === s.id),
      candidates: allContributors
        .filter((c) => c.status === 'approved' && c.subject === s.id && !leadIds.has(String(c._id)))
        .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
    }));
  }, [data, allContributors]);

  const shown = subjects.filter((s) => s.leads.length || s.candidates.length);
  const empty = subjects.length - shown.length;

  return (
    <ScreenBody>
      <PageHeader
        title="قادة الفرق"
        description="قائد لكل مادة يراجع دروسها ويدير فريقها، ومعه قائد ثانٍ عند الحاجة. الصلاحيات الحساسة تبدأ مغلقة، وتفتحها حين تثق."
      />

      {error && !data && <EmptyState title="تعذّر التحميل" description={error} action={<Button onClick={load}>أعد المحاولة</Button>} />}
      {!data && !error && <p className="t-body text-fg-subtle">جارٍ التحميل…</p>}

      {data && (
        <div className="flex flex-col gap-5">
          <ReleasesPanel />
          <AppealsPanel />
          {shown.length === 0 && (
            <EmptyState title="لا أعضاء معتمدون بعد" description="يُعيَّن القائد من أعضاء المادة المعتمدين. حين يُعتمد أعضاء تظهر موادهم هنا." />
          )}
          {shown.map((s) => (
            <SubjectLeads key={s.id} subject={s} max={data.maxPerSubject}
              onChanged={refresh} onRemove={(lead) => setRemoving(lead)} />
          ))}
          {empty > 0 && shown.length > 0 && (
            <p className="t-caption text-fg-subtle">
              {empty === 1 ? 'مادة واحدة' : `${empty} مواد`} بلا أعضاء معتمدين بعد، فلا يُعيَّن لها قائد.
            </p>
          )}
        </div>
      )}

      {removing && (
        <RemoveDialog lead={removing} onClose={() => setRemoving(null)}
          onDone={() => { setRemoving(null); refresh(); }} />
      )}
    </ScreenBody>
  );
}

function SubjectLeads({ subject, max, onChanged, onRemove }) {
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const full = subject.leads.length >= max;

  const appoint = async () => {
    setBusy(true); setError(null);
    try { await call('POST', { contributorId: pick }); setPick(''); onChanged(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Card
      title={subject.nameAr}
      actions={<Badge tone={subject.leads.length ? 'accent' : 'neutral'}>{subject.leads.length}/{max} قادة</Badge>}
    >
      <div className="flex flex-col gap-4">
        {subject.leads.length === 0 && <p className="t-label text-fg-subtle">لا قائد لهذه المادة — تراجع أنت دروسها.</p>}
        {subject.leads.map((l) => <LeadRow key={l._id} lead={l} onRemove={() => onRemove(l)} />)}

        {!full && (
          subject.candidates.length ? (
            <div className="flex items-end gap-2 flex-wrap pt-1">
              <Field label={subject.leads.length ? 'عيّن قائداً ثانياً' : 'عيّن قائداً'} className="flex-1 min-w-[14rem]" error={error}>
                <Select value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">اختر عضواً من المادة…</option>
                  {subject.candidates.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}{c.username ? ` (@${c.username})` : ''}</option>
                  ))}
                </Select>
              </Field>
              <Button variant="primary" onClick={appoint} disabled={!pick} loading={busy}>عيّن</Button>
            </div>
          ) : <p className="t-caption text-fg-subtle">لا أعضاء آخرون معتمدون في المادة.</p>
        )}
      </div>
    </Card>
  );
}

function LeadRow({ lead, onRemove }) {
  const [perms, setPerms] = useState(lead.permissions || {});
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);

  const toggle = async (id) => {
    const next = !perms[id];
    setPerms((p) => ({ ...p, [id]: next }));
    setSaving(id); setError(null);
    try { await call('PATCH', { contributorId: String(lead._id), [id]: next }); }
    catch (e) { setPerms((p) => ({ ...p, [id]: !next })); setError(e.message); }
    finally { setSaving(null); }
  };

  return (
    <div className="flex flex-col gap-3 p-3 rounded-control border border-line bg-sunken">
      <div className="flex items-center gap-3 flex-wrap">
        {lead.avatarUrl
          ? <img src={lead.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
          : <span aria-hidden className="w-9 h-9 rounded-full bg-hover grid place-items-center t-label text-fg-muted">{lead.name?.[0]}</span>}
        <div className="flex flex-col flex-1 min-w-0">
          <strong className="t-ui text-fg-strong">{lead.name}</strong>
          <span className="t-caption text-fg-subtle">
            {lead.username ? `@${lead.username} · ` : ''}قائد منذ {lead.since ? formatDate(lead.since, 'medium') : '—'}
            {' · '}{lead.lastActiveAt ? `آخر نشاط ${formatRelative(lead.lastActiveAt)}` : 'لا نشاط مسجّل'}
            {lead.awayUntil && new Date(lead.awayUntil) > new Date() ? ` · غائب حتى ${formatDate(lead.awayUntil, 'short')}` : ''}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={onRemove}>إزالة…</Button>
      </div>

      <LeadStats stats={lead.stats} />

      <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <legend className="sr-only">صلاحيات {lead.name}</legend>
        {PERMISSIONS.map((p) => (
          <label key={p.id} className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-1 accent-accent" checked={!!perms[p.id]}
              disabled={saving === p.id} onChange={() => toggle(p.id)} />
            <span className="flex flex-col">
              <span className="t-label text-fg">{p.label}</span>
              <span className="t-caption text-fg-subtle">{p.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {error && <p role="alert" className="t-label text-danger">{error}</p>}
    </div>
  );
}

// What the lead did in the last 30 days, from the audit log.
const STAT_ITEMS = [
  ['lesson.approve', 'اعتماد'], ['lesson.return', 'إعادة'], ['lesson.intervene', 'تدخّل'],
  ['lesson.takeover', 'تولٍّ'], ['member.pause', 'إيقاف'], ['applicant.approve', 'قبول متقدم'],
  ['applicant.reject', 'رفض متقدم'], ['release.request', 'طلب نشر'],
];

function LeadStats({ stats }) {
  const counts = stats?.counts || {};
  const shown = STAT_ITEMS.filter(([k]) => counts[k]);
  return (
    <div className="flex flex-wrap items-center gap-1.5 t-caption text-fg-muted">
      <span className="text-fg-subtle">آخر 30 يوماً:</span>
      {shown.length === 0 && <span>لا إجراءات</span>}
      {shown.map(([k, label]) => <Badge key={k} size="sm">{label} {counts[k]}</Badge>)}
      {stats?.avgWaitHours != null && <Badge size="sm" tone="info">متوسط الانتظار {stats.avgWaitHours} س</Badge>}
    </div>
  );
}

function RemoveDialog({ lead, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const ok = reason.trim().length >= MIN_REASON;

  const submit = async () => {
    setBusy(true); setError(null);
    try { await call('DELETE', { contributorId: String(lead._id), reason: reason.trim() }); onDone(); }
    catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Dialog open onClose={onClose} title={`إزالة ${lead.name} من قيادة الفريق؟`}
      description="يعود عضواً عادياً في المادة من طلبه التالي. تبقى مساهماته ومراجعاته وسجلّ قراراته."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="primary" onClick={submit} loading={busy} disabled={!ok}>أزِل</Button>
      </>}>
      <Field label="السبب" required hint={`${MIN_REASON} أحرف على الأقل. يُحفظ في سجل القرارات.`} error={error}>
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </Field>
    </Dialog>
  );
}
