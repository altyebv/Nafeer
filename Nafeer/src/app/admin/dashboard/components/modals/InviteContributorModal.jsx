'use client';
import { useState } from 'react';
import { CircleAlert, CircleCheck, Copy, Eye, EyeOff, Send } from 'lucide-react';
import { Button, Dialog, Field, Input, Select } from '@/components/ui';
import { SUBJECTS_CATALOG_REF } from '../../constants';
import { MessageEditor, PreviewPane, useTemplatePreview } from '../../mail/mailKit';
import { absoluteUrl } from '@/lib/seo';

const PREVIEW_LINK = absoluteUrl('/onboard?token=preview');

export function InviteContributorModal({ onClose, onInvited }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '' });
  const [edits, setEdits] = useState({ subject: null, body: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const preview = useTemplatePreview('onboarding_invite', {
    name: form.name.trim() || 'اسم المساهم',
    link: invite?.onboardingLink || PREVIEW_LINK,
    expiresIn: '7 أيام',
    isDirectInvite: true,
    body: edits.body ?? undefined,
  }, edits.subject ?? undefined);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/contributors/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          emailSubject: edits.subject ?? undefined,
          emailBody: edits.body ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'تعذّر إنشاء الدعوة');
        return;
      }
      setInvite(data);
      try {
        const refresh = onInvited();
        if (refresh && typeof refresh.catch === 'function') {
          refresh.catch((refreshError) => {
            console.error('[InviteContributorModal] Contributor list refresh failed', refreshError);
            setError('أُرسلت الدعوة، لكن تعذّر تحديث قائمة المساهمين. أعد تحميل الصفحة.');
          });
        }
      } catch (refreshError) {
        console.error('[InviteContributorModal] Contributor list refresh failed', refreshError);
        setError('أُرسلت الدعوة، لكن تعذّر تحديث قائمة المساهمين. أعد تحميل الصفحة.');
      }
    } catch {
      setError('تعذّر الاتصال — حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(invite.onboardingLink);
      setCopied(true);
    } catch {
      setError('تعذّر نسخ الرابط — حدّده وانسخه يدوياً');
    }
  };

  return (
    <Dialog
      open
      onClose={loading ? () => {} : onClose}
      size="lg"
      title="دعوة مساهم"
      description="أرسل رابطاً آمناً لإعداد الحساب. الرابط صالح لمدة 7 أيام."
      footer={invite ? (
        <>
          <Button variant="secondary" icon={Copy} onClick={copyLink}>{copied ? 'نُسخ الرابط' : 'نسخ الرابط'}</Button>
          <Button variant="primary" onClick={onClose}>تم</Button>
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>إلغاء</Button>
          <Button variant="primary" icon={Send} type="submit" form="invite-contributor-form" loading={loading}>
            إرسال الدعوة
          </Button>
        </>
      )}
    >
      {invite ? (
        <div className="flex flex-col gap-4">
          <div className={`flex items-start gap-3 rounded-card border p-4 ${invite.email.ok ? 'bg-success-surface border-success-border' : 'bg-warn-surface border-warn-border'}`}>
            {invite.email.ok
              ? <CircleCheck size={18} className="text-success shrink-0 mt-0.5" aria-hidden="true" />
              : <CircleAlert size={18} className="text-warn shrink-0 mt-0.5" aria-hidden="true" />}
            <div className="min-w-0">
              <p role="status" className="t-label text-fg-strong">
                {invite.email.ok ? 'أُرسلت الدعوة' : 'أُنشئت الدعوة، لكن تعذّر إرسال البريد'}
              </p>
              <p className="t-caption text-fg-muted mt-1 break-words">
                إلى <span dir="ltr">{invite.email.to}</span>
                {!invite.email.ok && ' — انسخ الرابط وأرسله يدوياً.'}
              </p>
              {invite.email.error && <p role="alert" className="t-caption text-danger mt-1 break-words">{invite.email.error}</p>}
            </div>
          </div>
          <Field label="رابط إعداد الحساب" hint="لا تشاركه إلا مع هذا المساهم.">
            <Input
              readOnly
              dir="ltr"
              value={invite.onboardingLink}
              onFocus={(e) => e.target.select()}
              className="text-left text-xs"
            />
          </Field>
          {error && <p role="alert" className="t-caption text-danger">{error}</p>}
        </div>
      ) : (
        <form id="invite-contributor-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && <p role="alert" className="t-ui text-danger">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم الكامل" required>
              <Input
                autoComplete="name"
                maxLength={80}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="البريد الإلكتروني" required>
              <Input
                type="email"
                dir="ltr"
                autoComplete="email"
                maxLength={120}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <Field label="المادة" hint="اختياري — يمكنك تعيينها لاحقاً.">
            <Select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
              <option value="">تُحدّد لاحقاً</option>
              {['COMMON', 'SCIENCE', 'LITERARY'].map((track) => (
                <optgroup key={track} label={track === 'COMMON' ? 'مشترك' : track === 'SCIENCE' ? 'علمي' : 'أدبي'}>
                  {SUBJECTS_CATALOG_REF.filter((s) => s.track === track).map((s) => (
                    <option key={s.id} value={s.id}>{s.nameAr}{s.isMajor ? ' (تخصص)' : ''}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>

          <section className="flex flex-col gap-3 border-t border-line pt-4">
            <div>
              <h3 className="t-label text-fg-strong">رسالة الدعوة</h3>
              <p className="t-caption text-fg-subtle mt-1">يمكنك تخصيص الموضوع والنص لهذه الدعوة فقط. يبقى زر إعداد الحساب وتصميم نفير ثابتين.</p>
            </div>
            <MessageEditor
              defaults={preview?.defaults}
              subject={edits.subject}
              body={edits.body}
              rows={4}
              onChange={(next) => setEdits((current) => ({ ...current, ...next }))}
            />
            <div>
              <Button size="sm" variant="ghost" icon={showPreview ? EyeOff : Eye} onClick={() => setShowPreview((value) => !value)}>
                {showPreview ? 'إخفاء المعاينة' : 'معاينة البريد'}
              </Button>
              {showPreview && (
                <div className="mt-3">
                  <PreviewPane to={form.email} preview={preview} height="h-[360px]" />
                </div>
              )}
            </div>
          </section>
        </form>
      )}
    </Dialog>
  );
}
