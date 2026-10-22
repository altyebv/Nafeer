'use client';
import { useEffect, useState } from 'react';
import {
  BellRing, BookCheck, ClipboardList, FlaskConical, KeyRound, MailCheck, MailX, PenLine, RotateCcw, UserPlus,
} from 'lucide-react';
import { Badge, Button, Field, Input, Segmented, Textarea } from '@/components/ui';

// ─── Mail kit ─────────────────────────────────────────────────────────────────
// The pieces the mail screen and the reject dialog share: what each template
// is, a live server render of it, the editor for its text, and the preview.
//
// Editing: a template's greeting, buttons and sign-off are fixed; its subject
// and body paragraphs come from the server as `defaults` and can be rewritten
// (templates/index.js). An untouched field follows the defaults, so changing a
// link's validity still updates the text.

// group   applicants · contributors · general — the composer's sections
// system  sent by the platform itself; shown in the log, never composed
// free    no template text: the admin writes the subject and the body
// fields  the template's own inputs, beside the recipient's name
export const TEMPLATE_META = {
  interview_invite: {
    label: 'دعوة المقابلة الكتابية', group: 'applicants', icon: ClipboardList,
    description: 'رابط المقابلة لمتقدم في الانتظار. تُرسل تلقائياً من بطاقة المتقدم.',
    fields: [
      { key: 'link',      label: 'رابط المقابلة', type: 'url',  required: true, placeholder: 'https://...' },
      { key: 'expiresIn', label: 'مدة الصلاحية',  type: 'text', placeholder: '14 يوماً' },
    ],
  },
  application_rejected: {
    label: 'اعتذار عن الطلب', group: 'applicants', icon: MailX,
    description: 'شكر واعتذار مهذب، بلا ذكر للسبب. تُرسل أيضاً عند الرفض.',
    fields: [],
  },
  application_received: {
    label: 'تأكيد استلام الطلب', group: 'applicants', icon: MailCheck, system: true,
    description: 'تُرسل تلقائياً عند تقديم طلب الانضمام.',
  },
  onboarding_invite: {
    label: 'دعوة التأهيل', group: 'contributors', icon: UserPlus,
    description: 'رابط إكمال التسجيل لمساهم معتمد. تُرسل تلقائياً عند الاعتماد.',
    fields: [
      { key: 'link',      label: 'رابط التأهيل', type: 'url',  required: true, placeholder: 'https://...' },
      { key: 'expiresIn', label: 'مدة الصلاحية', type: 'text', placeholder: '7 أيام' },
    ],
  },
  custom_message: {
    label: 'رسالة حرة', group: 'contributors', icon: PenLine, free: true,
    description: 'تكتب الموضوع والنص بنفسك، في الإطار المعتاد.',
    fields: [],
  },
  beta_invite: {
    label: 'دعوة النسخة التجريبية', group: 'general', icon: FlaskConical,
    description: 'وصول مبكر إلى النسخة التجريبية.',
    fields: [{ key: 'link', label: 'رابط الوصول', type: 'url', required: true, placeholder: 'https://...' }],
  },
  magic_link: {
    label: 'رابط الدخول', group: 'general', icon: KeyRound,
    description: 'رابط دخول مباشر بلا كلمة مرور.',
    fields: [
      { key: 'link',      label: 'رابط الدخول',  type: 'url',  required: true, placeholder: 'https://...' },
      { key: 'expiresIn', label: 'مدة الصلاحية', type: 'text', placeholder: '24 ساعة' },
    ],
  },
  notice: {
    label: 'إشعار من المنصة', icon: BellRing, system: true,
    description: 'ملخصات يومية وتنبيهات الإصدارات والاعتراضات.',
  },
  lesson_reviewed: {
    label: 'نتيجة مراجعة درس', icon: BookCheck, system: true,
    description: 'تصل كاتب الدرس عند اعتماده أو إعادته.',
  },
};

export const TEMPLATE_GROUPS = [
  { id: 'applicants',   label: 'للمتقدمين' },
  { id: 'contributors', label: 'للمساهمين' },
  { id: 'general',      label: 'عامة' },
];

export function templateLabel(key) {
  return TEMPLATE_META[key]?.label || key;
}

// ─── Delivery state ───────────────────────────────────────────────────────────
// `status` is what the provider said on hand-over; `delivery` arrives later
// from the Resend webhook and wins.

const DELIVERY = {
  delivered:  { label: 'وصلت',          tone: 'success' },
  delayed:    { label: 'تأخر التسليم',  tone: 'warn' },
  bounced:    { label: 'ارتدّت',         tone: 'danger' },
  complained: { label: 'بلاغ إزعاج',    tone: 'danger' },
  failed:     { label: 'فشل التسليم',   tone: 'danger' },
};

export function deliveryState(log) {
  if (log.status === 'failed') return { label: 'لم تُرسل', tone: 'danger', detail: log.error || null };
  const d = DELIVERY[log.delivery];
  if (d) return { ...d, detail: log.deliveryDetail || null };
  return { label: 'في الطريق', tone: 'neutral', detail: null };
}

// A row that needs attention: never left us, or bounced / was reported.
export function isProblem(log) {
  return log.status === 'failed' || ['bounced', 'complained', 'failed'].includes(log.delivery);
}

// ─── Live render ──────────────────────────────────────────────────────────────

/**
 * Renders the template on the server (the same code that sends it), debounced.
 * Returns the last answer: { ok, subject?, html?, error?, defaults } or null.
 */
export function useTemplatePreview(template, data, subject) {
  const [preview, setPreview] = useState(null);
  const key = JSON.stringify({ template, data, subject });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/email/preview', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: key,
        });
        const json = await res.json();
        if (!cancelled) setPreview(json);
      } catch {
        if (!cancelled) setPreview({ ok: false, error: 'تعذّر تحميل المعاينة', defaults: null });
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [key]);

  return preview;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

/**
 * Subject and body of a message. `subject` / `body` are the admin's edits, or
 * null to follow `defaults`; `onChange({ subject?, body? })` sets them (null
 * restores the default). A `free` message has no defaults to fall back on.
 */
export function MessageEditor({ defaults, subject, body, onChange, free = false, rows = 7 }) {
  const shownSubject = subject ?? defaults?.subject ?? '';
  const shownBody    = body ?? defaults?.body ?? '';
  const edited       = !free && (subject != null || body != null);

  return (
    <div className="flex flex-col gap-4">
      <Field label="الموضوع" required={free}>
        <Input value={shownSubject} onChange={(e) => onChange({ subject: e.target.value })}
          placeholder={free ? 'إشعار هام' : undefined} />
      </Field>
      <Field label="نص الرسالة" required={free}
        hint={free
          ? 'كل سطر فقرة. التحية باسم المستلم والتوقيع يُضافان تلقائياً.'
          : 'كل سطر فقرة. التحية والأزرار والروابط ثابتة في القالب ولا تتأثر بالتعديل.'}>
        <Textarea rows={rows} value={shownBody} onChange={(e) => onChange({ body: e.target.value })}
          placeholder={free ? 'اكتب رسالتك هنا…' : undefined} className="leading-relaxed" />
      </Field>
      {edited && (
        <div className="flex items-center justify-between gap-3 flex-wrap -mt-1">
          <Badge tone="accent" size="sm">معدّلة عن نص القالب</Badge>
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => onChange({ subject: null, body: null })}>
            استعادة النص الأصلي
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Preview ──────────────────────────────────────────────────────────────────

const WIDTHS = [
  { id: 'wide',   label: 'حاسوب' },
  { id: 'narrow', label: 'هاتف' },
];

/** The envelope and the rendered email, in a sandboxed frame. */
export function PreviewPane({ to, preview, emptyText = 'أكمل الحقول المطلوبة لتظهر المعاينة.', height = 'h-[560px]' }) {
  const [width, setWidth] = useState('wide');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <dl className="flex flex-col gap-1 t-ui min-w-0 flex-1">
          <div className="flex gap-3 min-w-0">
            <dt className="w-16 shrink-0 text-fg-subtle">إلى</dt>
            <dd className="min-w-0 break-all text-fg">{to ? <span dir="ltr">{to}</span> : '—'}</dd>
          </div>
          <div className="flex gap-3 min-w-0">
            <dt className="w-16 shrink-0 text-fg-subtle">الموضوع</dt>
            <dd className="min-w-0 break-words text-fg-strong font-semibold">{preview?.ok ? preview.subject : '—'}</dd>
          </div>
        </dl>
        <Segmented size="sm" label="عرض المعاينة" items={WIDTHS} value={width} onChange={setWidth} />
      </div>
      <div className="rounded-card border border-line bg-sunken p-2 flex justify-center">
        {preview?.ok ? (
          <iframe
            title="معاينة البريد"
            sandbox=""
            srcDoc={preview.html}
            className={`${height} rounded-control bg-page transition-all duration-fast ${width === 'narrow' ? 'w-[375px] max-w-full' : 'w-full'}`}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-center px-6">
            <p className="t-body text-fg-subtle">{preview ? emptyText : 'جارٍ تحميل المعاينة…'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
