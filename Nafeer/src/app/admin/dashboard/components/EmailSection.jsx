'use client';
import { useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, CircleCheck, CircleAlert } from 'lucide-react';
import { SectionHeader, EmptyState, Spinner } from './ui/shared';
import { emailStatus } from './ui/emailStatus';

// ─── Template metadata ────────────────────────────────────────────────────────
// Defines what fields each template needs and how to label them in Arabic.

const TEMPLATE_META = {
  custom_message: {
    label: 'رسالة مخصصة',
    description: 'رسالة حرة من الإدارة إلى أي عنوان.',
    fields: [
      { key: 'subject', label: 'موضوع الرسالة', type: 'text',     required: true,  placeholder: 'إشعار هام' },
      { key: 'name',    label: 'اسم المستلم',   type: 'text',     required: false, placeholder: 'المستخدم' },
      { key: 'message', label: 'نص الرسالة',    type: 'textarea', required: true,  placeholder: 'اكتب رسالتك هنا…' },
    ],
  },
  interview_invite: {
    label: 'دعوة المقابلة الكتابية',
    description: 'تُرسل تلقائياً عند إرسال رابط المقابلة من بطاقة المتقدم.',
    fields: [
      { key: 'link', label: 'رابط المقابلة', type: 'url',  required: true,  placeholder: 'https://...' },
      { key: 'name', label: 'اسم المستلم',   type: 'text', required: false, placeholder: 'محمد علي' },
    ],
  },
  onboarding_invite: {
    label: 'دعوة تأهيل المساهم',
    description: 'تُرسل تلقائياً عند اعتماد المساهم أو تجديد رابط التأهيل.',
    fields: [
      { key: 'link', label: 'رابط التأهيل', type: 'url',  required: true,  placeholder: 'https://...' },
      { key: 'name', label: 'اسم المستلم',  type: 'text', required: false, placeholder: 'محمد علي' },
    ],
  },
  application_received: {
    label: 'تأكيد استلام الطلب',
    description: 'تُرسل تلقائياً عند تقديم طلب الانضمام.',
    fields: [
      { key: 'name', label: 'اسم المستلم', type: 'text', required: false, placeholder: 'سارة' },
    ],
  },
  application_rejected: {
    label: 'الاعتذار عن الطلب',
    description: 'اعتذار مهذب للمتقدم. لا تُرسل تلقائياً — من هنا فقط.',
    fields: [
      { key: 'name', label: 'اسم المستلم', type: 'text', required: false, placeholder: 'أحمد' },
    ],
  },
  beta_invite: {
    label: 'دعوة النسخة التجريبية',
    description: 'وصول مبكر للنسخة التجريبية.',
    fields: [
      { key: 'link', label: 'رابط الوصول', type: 'url',  required: true,  placeholder: 'https://...' },
      { key: 'name', label: 'اسم المستلم', type: 'text', required: false, placeholder: 'سارة' },
    ],
  },
  magic_link: {
    label: 'رابط الدخول',
    description: 'رابط دخول مباشر بدون كلمة مرور.',
    fields: [
      { key: 'link',      label: 'رابط الدخول',  type: 'url',  required: true,  placeholder: 'https://...' },
      { key: 'name',      label: 'اسم المستلم',  type: 'text', required: false, placeholder: 'أحمد' },
      { key: 'expiresIn', label: 'مدة الصلاحية', type: 'text', required: false, placeholder: '24 ساعة' },
    ],
  },
};

const TEMPLATES = Object.entries(TEMPLATE_META).map(([key, meta]) => ({ key, ...meta }));

const TABS = [
  { id: 'compose', label: 'رسالة جديدة' },
  { id: 'log',     label: 'سجل الإرسال' },
];

const LOG_FILTERS = [
  { id: 'all',      label: 'الكل' },
  { id: 'problems', label: 'لم تصل' },
];

// A log entry that needs attention: never left us, or bounced / was reported.
function isProblem(log) {
  return log.status === 'failed' || ['bounced', 'complained', 'failed'].includes(log.delivery);
}

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}

// ─── Form primitives ──────────────────────────────────────────────────────────

const INPUT_CLS =
  'w-full rounded-lg bg-ink-900 border border-ink-700/70 px-3.5 py-2.5 text-sm text-ink-100 ' +
  'placeholder:text-ink-600 transition-colors hover:border-ink-600 focus:border-sand-500 focus:outline-none';

function Field({ label, required, optional = !required, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-arabic text-ink-300 mb-1.5">
        {label}
        {required && <span className="text-sand-400 mr-1" aria-hidden="true">*</span>}
        {optional && <span className="text-ink-600 mr-1.5 text-xs">اختياري</span>}
      </span>
      {children}
    </label>
  );
}

function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl bg-ink-900/60 border border-ink-800/70 ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3.5 border-b border-ink-800/70">
          <h2 className="text-sm font-arabic font-semibold text-ink-200">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function SendFeedback({ state, error, sentTo }) {
  if (state === 'success') {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-arabic bg-success-surface border border-success-border text-success" role="status">
        <CircleCheck size={16} className="shrink-0" />
        <span className="min-w-0 break-words">أُرسلت الرسالة إلى <span dir="ltr">{sentTo}</span></span>
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg text-sm font-arabic bg-danger-surface border border-danger-border text-danger" role="alert">
        <CircleAlert size={16} className="shrink-0 mt-0.5" />
        <span className="min-w-0 break-words">{error || 'حدث خطأ أثناء الإرسال'}</span>
      </div>
    );
  }
  return null;
}

// ─── Preview ──────────────────────────────────────────────────────────────────
// Renders the real template server-side (same code path as sending) and shows
// it in a sandboxed iframe, so what you see is what the recipient gets.

function LivePreview({ template, to, fields }) {
  const [preview, setPreview] = useState(null); // { ok, subject?, html?, error? }

  const dataKey = JSON.stringify(fields);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch('/api/admin/email/preview', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ template, data: JSON.parse(dataKey) }),
        });
        const data = await res.json();
        if (!cancelled) setPreview(data);
      } catch {
        if (!cancelled) setPreview({ ok: false, error: 'تعذّر تحميل المعاينة' });
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [template, dataKey]);

  return (
    <Card title="المعاينة">
      {/* Envelope */}
      <dl className="px-5 py-3.5 space-y-1.5 border-b border-ink-800/70 text-sm font-arabic">
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-ink-500">إلى</dt>
          <dd className="min-w-0 break-all text-ink-200">{to ? <span dir="ltr">{to}</span> : '—'}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-ink-500">الموضوع</dt>
          <dd className="min-w-0 break-words text-ink-200">{preview?.ok ? preview.subject : '—'}</dd>
        </div>
      </dl>

      <div className="p-3">
        {preview?.ok ? (
          <iframe
            title="معاينة البريد"
            sandbox=""
            srcDoc={preview.html}
            className="w-full h-[560px] rounded-xl border border-ink-800/70 bg-ink-950"
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-center px-6">
            <p className="text-sm font-arabic text-ink-500">
              {preview ? 'أكمل الحقول المطلوبة لتظهر المعاينة هنا.' : 'جارٍ تحميل المعاينة…'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Compose tab ──────────────────────────────────────────────────────────────

function ComposeTab({ onSent }) {
  const [template,  setTemplate]  = useState('custom_message');
  const [to,        setTo]        = useState('');
  const [fields,    setFields]    = useState({});
  const [sendState, setSendState] = useState('idle'); // idle | sending | success | error
  const [sendError, setSendError] = useState('');
  const [sentTo,    setSentTo]    = useState('');
  const [people,    setPeople]    = useState([]);     // contributors, for recipient suggestions

  const meta = TEMPLATE_META[template];

  useEffect(() => {
    fetch('/api/admin/contributors')
      .then((res) => res.json())
      .then((data) => setPeople((data.contributors || []).filter((c) => c.email)))
      .catch(() => {});
  }, []);

  const clearFeedback = () => { if (sendState === 'success' || sendState === 'error') setSendState('idle'); };

  // Switching template keeps the recipient's name but drops everything else.
  const handleTemplateChange = (key) => {
    setTemplate(key);
    setFields((prev) => (prev.name ? { name: prev.name } : {}));
    setSendState('idle');
    setSendError('');
  };

  const setField = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    clearFeedback();
  };

  // Picking a known contributor fills in their name when the template has one.
  const handleToChange = (value) => {
    setTo(value);
    clearFeedback();
    const person  = people.find((c) => c.email === value.trim().toLowerCase());
    const hasName = meta.fields.some((f) => f.key === 'name');
    if (person && hasName) setFields((prev) => (prev.name ? prev : { ...prev, name: person.name }));
  };

  const handleSend = async (e) => {
    e.preventDefault();

    const recipient = to.trim();
    const missing   = meta.fields.filter((f) => f.required && !fields[f.key]?.trim());
    if (!recipient) { setSendError('البريد الإلكتروني للمستلم مطلوب.'); setSendState('error'); return; }
    if (missing.length > 0) {
      setSendError(`أكمل الحقول المطلوبة: ${missing.map((f) => f.label).join('، ')}`);
      setSendState('error');
      return;
    }

    setSendState('sending');
    setSendError('');

    try {
      const res  = await fetch('/api/admin/email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ to: recipient, template, data: fields }),
      });
      const data = await res.json();

      if (data.ok) {
        setSentTo(recipient);
        setSendState('success');
        setTo('');
        setFields({});
        onSent();
      } else {
        setSendError(data.error || 'فشل الإرسال');
        setSendState('error');
      }
    } catch {
      setSendError('خطأ في الاتصال بالشبكة');
      setSendState('error');
    }
  };

  const isSending = sendState === 'sending';

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start">

      {/* ── Form ── */}
      <Card>
        <form onSubmit={handleSend} className="p-5 space-y-5" noValidate>
          <Field label="القالب" optional={false}>
            <select
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className={`${INPUT_CLS} font-arabic`}
            >
              {TEMPLATES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <span className="block text-xs font-arabic text-ink-500 mt-1.5 leading-relaxed">{meta.description}</span>
          </Field>

          <Field label="البريد الإلكتروني للمستلم" required>
            <input
              type="email"
              dir="ltr"
              value={to}
              onChange={(e) => handleToChange(e.target.value)}
              placeholder="user@example.com"
              list="email-recipients"
              autoComplete="off"
              className={`${INPUT_CLS} text-left`}
            />
            <datalist id="email-recipients">
              {people.map((c) => (
                <option key={c._id} value={c.email}>{c.name}</option>
              ))}
            </datalist>
          </Field>

          {meta.fields.map((f) => (
            <Field key={f.key} label={f.label} required={f.required}>
              {f.type === 'textarea' ? (
                <textarea
                  value={fields[f.key] || ''}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={7}
                  className={`${INPUT_CLS} font-arabic leading-relaxed resize-y`}
                />
              ) : (
                <input
                  type={f.type}
                  dir={f.type === 'url' ? 'ltr' : undefined}
                  value={fields[f.key] || ''}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={`${INPUT_CLS} ${f.type === 'url' ? 'text-left' : 'font-arabic'}`}
                />
              )}
            </Field>
          ))}

          <SendFeedback state={sendState} error={sendError} sentTo={sentTo} />

          <button
            type="submit"
            disabled={isSending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-arabic font-bold bg-sand-600 hover:bg-sand-500 text-ink-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send size={16} className="-scale-x-100" />
            <span>{isSending ? 'جارٍ الإرسال…' : 'إرسال'}</span>
          </button>
        </form>
      </Card>

      {/* ── Preview ── */}
      <div className="xl:sticky xl:top-36">
        <LivePreview template={template} to={to.trim()} fields={fields} />
      </div>
    </div>
  );
}

// ─── Log tab ──────────────────────────────────────────────────────────────────

function LogRow({ log }) {
  const st = emailStatus(log);
  return (
    <li className="px-5 py-3.5 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-100 truncate"><span dir="ltr">{log.to}</span></p>
        <p className="text-sm font-arabic text-ink-400 truncate mt-0.5">{log.subject}</p>
        {st.detail && (
          <p className="text-xs font-arabic mt-1 break-words" style={{ color: st.color }}>{st.detail}</p>
        )}
      </div>
      <div className="flex items-center gap-3 md:gap-4 shrink-0 flex-wrap">
        <span className="text-xs font-arabic text-ink-400 px-2 py-0.5 rounded-md bg-ink-800/70">
          {TEMPLATE_META[log.template]?.label || log.template}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-arabic whitespace-nowrap" style={{ color: st.color }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
          {st.label}
        </span>
        <span className="text-xs text-ink-500 tabular-nums md:w-40 md:text-left">{fmtTime(log.timestamp)}</span>
      </div>
    </li>
  );
}

function LogTab({ logs, state, onReload }) {
  const [filter, setFilter] = useState('all');

  const problems = logs.filter(isProblem);
  const shown    = filter === 'problems' ? problems : logs;

  return (
    <Card
      title={logs.length > 0 ? `آخر ${logs.length} رسالة` : 'سجل الإرسال'}
      action={
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-ink-800/60 p-0.5">
            {LOG_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 rounded-md text-xs font-arabic transition-colors ${
                  filter === f.id ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                {f.label}
                {f.id === 'problems' && problems.length > 0 && (
                  <span className="mr-1.5 text-danger tabular-nums">{problems.length}</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={onReload}
            aria-label="تحديث السجل"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800/60 transition-colors"
          >
            <RefreshCw size={15} className={state === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>
      }
    >
      {state === 'loading' && logs.length === 0 && <Spinner />}
      {state === 'error' && (
        <p className="px-5 py-10 text-center text-sm font-arabic text-danger">تعذّر تحميل السجل</p>
      )}
      {state === 'ok' && shown.length === 0 && (
        <EmptyState
          text={filter === 'problems' ? 'لا توجد رسائل متعثرة' : 'لم تُرسل أي رسالة بعد'}
          sub={filter === 'problems' ? 'كل ما أُرسل وصل أو ما زال في الطريق.' : undefined}
        />
      )}
      {shown.length > 0 && (
        <ul className="divide-y divide-ink-800/60">
          {shown.map((log) => <LogRow key={log._id} log={log} />)}
        </ul>
      )}
    </Card>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function EmailSection() {
  const [tab,       setTab]       = useState('compose');
  const [logs,      setLogs]      = useState([]);
  const [logsState, setLogsState] = useState('loading'); // loading | ok | error

  const loadLogs = useCallback(async () => {
    setLogsState('loading');
    try {
      const res  = await fetch('/api/admin/email/logs?limit=100');
      const data = await res.json();
      if (data.ok) { setLogs(data.logs || []); setLogsState('ok'); }
      else          { setLogsState('error'); }
    } catch {
      setLogsState('error');
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const problemCount = logs.filter(isProblem).length;

  return (
    <div>
      <SectionHeader
        title="البريد الإلكتروني"
        description="أرسل رسالة من قالب جاهز، وتابع ما وصل وما لم يصل."
      >
        <div className="flex gap-1 mt-4 -mb-4" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-arabic border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-sand-500 text-sand-300 font-semibold'
                  : 'border-transparent text-ink-400 hover:text-ink-200'
              }`}
            >
              {t.label}
              {t.id === 'log' && problemCount > 0 && (
                <span className="mr-2 px-1.5 rounded-full text-xs tabular-nums bg-danger-surface border border-danger-border text-danger">
                  {problemCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </SectionHeader>

      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        {/* Both stay mounted so a half-written message survives a look at the log. */}
        <div hidden={tab !== 'compose'}>
          <ComposeTab onSent={() => setTimeout(loadLogs, 800)} />
        </div>
        <div hidden={tab !== 'log'}>
          <LogTab logs={logs} state={logsState} onReload={loadLogs} />
        </div>
      </div>
    </div>
  );
}
