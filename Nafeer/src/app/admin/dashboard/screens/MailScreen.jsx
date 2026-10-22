'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, ChevronDown, CircleAlert, CircleCheck, RefreshCw, Search, Send, Trash2 } from 'lucide-react';
import {
  Badge, Button, Card, ConfirmButton, EmptyState, Field, IconButton, Input, PageHeader, Segmented, Select, Stat, Tabs, TabPanel, cx,
} from '@/components/ui';
import { formatDate, formatNumber } from '@/lib/format';
import { ScreenBody } from './AdminFrame';
import {
  MessageEditor, PreviewPane, TEMPLATE_GROUPS, TEMPLATE_META, deliveryState, isProblem, templateLabel, useTemplatePreview,
} from '../mail/mailKit';

// ─── Mail ─────────────────────────────────────────────────────────────────────
// Three views over the one mail pipeline (lib/email/emailService.js):
//   compose   pick a template, fill its links, adjust its text, see it as sent
//   log       every message, by day — what arrived and what didn't
//   archive   monthly counts of rows cleared from the log; clearing happens here
//
// Contributor broadcasts (board + mail to a whole audience) stay in Comms.

const DAY_MS = 86_400_000;
const LOG_LIMIT = 200;

const TABS_BASE = [
  { id: 'compose', label: 'رسالة جديدة' },
  { id: 'log',     label: 'السجل' },
  { id: 'archive', label: 'الأرشيف' },
];

export function MailScreen() {
  const [tab, setTab]       = useState('compose');
  const [logs, setLogs]     = useState([]);
  const [archive, setArch]  = useState([]);
  const [state, setState]   = useState('loading'); // loading | ok | error

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res  = await fetch(`/api/admin/email/logs?limit=${LOG_LIMIT}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (!json.ok) throw new Error();
      setLogs(json.logs || []); setArch(json.archive || []); setState('ok');
    } catch { setState('error'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Deletes rows (by ids, age or all) after folding them into the archive.
  // Resolves to the number removed; throws on failure.
  const removeLogs = useCallback(async (body) => {
    const res  = await fetch('/api/admin/email/logs', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!json.ok) throw new Error(json.error || 'تعذّر الحذف');
    await load();
    return json.deleted;
  }, [load]);

  const month    = useMemo(() => logs.filter((l) => Date.now() - new Date(l.timestamp) < 30 * DAY_MS), [logs]);
  const problems = logs.filter(isProblem).length;
  const delivered = month.filter((l) => l.delivery === 'delivered').length;
  const archived = archive.reduce((n, m) => n + m.total, 0);

  const tabs = TABS_BASE.map((t) => (t.id === 'log' && problems ? { ...t, count: problems } : t));

  return (
    <div>
      <ScreenBody>
        <PageHeader
          title="البريد"
          description="رسائل فردية من قوالب نفير: اختر القالب، عدّل نصه إن شئت، وتابع ما وصل."
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat value={month.length} label="أُرسلت خلال 30 يوماً" />
            <Stat value={delivered} label="تأكد وصولها"
              hint={month.length ? `${Math.round((delivered / month.length) * 100)}% مما أُرسل` : undefined} />
            <Stat value={problems} label="لم تصل" hintTone={problems ? 'danger' : 'subtle'}
              hint={problems ? 'راجعها في السجل' : 'لا شيء متعثر'} />
            <Stat value={archived} label="في الأرشيف" hint="أعداد فقط، بلا عناوين" />
          </div>
          <Tabs items={tabs} value={tab} onChange={setTab} idBase="mail" label="أقسام البريد" />
        </PageHeader>

        <div className="pt-6">
          {/* Compose stays mounted so a half-written message survives a look at the log. */}
          <div role="tabpanel" id="mail-panel-compose" aria-labelledby="mail-tab-compose" hidden={tab !== 'compose'}>
            <ComposeTab onSent={() => setTimeout(load, 800)} />
          </div>
          <TabPanel idBase="mail" id="log" active={tab === 'log'}>
            <LogTab logs={logs} state={state} onReload={load} onRemove={removeLogs} />
          </TabPanel>
          <TabPanel idBase="mail" id="archive" active={tab === 'archive'}>
            <ArchiveTab archive={archive} logs={logs} onRemove={removeLogs} />
          </TabPanel>
        </div>
      </ScreenBody>
    </div>
  );
}

// ─── Compose ──────────────────────────────────────────────────────────────────

function Step({ n, title, hint, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2.5">
        <span className="t-num t-caption w-6 h-6 shrink-0 inline-flex items-center justify-center rounded-full bg-accent-wash text-fg-accent border border-line-accent">
          {n}
        </span>
        <div className="min-w-0">
          <h3 className="t-label text-fg-strong">{title}</h3>
          {hint && <p className="t-caption text-fg-subtle mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="ps-8">{children}</div>
    </section>
  );
}

function TemplatePicker({ value, onChange }) {
  return (
    <div className="flex flex-col gap-4" role="radiogroup" aria-label="القالب">
      {TEMPLATE_GROUPS.map((g) => {
        const items = Object.entries(TEMPLATE_META).filter(([, m]) => m.group === g.id && !m.system);
        return (
          <div key={g.id} className="flex flex-col gap-2">
            <p className="t-caption text-fg-subtle">{g.label}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map(([key, m]) => {
                const active = key === value;
                const Icon = m.icon;
                return (
                  <button key={key} type="button" role="radio" aria-checked={active} onClick={() => onChange(key)}
                    className={cx(
                      'flex items-start gap-3 text-start rounded-card border p-3 transition-colors duration-fast',
                      active ? 'border-line-accent bg-accent-wash' : 'border-line bg-sunken hover:border-line-strong',
                    )}>
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true"
                      className={cx('shrink-0 mt-0.5', active ? 'text-fg-accent' : 'text-fg-subtle')} />
                    <span className="min-w-0">
                      <span className={cx('block t-label', active ? 'text-fg-strong' : 'text-fg')}>{m.label}</span>
                      <span className="block t-caption text-fg-subtle mt-0.5 leading-relaxed">{m.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const NO_EDITS = { subject: null, body: null };

function ComposeTab({ onSent }) {
  const [template, setTemplate] = useState('custom_message');
  const [to, setTo]             = useState('');
  const [name, setName]         = useState('');
  const [fields, setFields]     = useState({});
  const [edits, setEdits]       = useState(NO_EDITS);
  const [send, setSend]         = useState({ state: 'idle' }); // idle | sending | sent | error
  const [people, setPeople]     = useState([]);

  const meta = TEMPLATE_META[template];
  const free = !!meta.free;

  useEffect(() => {
    fetch('/api/admin/contributors')
      .then((res) => res.json())
      .then((json) => setPeople((json.contributors || []).filter((c) => c.email)))
      .catch(() => {});
  }, []);

  // What the template is rendered with — the same object the send carries.
  const data = useMemo(() => {
    const d = { ...fields };
    if (name.trim()) d.name = name.trim();
    if (free) { d.subject = edits.subject ?? ''; d.body = edits.body ?? ''; }
    else if (edits.body != null) d.body = edits.body;
    return d;
  }, [fields, name, edits, free]);
  const subject = free ? undefined : edits.subject ?? undefined;
  const preview = useTemplatePreview(template, data, subject);

  const recipient = to.trim().toLowerCase();
  const match = people.find((c) => c.email?.toLowerCase() === recipient);

  const touch = () => { if (send.state !== 'sending') setSend({ state: 'idle' }); };

  const pickTemplate = (key) => {
    setTemplate(key); setFields({}); setEdits(NO_EDITS); setSend({ state: 'idle' });
  };

  const pickRecipient = (value) => {
    setTo(value); touch();
    const person = people.find((c) => c.email?.toLowerCase() === value.trim().toLowerCase());
    if (person && !name.trim()) setName(person.name || '');
  };

  const missing = [
    !recipient && 'البريد الإلكتروني',
    ...meta.fields.filter((f) => f.required && !fields[f.key]?.trim()).map((f) => f.label),
    free && !edits.subject?.trim() && 'الموضوع',
    free && !edits.body?.trim() && 'نص الرسالة',
  ].filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    if (missing.length) { setSend({ state: 'error', error: `أكمل: ${missing.join('، ')}` }); return; }
    setSend({ state: 'sending' });
    try {
      const res  = await fetch('/api/admin/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient, template, data, subject }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'فشل الإرسال');
      setSend({ state: 'sent', to: recipient });
      setTo(''); setName(''); setFields({}); setEdits(NO_EDITS);
      onSent();
    } catch (err) {
      setSend({ state: 'error', error: err.message || 'خطأ في الاتصال بالشبكة' });
    }
  };

  const linkFields = meta.fields;
  let n = 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] items-start">
      <Card padding="lg">
        <form onSubmit={submit} noValidate className="flex flex-col gap-7">
          <Step n={++n} title="نوع الرسالة">
            <TemplatePicker value={template} onChange={pickTemplate} />
          </Step>

          <Step n={++n} title="المستلم" hint="ابدأ بكتابة البريد لتظهر أسماء المساهمين.">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3">
              <Field label="البريد الإلكتروني" required>
                <Input type="email" dir="ltr" value={to} list="mail-recipients" autoComplete="off"
                  placeholder="user@example.com" className="text-left"
                  onChange={(e) => pickRecipient(e.target.value)} />
              </Field>
              <Field label="الاسم في التحية" hint="اختياري">
                <Input value={name} onChange={(e) => { setName(e.target.value); touch(); }} placeholder="مرحباً،" />
              </Field>
            </div>
            <datalist id="mail-recipients">
              {people.map((c) => <option key={c._id} value={c.email}>{c.name}</option>)}
            </datalist>
            {match && (
              <p className="t-caption text-fg-subtle mt-2">
                <Badge size="sm" tone="info">مساهم مسجّل</Badge>
                <span className="ms-2">{match.name}</span>
              </p>
            )}
          </Step>

          {linkFields.length > 0 && (
            <Step n={++n} title="الروابط" hint="تظهر أزراراً في الرسالة، ولا تُعدَّل من النص.">
              <div className="flex flex-col gap-3">
                {linkFields.map((f) => (
                  <Field key={f.key} label={f.label} required={f.required}>
                    <Input type={f.type} dir={f.type === 'url' ? 'ltr' : undefined}
                      className={f.type === 'url' ? 'text-left' : undefined}
                      value={fields[f.key] || ''} placeholder={f.placeholder}
                      onChange={(e) => { setFields((p) => ({ ...p, [f.key]: e.target.value })); touch(); }} />
                  </Field>
                ))}
              </div>
            </Step>
          )}

          <Step n={++n} title="النص" hint={free ? undefined : 'هذا نص القالب كما سيصل. عدّله لهذا المستلم إن أردت.'}>
            <MessageEditor
              free={free}
              defaults={preview?.defaults}
              subject={edits.subject}
              body={edits.body}
              onChange={(next) => { setEdits((e) => ({ ...e, ...next })); touch(); }}
            />
          </Step>

          <div className="flex flex-col gap-3 pt-5 border-t border-line">
            {send.state === 'sent' && (
              <p className="flex items-center gap-2 t-ui text-success" role="status">
                <CircleCheck size={16} aria-hidden="true" />
                <span className="min-w-0 break-words">أُرسلت الرسالة إلى <span dir="ltr">{send.to}</span></span>
              </p>
            )}
            {send.state === 'error' && (
              <p className="flex items-start gap-2 t-ui text-danger" role="alert">
                <CircleAlert size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span className="min-w-0 break-words">{send.error}</span>
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" block icon={Send} loading={send.state === 'sending'}
              className="[&>svg]:-scale-x-100">
              {send.state === 'sending' ? 'جارٍ الإرسال…' : recipient ? `إرسال إلى ${recipient}` : 'إرسال'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="xl:sticky xl:top-6">
        <Card title="كما ستصل" padding="lg">
          <PreviewPane to={recipient} preview={preview}
            emptyText={free ? 'اكتب الموضوع والنص لتظهر المعاينة.' : 'أكمل الروابط المطلوبة لتظهر المعاينة.'} />
        </Card>
      </div>
    </div>
  );
}

// ─── Log ──────────────────────────────────────────────────────────────────────

const LOG_FILTERS = [
  { id: 'all',      label: 'الكل' },
  { id: 'problems', label: 'لم تصل' },
  { id: 'manual',   label: 'من الإدارة' },
  { id: 'auto',     label: 'تلقائية' },
];

// Written by an admin, from here or from Comms; the rest the platform sends.
const MANUAL = new Set(['custom_message', 'beta_invite', 'magic_link']);

function dayLabel(ts) {
  const d = new Date(ts); const today = new Date();
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(today) - start(d)) / DAY_MS);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'أمس';
  return formatDate(ts, 'long');
}

function LogTab({ logs, state, onReload, onRemove }) {
  const [filter, setFilter]   = useState('all');
  const [kind, setKind]       = useState('');
  const [query, setQuery]     = useState('');
  const [open, setOpen]       = useState(null);

  const kinds = useMemo(() => [...new Set(logs.map((l) => l.template))], [logs]);
  const q = query.trim().toLowerCase();

  const shown = logs.filter((l) =>
    (filter === 'all'
      || (filter === 'problems' && isProblem(l))
      || (filter === 'manual' && MANUAL.has(l.template))
      || (filter === 'auto' && !MANUAL.has(l.template)))
    && (!kind || l.template === kind)
    && (!q || l.to.toLowerCase().includes(q) || l.subject?.toLowerCase().includes(q)));

  const days = [];
  for (const l of shown) {
    const label = dayLabel(l.timestamp);
    if (days.at(-1)?.label !== label) days.push({ label, rows: [] });
    days.at(-1).rows.push(l);
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-b border-line">
        <Segmented size="sm" label="تصفية السجل" value={filter} onChange={setFilter}
          items={LOG_FILTERS.map((f) => (f.id === 'problems' ? { ...f, label: `${f.label} · ${logs.filter(isProblem).length}` } : f))} />
        <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="القالب" className="h-9 w-48">
          <option value="">كل القوالب</option>
          {kinds.map((k) => <option key={k} value={k}>{templateLabel(k)}</option>)}
        </Select>
        <label className="relative flex-1 min-w-48">
          <span className="sr-only">ابحث</span>
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-fg-subtle" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بالبريد أو الموضوع…" className="h-9 ps-9" />
        </label>
        <IconButton icon={RefreshCw} label="تحديث" size="sm" onClick={onReload}
          className={state === 'loading' ? '[&>svg]:animate-spin' : undefined} />
      </div>

      {state === 'loading' && logs.length === 0 && <p className="p-6 t-body text-fg-subtle">جارٍ التحميل…</p>}
      {state === 'error' && <p className="p-6 t-body text-danger">تعذّر تحميل السجل</p>}
      {state === 'ok' && shown.length === 0 && (
        <EmptyState variant="plain"
          title={filter === 'problems' ? 'لا رسائل متعثرة' : logs.length ? 'لا شيء يطابق البحث' : 'السجل فارغ'}
          description={filter === 'problems' ? 'كل ما أُرسل وصل أو ما زال في الطريق.' : undefined} />
      )}

      {days.map((d) => (
        <section key={d.label}>
          <h3 className="sticky top-0 z-[1] px-4 py-2 t-caption text-fg-subtle bg-sunken border-b border-line">
            {d.label} · {formatNumber(d.rows.length)}
          </h3>
          <ul className="divide-y divide-line">
            {d.rows.map((l) => (
              <LogRow key={l._id} log={l} open={open === l._id} onToggle={() => setOpen((o) => (o === l._id ? null : l._id))}
                onRemove={() => onRemove({ ids: [l._id] })} />
            ))}
          </ul>
        </section>
      ))}

      {logs.length >= LOG_LIMIT && (
        <p className="px-4 py-3 t-caption text-fg-subtle border-t border-line">
          يُعرض أحدث {formatNumber(LOG_LIMIT)} رسالة. أرشف القديم من تبويب الأرشيف ليبقى السجل خفيفاً.
        </p>
      )}
    </Card>
  );
}

function LogRow({ log, open, onToggle, onRemove }) {
  const st = deliveryState(log);
  const meta = TEMPLATE_META[log.template];
  const Icon = meta?.icon;

  return (
    <li>
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-hover transition-colors">
        {Icon && <Icon size={16} strokeWidth={1.75} className="shrink-0 text-fg-subtle" aria-hidden="true" />}
        <span className="min-w-0 flex-1">
          <span className="block t-ui text-fg-strong truncate">{log.subject}</span>
          <span className="block t-caption text-fg-subtle truncate">
            <span dir="ltr">{log.to}</span> · {templateLabel(log.template)}
          </span>
        </span>
        <Badge tone={st.tone} size="sm">{st.label}</Badge>
        <span className="t-num t-caption text-fg-subtle w-16 text-end shrink-0 whitespace-nowrap">{formatDate(log.timestamp, 'time')}</span>
        <ChevronDown size={15} className={cx('shrink-0 text-fg-subtle transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="px-4 pb-4 ps-11 flex flex-col gap-3">
          <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 t-caption">
            <dt className="text-fg-subtle">أُرسلت</dt><dd className="text-fg">{formatDate(log.timestamp, 'dateTime')}</dd>
            <dt className="text-fg-subtle">القالب</dt><dd className="text-fg">{meta?.description || templateLabel(log.template)}</dd>
            {st.detail && (<><dt className="text-fg-subtle">التفاصيل</dt><dd dir="auto" className="text-danger break-words">{st.detail}</dd></>)}
            {log.deliveryUpdatedAt && (<><dt className="text-fg-subtle">آخر تحديث</dt><dd className="text-fg">{formatDate(log.deliveryUpdatedAt, 'dateTime')}</dd></>)}
            {log.providerId && (<><dt className="text-fg-subtle">المعرّف</dt><dd dir="ltr" className="text-fg-muted break-all text-left">{log.providerId}</dd></>)}
          </dl>
          <div>
            <ConfirmButton icon={Trash2} title="حذف هذه الرسالة من السجل؟"
              description="يبقى عددها في الأرشيف، بلا عنوان ولا موضوع." onConfirm={onRemove}>
              حذف من السجل
            </ConfirmButton>
          </div>
        </div>
      )}
    </li>
  );
}

// ─── Archive ──────────────────────────────────────────────────────────────────

const RANGES = [
  { id: '30',  label: 'أقدم من 30 يوماً', body: { olderThanDays: 30 }, days: 30 },
  { id: '90',  label: 'أقدم من 90 يوماً', body: { olderThanDays: 90 }, days: 90 },
  { id: 'all', label: 'السجل كله',        body: { all: true },         days: 0 },
];

function monthLabel(month) {
  return formatDate(`${month}-01T00:00:00Z`, 'month', { timeZone: 'UTC' });
}

function pct(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

// delivered · problems · the rest (sent, never confirmed either way)
function Bar({ total, delivered, problems, className }) {
  const rest = Math.max(total - delivered - problems, 0);
  return (
    <div className={cx('flex h-2 rounded-full overflow-hidden bg-hover', className)} aria-hidden="true">
      <span className="bg-success" style={{ width: `${pct(delivered, total)}%` }} />
      <span className="bg-danger" style={{ width: `${pct(problems, total)}%` }} />
      <span className="bg-line-strong" style={{ width: `${pct(rest, total)}%` }} />
    </div>
  );
}

function ArchiveTab({ archive, logs, onRemove }) {
  const [range, setRange]   = useState('90');
  const [result, setResult] = useState(null); // { n } | { error }
  const [open, setOpen]     = useState(null);

  const r = RANGES.find((x) => x.id === range);
  const due = logs.filter((l) => !r.days || Date.now() - new Date(l.timestamp) > r.days * DAY_MS).length;

  const total     = archive.reduce((n, m) => n + m.total, 0);
  const delivered = archive.reduce((n, m) => n + m.delivered, 0);
  const problems  = archive.reduce((n, m) => n + m.problems, 0);

  const run = async () => {
    setResult(null);
    try { setResult({ n: await onRemove(r.body) }); }
    catch (e) { setResult({ error: e.message }); }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] items-start">
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="t-title text-fg-strong">شهراً بشهر</h2>
          <p className="t-caption text-fg-subtle mt-1">
            ما أُرشف من السجل: الأعداد وحدها، موزعة على القوالب. لا عناوين ولا مواضيع.
          </p>
        </div>

        {archive.length === 0 ? (
          <EmptyState variant="plain" icon={Archive} title="الأرشيف فارغ"
            description="حين تؤرشف رسائل قديمة من السجل، تظهر أعدادها هنا." />
        ) : (
          <ul className="divide-y divide-line">
            {archive.map((m) => {
              const isOpen = open === m.month;
              return (
                <li key={m.month}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : m.month)} aria-expanded={isOpen}
                    className="w-full grid grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 text-start hover:bg-hover transition-colors">
                    <span className="t-label text-fg-strong">{monthLabel(m.month)}</span>
                    <span className="flex flex-col gap-1.5 min-w-0">
                      <Bar {...m} />
                      <span className="t-caption text-fg-subtle">
                        {formatNumber(m.total)} رسالة · وصلت {pct(m.delivered, m.total)}%
                        {m.problems > 0 && <span className="text-danger"> · لم تصل {formatNumber(m.problems)}</span>}
                      </span>
                    </span>
                    <ChevronDown size={15} className={cx('text-fg-subtle transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <ul className="px-5 pb-4 flex flex-col gap-2.5">
                      {(m.templates || []).map((t) => (
                        <li key={t.template} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_3rem] items-center gap-3 t-caption">
                          <span className="text-fg truncate">{templateLabel(t.template)}</span>
                          <Bar {...t} className="h-1.5" />
                          <span className="t-num text-fg-muted text-end">{formatNumber(t.total)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="flex flex-col gap-4">
        {archive.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Stat value={total} label="مؤرشفة" />
            <Stat value={`${pct(delivered, total)}%`} label="وصلت" hint={problems ? `${formatNumber(problems)} لم تصل` : undefined}
              hintTone={problems ? 'danger' : 'subtle'} />
          </div>
        )}
        <div className="flex items-center gap-4 t-caption text-fg-subtle flex-wrap">
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" />وصلت</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger" />لم تصل</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-line-strong" />بلا تأكيد</span>
        </div>

        <Card title="أرشفة السجل">
          <p className="t-caption text-fg-subtle leading-relaxed mb-4">
            تُحذف الرسائل من السجل ومن سجل بريد كل مساهم، ويُضاف عددها إلى الشهر الذي أُرسلت فيه. لا رجعة فيها.
          </p>
          <Field label="ما يُؤرشف">
            <Select value={range} onChange={(e) => { setRange(e.target.value); setResult(null); }}>
              {RANGES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </Select>
          </Field>
          <p className="t-caption text-fg-muted mt-2">
            {due ? `${formatNumber(due)} رسالة في السجل المعروض ضمن هذا النطاق.` : 'لا رسائل في هذا النطاق.'}
          </p>
          <div className="mt-4">
            <ConfirmButton icon={Archive} size="md" disabled={!due}
              title={`أرشفة ${r.label.replace('أقدم', 'الرسائل الأقدم')}؟`}
              description="تبقى الأعداد الشهرية فقط. لا يمكن استرجاع العناوين والمواضيع."
              confirmLabel="أرشف" onConfirm={run}>
              أرشف واحذف من السجل
            </ConfirmButton>
          </div>
          {result?.error && <p className="t-caption text-danger mt-3" role="alert">{result.error}</p>}
          {result && 'n' in result && (
            <p className="t-caption text-success mt-3" role="status">
              {result.n ? `أُرشفت ${formatNumber(result.n)} رسالة.` : 'لا رسائل في هذا النطاق.'}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
