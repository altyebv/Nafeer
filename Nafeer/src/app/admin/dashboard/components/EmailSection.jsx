'use client';
import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from './ui/shared';

// ─── Template metadata ────────────────────────────────────────────────────────
// Defines what fields each template needs and how to label them in Arabic.

const TEMPLATE_META = {
  magic_link: {
    label: 'رابط الدخول السحري',
    description: 'رابط تسجيل دخول مباشر بدون كلمة مرور',
    fields: [
      { key: 'link',      label: 'رابط الدخول',   type: 'url',  required: true,  placeholder: 'https://...' },
      { key: 'name',      label: 'الاسم (اختياري)', type: 'text', required: false, placeholder: 'أحمد' },
      { key: 'expiresIn', label: 'مدة الصلاحية',   type: 'text', required: false, placeholder: '24 ساعة' },
    ],
  },
  onboarding_invite: {
    label: 'دعوة تأهيل المساهم',
    description: 'تُرسل للمساهمين المقبولين لإكمال حساباتهم',
    fields: [
      { key: 'name', label: 'اسم المساهم', type: 'text', required: true,  placeholder: 'محمد علي' },
      { key: 'link', label: 'رابط التأهيل', type: 'url',  required: true,  placeholder: 'https://...' },
    ],
  },
  beta_invite: {
    label: 'دعوة بيتا',
    description: 'وصول مبكر للنسخة التجريبية',
    fields: [
      { key: 'link', label: 'رابط الوصول',   type: 'url',  required: true,  placeholder: 'https://...' },
      { key: 'name', label: 'الاسم (اختياري)', type: 'text', required: false, placeholder: 'سارة' },
    ],
  },
  custom_message: {
    label: 'رسالة مخصصة',
    description: 'رسالة حرة من الإدارة',
    fields: [
      { key: 'subject', label: 'موضوع الرسالة', type: 'text',     required: true,  placeholder: 'إشعار هام' },
      { key: 'name',    label: 'الاسم (اختياري)', type: 'text',   required: false, placeholder: 'المستخدم' },
      { key: 'message', label: 'نص الرسالة',     type: 'textarea', required: true,  placeholder: 'اكتب رسالتك هنا…' },
    ],
  },
};

const TEMPLATES = Object.entries(TEMPLATE_META).map(([key, meta]) => ({ key, ...meta }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputRow({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-arabic text-ink-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ type, value, onChange, placeholder, required }) {
  const base = {
    width:       '100%',
    background:  'rgba(255,255,255,0.03)',
    border:      '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    color:       'rgba(255,255,255,0.8)',
    padding:     '8px 12px',
    fontSize:    13,
    fontFamily:  'inherit',
    outline:     'none',
    transition:  'border-color 0.15s',
    direction:   type === 'url' ? 'ltr' : 'inherit',
  };

  const handlers = {
    onFocus: (e) => { e.currentTarget.style.borderColor = 'rgba(212,137,30,0.4)'; },
    onBlur:  (e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; },
  };

  if (type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={4}
        style={{ ...base, resize: 'vertical', lineHeight: 1.6 }}
        {...handlers}
      />
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      style={base}
      {...handlers}
    />
  );
}

function TemplateSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-6">
      {TEMPLATES.map((t) => {
        const active = selected === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            className="text-right px-3.5 py-3 rounded-xl transition-all"
            style={{
              background: active ? 'rgba(212,137,30,0.10)' : 'rgba(255,255,255,0.02)',
              border:     active ? '1px solid rgba(212,137,30,0.28)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-xs font-arabic font-semibold"
              style={{ color: active ? '#d4891e' : 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
              {t.label}
            </p>
            <p className="text-[11px] font-arabic"
              style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              {t.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function SendFeedback({ state, error }) {
  if (state === 'idle') return null;
  if (state === 'sending') {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-ink-600 py-2 animate-pulse">
        <span>···</span><span>جاري الإرسال</span>
      </div>
    );
  }
  if (state === 'success') {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-arabic"
        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
        <span>✓</span><span>تم إرسال البريد بنجاح</span>
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl text-xs font-arabic"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
        <span className="shrink-0 mt-0.5">✕</span>
        <span>{error || 'حدث خطأ أثناء الإرسال'}</span>
      </div>
    );
  }
  return null;
}

function LogRow({ log }) {
  const isSent = log.status === 'sent';
  return (
    <div className="flex items-start gap-3 py-3"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>

      {/* Status dot */}
      <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: isSent ? '#4ade80' : '#f87171' }} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-200 font-arabic truncate">{log.to}</p>
        <p className="text-[11px] text-ink-600 font-arabic mt-0.5 truncate">{log.subject}</p>
      </div>

      {/* Right: template + time */}
      <div className="text-right shrink-0">
        <p className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(212,137,30,0.08)',
            border:     '1px solid rgba(212,137,30,0.12)',
            color:      '#d4891e',
          }}>
          {log.template}
        </p>
        <p className="text-[10px] text-ink-700 font-mono mt-1">{fmtTime(log.timestamp)}</p>
      </div>
    </div>
  );
}

// ─── Preview Panel ────────────────────────────────────────────────────────────

function LivePreview({ template, to, fields }) {
  const meta = TEMPLATE_META[template];
  if (!meta) return null;

  const hasRequiredFields = meta.fields
    .filter((f) => f.required)
    .every((f) => fields[f.key]?.trim());

  return (
    <div style={{
      background:   'rgba(255,255,255,0.015)',
      border:       '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding:      '18px 20px',
    }}>
      <p className="text-[10px] font-mono text-ink-700 uppercase tracking-widest mb-3">معاينة</p>

      {/* Envelope summary */}
      <div className="space-y-2 mb-4">
        {[
          { label: 'إلى',      value: to              || '—' },
          { label: 'القالب',   value: meta.label               },
          { label: 'الحقول',   value: hasRequiredFields ? 'مكتملة ✓' : 'غير مكتملة' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2 text-xs font-arabic">
            <span className="text-ink-700 w-14">{label}</span>
            <span className="text-ink-400">{value}</span>
          </div>
        ))}
      </div>

      {/* Simulated mini email card */}
      <div style={{
        background:   '#1a1713',
        border:       '1px solid rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding:      '12px 14px',
      }}>
        <div className="flex items-center gap-2 mb-2.5 pb-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-sm font-bold" style={{ color: '#d4891e' }}>نفير</span>
          <span className="text-[9px] font-mono text-ink-700">ADMIN</span>
        </div>

        {fields.subject || fields.name || fields.link ? (
          <>
            <p className="text-xs font-arabic font-semibold text-ink-200 mb-1">
              {fields.subject || meta.label}
            </p>
            {fields.name && (
              <p className="text-[11px] font-arabic text-ink-600">
                مرحباً {fields.name}،
              </p>
            )}
            {fields.link && (
              <div className="mt-2 inline-block px-3 py-1 rounded text-[10px] font-arabic"
                style={{ background: 'rgba(212,137,30,0.15)', color: '#d4891e' }}>
                → رابط الإجراء
              </div>
            )}
            {fields.message && (
              <p className="text-[11px] font-arabic text-ink-600 mt-1 line-clamp-2">
                {fields.message.slice(0, 80)}{fields.message.length > 80 ? '…' : ''}
              </p>
            )}
          </>
        ) : (
          <p className="text-[11px] font-arabic text-ink-700">أدخل بيانات لرؤية المعاينة…</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function EmailSection() {
  const [template,   setTemplate]  = useState('magic_link');
  const [to,         setTo]        = useState('');
  const [fields,     setFields]    = useState({});
  const [sendState,  setSendState] = useState('idle');   // idle | sending | success | error
  const [sendError,  setSendError] = useState('');
  const [logs,       setLogs]      = useState([]);
  const [logsState,  setLogsState] = useState('loading'); // loading | ok | error

  // Reset field values when template changes
  const handleTemplateChange = (key) => {
    setTemplate(key);
    setFields({});
    setSendState('idle');
    setSendError('');
  };

  const setField = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  // Load recent logs
  const loadLogs = useCallback(async () => {
    setLogsState('loading');
    try {
      const res  = await fetch('/api/admin/email/logs?limit=30');
      const data = await res.json();
      if (data.ok) { setLogs(data.logs || []); setLogsState('ok'); }
      else          { setLogsState('error'); }
    } catch {
      setLogsState('error');
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleSend = async () => {
    const meta = TEMPLATE_META[template];
    if (!meta) return;

    // Client-side required field check
    const missing = meta.fields.filter((f) => f.required && !fields[f.key]?.trim());
    if (!to.trim()) { setSendError('البريد الإلكتروني للمستلم مطلوب.'); setSendState('error'); return; }
    if (missing.length > 0) {
      setSendError(`الحقول المطلوبة غير مكتملة: ${missing.map((f) => f.label).join('، ')}`);
      setSendState('error');
      return;
    }

    setSendState('sending');
    setSendError('');

    try {
      const res  = await fetch('/api/admin/email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ to: to.trim(), template, data: fields }),
      });
      const data = await res.json();

      if (data.ok) {
        setSendState('success');
        setTo('');
        setFields({});
        // Refresh logs after a short delay so the new entry is visible
        setTimeout(loadLogs, 800);
      } else {
        setSendError(data.error || 'فشل الإرسال');
        setSendState('error');
      }
    } catch (err) {
      setSendError('خطأ في الاتصال بالشبكة');
      setSendState('error');
    }
  };

  const isSending = sendState === 'sending';
  const meta      = TEMPLATE_META[template];

  return (
    <div>
      <SectionHeader
        title="إرسال البريد الإلكتروني"
        description="أرسل قوالب بريدية جاهزة عبر Resend — سجل الإرسال محفوظ أدناه"
      />

      <div className="px-8 pb-12">
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px' }}>

          {/* ── Left: Form ─────────────────────────────────────────────────── */}
          <div>
            {/* Template selector */}
            <div className="mb-5">
              <p className="text-xs font-arabic text-ink-600 mb-2.5">اختر القالب</p>
              <TemplateSelector selected={template} onSelect={handleTemplateChange} />
            </div>

            {/* Recipient */}
            <InputRow label="البريد الإلكتروني للمستلم *">
              <StyledInput
                type="email"
                value={to}
                onChange={(e) => { setTo(e.target.value); if (sendState !== 'idle') setSendState('idle'); }}
                placeholder="user@example.com"
                required
              />
            </InputRow>

            {/* Dynamic fields for selected template */}
            {meta?.fields.map((f) => (
              <InputRow key={f.key} label={`${f.label}${f.required ? ' *' : ''}`}>
                <StyledInput
                  type={f.type}
                  value={fields[f.key] || ''}
                  onChange={(e) => { setField(f.key, e.target.value); if (sendState !== 'idle') setSendState('idle'); }}
                  placeholder={f.placeholder}
                  required={f.required}
                />
              </InputRow>
            ))}

            {/* Feedback */}
            <div className="mt-2 mb-4">
              <SendFeedback state={sendState} error={sendError} />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={isSending}
              className="w-full py-2.5 rounded-xl text-sm font-arabic font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: isSending ? 'rgba(212,137,30,0.15)' : 'rgba(212,137,30,0.18)',
                border:     '1px solid rgba(212,137,30,0.35)',
                color:      isSending ? 'rgba(212,137,30,0.5)' : '#d4891e',
                cursor:     isSending ? 'not-allowed' : 'pointer',
              }}
            >
              {isSending
                ? <><span className="animate-pulse font-mono text-xs">···</span><span>جاري الإرسال</span></>
                : <><span>✉</span><span>إرسال البريد</span></>
              }
            </button>
          </div>

          {/* ── Right: Preview + Logs ───────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Live preview */}
            <LivePreview template={template} to={to} fields={fields} />

            {/* Recent logs */}
            <div style={{
              background:   'rgba(255,255,255,0.015)',
              border:       '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding:      '18px 20px',
            }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-mono text-ink-700 uppercase tracking-widest">
                  آخر الإرسالات
                </p>
                <button
                  onClick={loadLogs}
                  className="text-[10px] font-mono text-ink-700 hover:text-ink-400 transition-colors"
                >
                  ↻ تحديث
                </button>
              </div>

              {logsState === 'loading' && (
                <p className="text-[11px] font-mono text-ink-700 animate-pulse py-2">LOADING...</p>
              )}

              {logsState === 'error' && (
                <p className="text-[11px] font-arabic text-red-800 py-2">تعذّر تحميل السجل</p>
              )}

              {logsState === 'ok' && logs.length === 0 && (
                <p className="text-[11px] font-arabic text-ink-700 py-2">لا يوجد إرسالات بعد</p>
              )}

              {logsState === 'ok' && logs.length > 0 && (
                <div>
                  {logs.slice(0, 15).map((log) => (
                    <LogRow key={log._id} log={log} />
                  ))}
                  {logs.length > 15 && (
                    <p className="text-[10px] font-mono text-ink-700 pt-2 text-center">
                      +{logs.length - 15} إرسال أقدم
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}