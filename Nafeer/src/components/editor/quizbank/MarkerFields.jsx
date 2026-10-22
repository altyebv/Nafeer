'use client';
import { useState } from 'react';
import { CheckCircle2, CircleAlert, Image as ImageIcon, X } from 'lucide-react';
import ImageMarkerEditor from '@/components/editor/media/ImageMarkerEditor';
import MediaPicker from '@/components/editor/media/MediaPicker';
import { sanitiseMarkers } from '@/lib/markerUtils';
import { MARKER_SENTINEL, markerIssues } from '@/lib/markerQuestion';

// ─── MarkerFields ─────────────────────────────────────────────────────────────
// The picture part of a question (docs/question-markers.md):
//   IMAGE_MARKER  the picture, the kind (label / locate), its pins with their
//                 answers, the distractors, and a checklist of what is missing
//   FIGURE        the picture and optional reference pins (labels only)
//
// Pins are positions on one picture, so a new picture starts without them —
// after asking, when there are some.

const inputClass =
  'w-full px-3 py-2.5 bg-sunken border border-line-strong rounded-control text-fg t-ui ' +
  'focus:border-line-accent focus:outline-none placeholder:text-fg-subtle';
const labelClass = 'block t-caption text-fg-muted mb-1.5';

const KINDS = [
  { id: 'label',  title: 'تسمية العلامات', hint: 'لكل علامة مرقّمة اسم يختاره الطالب من بنك كلمات' },
  { id: 'locate', title: 'تحديد الموضع',  hint: 'يلمس الطالب مكان الشيء المطلوب على الصورة' },
];

export default function MarkerFields({ form, setForm, subjectId }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isMarker = form.type === 'IMAGE_MARKER';
  const markers  = sanitiseMarkers(form.markers);
  const mode     = isMarker ? form.markerMode || 'label' : 'reference';
  const issues   = markerIssues({ ...form, markers });

  const setImage = (imageUrl, mediaId = null) => {
    if (imageUrl === form.imageUrl) return true;
    if (markers.length && !window.confirm(`تغيير الصورة يحذف علاماتها (${markers.length}). متابعة؟`)) return false;
    setForm({ ...form, imageUrl: imageUrl || null, image: imageUrl ? { mediaId, width: null, height: null } : null, markers: [] });
    return true;
  };

  const setKind = (markerMode) => {
    if (markerMode === form.markerMode) return;
    if (markers.length && !window.confirm('تغيير النوع يحذف العلامات الحالية. متابعة؟')) return;
    setForm({ ...form, markerMode, markers: [], options: [], correctAnswer: MARKER_SENTINEL[markerMode] });
  };

  // The natural size, read when the picture loads; written only when it changes.
  const onImageSize = ({ width, height }) => {
    if (form.image?.width === width && form.image?.height === height) return;
    setForm((f) => ({ ...f, image: { mediaId: f.image?.mediaId ?? null, width, height } }));
  };

  const distractors = Array.isArray(form.options) ? form.options : [];

  return (
    <div className="space-y-4">
      {isMarker && (
        <div role="radiogroup" aria-label="نوع سؤال الصورة" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {KINDS.map((k) => {
            const active = mode === k.id;
            return (
              <button key={k.id} type="button" role="radio" aria-checked={active} onClick={() => setKind(k.id)}
                className={`rounded-card border p-3 text-start transition-colors ${
                  active ? 'border-line-accent bg-accent-wash' : 'border-line bg-sunken hover:border-line-strong'
                }`}>
                <span className={`block t-label ${active ? 'text-fg-strong' : 'text-fg'}`}>{k.title}</span>
                <span className="block t-caption text-fg-subtle mt-0.5">{k.hint}</span>
              </button>
            );
          })}
        </div>
      )}

      <div>
        <label className={labelClass}>{isMarker ? 'الصورة *' : 'الصورة'}</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPickerOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-control border border-dashed border-line-strong hover:border-line-accent text-fg-muted hover:text-fg-accent t-ui transition-colors">
            <ImageIcon size={16} strokeWidth={1.8} />
            {form.imageUrl ? 'تغيير الصورة من المكتبة' : 'اختر صورة من المكتبة'}
          </button>
          {form.imageUrl && (
            <button type="button" onClick={() => setImage(null)} aria-label="إزالة الصورة"
              className="touch-target w-10 h-10 flex items-center justify-center rounded-control border border-line text-fg-subtle hover:text-danger">
              <X size={16} />
            </button>
          )}
        </div>
        <details className="mt-1.5">
          <summary className="t-caption text-fg-subtle cursor-pointer select-none">أو أدخل رابطاً يدوياً</summary>
          {/* Applied on blur / Enter: a new address is a new picture. */}
          <input key={form.imageUrl || ''} type="url" dir="ltr" defaultValue={form.imageUrl || ''}
            onBlur={(e) => { if (!setImage(e.target.value.trim() || null)) e.target.value = form.imageUrl || ''; }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
            className={`${inputClass} mt-1.5 font-mono`} placeholder="https://..." />
        </details>
      </div>

      {form.imageUrl && (
        <div>
          <p className={labelClass}>
            {mode === 'label' && 'العلامات — ضع علامة على كل جزء واكتب اسمه الصحيح'}
            {mode === 'locate' && 'الموضع الصحيح — ضع علامة واحدة وحدّد المنطقة المقبولة حولها'}
            {mode === 'reference' && 'علامات مرقّمة يشير إليها السؤال (اختيارية)'}
          </p>
          <ImageMarkerEditor
            imageUrl={form.imageUrl}
            markers={markers}
            mode={mode}
            onImageSize={onImageSize}
            onChange={(next) => setForm((f) => ({ ...f, markers: next }))}
          />
        </div>
      )}

      {isMarker && mode === 'label' && (
        <div>
          <label className={labelClass}>خيارات مضلِّلة في بنك الكلمات (اختيارية)</label>
          <textarea
            value={distractors.join('\n')}
            onChange={(e) => setForm({ ...form, options: e.target.value ? e.target.value.split('\n') : [] })}
            className={`${inputClass} min-h-[72px] resize-y leading-7`}
            placeholder={'كلمة في كل سطر، مثل:\nالجدار الخلوي\nالبلاستيدة'}
          />
          <p className="mt-1 t-caption text-fg-subtle">
            يرى الطالب إجابات العلامات مع هذه الكلمات، مخلوطة.
          </p>
        </div>
      )}

      {isMarker && (
        <div className={`rounded-control border px-3 py-2.5 ${issues.length ? 'border-warn-border bg-warn-surface' : 'border-success-border bg-success-surface'}`}
          role="status">
          {issues.length === 0 ? (
            <p className="flex items-center gap-2 t-caption text-success">
              <CheckCircle2 size={14} /> السؤال مكتمل وجاهز للحفظ
            </p>
          ) : (
            <ul className="space-y-1">
              {issues.map((t) => (
                <li key={t} className="flex items-start gap-2 t-caption text-warn">
                  <CircleAlert size={13} className="shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pickerOpen && (
        <MediaPicker type="IMAGE" subjectId={subjectId}
          onSelect={(item) => { if (setImage(item.url, item.contentId)) setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
