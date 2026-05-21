'use client';
import { useState } from 'react';

const EMPTY = {
  title: '',
  body: '',
  imageUrl: '',
  ctaLabel: '',
  ctaDeepLink: '',
  showBanner: false,
  expiresAt: '',
  segmentUserIds: '',       // comma-separated input → array on submit
  segmentStudentPaths: '',  // comma-separated input → array on submit
  segmentMinVersionCode: '',
};

export function CreateAnnouncementModal({ onClose, onCreated }) {
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim() || !form.body.trim()) {
      setError('العنوان والمحتوى مطلوبان');
      return;
    }
    // CTA fields must both be filled or both empty
    const hasCtaLabel = form.ctaLabel.trim();
    const hasCtaLink  = form.ctaDeepLink.trim();
    if (Boolean(hasCtaLabel) !== Boolean(hasCtaLink)) {
      setError('يجب ملء عنوان الزر والرابط معاً أو تركهما فارغَين');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/comms/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:     form.title.trim(),
          body:      form.body.trim(),
          imageUrl:  form.imageUrl.trim() || null,
          ctaLabel:  form.ctaLabel.trim()  || null,
          ctaDeepLink: form.ctaDeepLink.trim() || null,
          showBanner: form.showBanner,
          expiresAt:  form.expiresAt || null,
          segmentUserIds: form.segmentUserIds
            ? form.segmentUserIds.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          segmentStudentPaths: form.segmentStudentPaths
            ? form.segmentStudentPaths.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          segmentMinVersionCode: form.segmentMinVersionCode
            ? Number(form.segmentMinVersionCode)
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإنشاء');
      onCreated?.(data);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        dir="rtl"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-ink-900 border border-ink-700/60 rounded-2xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-ink-800/60 shrink-0">
          <div>
            <h2 className="text-lg font-arabic font-semibold text-sand-200">إعلان جديد</h2>
            <p className="text-xs text-ink-500 font-mono mt-0.5">ANNOUNCEMENT</p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-600 hover:text-ink-300 text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 flex-1">

          {/* Title */}
          <Field label="العنوان" required>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="عنوان الإعلان..."
              className={inputCls}
            />
          </Field>

          {/* Body */}
          <Field label="المحتوى" required>
            <textarea
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder="نص الإعلان..."
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Image URL */}
          <Field label="رابط الصورة" hint="اختياري — URL لصورة الإعلان">
            <input
              value={form.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
              placeholder="https://..."
              className={inputCls}
              dir="ltr"
            />
          </Field>

          {/* CTA row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="نص الزر" hint="اختياري">
              <input
                value={form.ctaLabel}
                onChange={(e) => set('ctaLabel', e.target.value)}
                placeholder="ابدأ الآن"
                className={inputCls}
              />
            </Field>
            <Field label="رابط الزر (Deep-link)" hint="اختياري">
              <input
                value={form.ctaDeepLink}
                onChange={(e) => set('ctaDeepLink', e.target.value)}
                placeholder="nafeer://..."
                className={inputCls}
                dir="ltr"
              />
            </Field>
          </div>

          {/* showBanner toggle */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-ink-800/40 border border-ink-700/40">
            <div>
              <p className="text-sm text-ink-200 font-arabic">إظهار كـ Banner</p>
              <p className="text-xs text-ink-500 mt-0.5">يعرض الإعلان في شريط أعلى الشاشة</p>
            </div>
            <Toggle value={form.showBanner} onChange={(v) => set('showBanner', v)} />
          </div>

          {/* Expiry */}
          <Field label="تاريخ الانتهاء" hint="اختياري — يُخفى الإعلان تلقائياً بعده">
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => set('expiresAt', e.target.value)}
              className={`${inputCls} [color-scheme:dark]`}
              dir="ltr"
            />
          </Field>

          {/* Segment */}
          <div className="space-y-3">
            <p className="text-xs text-ink-500 font-mono uppercase tracking-wider">الاستهداف — اتركها فارغة للجميع</p>

            <Field label="معرّفات المستخدمين" hint="مفصولة بفاصلة">
              <input
                value={form.segmentUserIds}
                onChange={(e) => set('segmentUserIds', e.target.value)}
                placeholder="uid1, uid2, uid3"
                className={inputCls}
                dir="ltr"
              />
            </Field>

            <Field label="مسارات الطالب" hint="مفصولة بفاصلة — مثال: math/grade7">
              <input
                value={form.segmentStudentPaths}
                onChange={(e) => set('segmentStudentPaths', e.target.value)}
                placeholder="math/grade7, science/grade8"
                className={inputCls}
                dir="ltr"
              />
            </Field>

            <Field label="الحد الأدنى لإصدار التطبيق" hint="رقم — مثال: 42">
              <input
                type="number"
                value={form.segmentMinVersionCode}
                onChange={(e) => set('segmentMinVersionCode', e.target.value)}
                placeholder="42"
                className={inputCls}
                dir="ltr"
              />
            </Field>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-2.5 font-arabic">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ink-800/60 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-ink-500 hover:text-ink-300 font-arabic transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-arabic font-medium bg-sand-700/30 hover:bg-sand-700/50 border border-sand-700/50 text-sand-300 hover:text-sand-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '…جارٍ النشر' : 'نشر الإعلان'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── small helpers ─────────────────────────────────────────────────────────── */

const inputCls =
  'w-full bg-ink-800/60 border border-ink-700/50 rounded-xl px-3.5 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-sand-700/60 focus:bg-ink-800 transition-colors font-arabic';

function Field({ label, hint, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-ink-400 font-arabic flex items-center gap-1">
        {label}
        {required && <span className="text-amber-500">*</span>}
        {hint && <span className="text-ink-600 mr-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none ${
        value ? 'bg-sand-700/60 border-sand-600/50' : 'bg-ink-700 border-ink-600/50'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
          value ? 'translate-x-1' : 'translate-x-5'
        }`}
      />
    </button>
  );
}