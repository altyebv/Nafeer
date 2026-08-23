'use client';
import { useState, useId } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ── Question type config ───────────────────────────────────────────────────── */
const QUESTION_TYPES = [
  { value: 'YES_NO',          label: 'نعم / لا',        icon: '◑', hint: 'سؤال ثنائي الإجابة' },
  { value: 'RATING',          label: 'تقييم (1–5)',      icon: '★', hint: 'نجوم أو أرقام' },
  { value: 'NPS',             label: 'NPS (0–10)',       icon: '◎', hint: 'مؤشر الترشيح' },
  { value: 'FREE_FORM',       label: 'إجابة حرة',        icon: '✎', hint: 'نص مفتوح' },
  { value: 'MULTIPLE_CHOICE', label: 'اختيار متعدد',    icon: '◈', hint: 'خيارات محددة مسبقاً' },
];

const makeQuestion = () => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  type: 'YES_NO',
  text: '',
  choices: ['', ''],   // for MULTIPLE_CHOICE
  minLabel: '',        // for RATING / NPS
  maxLabel: '',        // for RATING / NPS
});

const EMPTY_FORM = {
  title: '',
  description: '',
  allowSkip: true,
  autoPresent: true,
  expiresAt: '',
  segmentUserIds: '',
  segmentStudentPaths: '',
  segmentMinVersionCode: '',
};

/* ── Main modal ─────────────────────────────────────────────────────────────── */
export function CreateSurveyModal({ onClose, onCreated }) {
  const [form, setForm]           = useState(EMPTY_FORM);
  const [questions, setQuestions] = useState([makeQuestion()]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  /* dnd-kit sensors */
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      setQuestions((qs) => {
        const from = qs.findIndex((q) => q.id === active.id);
        const to   = qs.findIndex((q) => q.id === over.id);
        return arrayMove(qs, from, to);
      });
    }
  };

  const addQuestion = () => setQuestions((qs) => [...qs, makeQuestion()]);

  const removeQuestion = (id) =>
    setQuestions((qs) => qs.length > 1 ? qs.filter((q) => q.id !== id) : qs);

  const updateQuestion = (id, patch) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  /* Validate & submit */
  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError('عنوان الاستطلاع مطلوب');
      return;
    }
    for (const q of questions) {
      if (!q.text.trim()) {
        setError('يجب ملء نص جميع الأسئلة');
        return;
      }
      if (q.type === 'MULTIPLE_CHOICE') {
        const filled = q.choices.filter((c) => c.trim());
        if (filled.length < 2) {
          setError(`سؤال "${q.text}" يحتاج خيارَين على الأقل`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Serialise questions — strip UI-only empty choice slots
      const serialised = questions.map(({ id, type, text, choices, minLabel, maxLabel }) => {
        const base = { id, type, text: text.trim() };
        if (type === 'MULTIPLE_CHOICE') {
          base.choices = choices.map((c) => c.trim()).filter(Boolean);
        }
        if (type === 'RATING' || type === 'NPS') {
          if (minLabel.trim()) base.minLabel = minLabel.trim();
          if (maxLabel.trim()) base.maxLabel = maxLabel.trim();
        }
        return base;
      });

      const res = await fetch('/api/admin/comms/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:        form.title.trim(),
          description:  form.description.trim() || null,
          questions:    serialised,
          allowSkip:    form.allowSkip,
          autoPresent:  form.autoPresent,
          expiresAt:    form.expiresAt || null,
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        dir="rtl"
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-ink-900 border border-ink-700/60 rounded-2xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-ink-800/60 shrink-0">
          <div>
            <h2 className="text-lg font-arabic font-semibold text-sand-200">استطلاع جديد</h2>
            <p className="text-xs text-ink-500 font-mono mt-0.5">SURVEY</p>
          </div>
          <button onClick={onClose} className="text-ink-600 hover:text-ink-300 text-xl leading-none transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 flex-1">

          {/* Title + description */}
          <div className="space-y-3">
            <Field label="عنوان الاستطلاع" required>
              <input
                value={form.title}
                onChange={(e) => setF('title', e.target.value)}
                placeholder="عنوان الاستطلاع..."
                className={inputCls}
              />
            </Field>
            <Field label="وصف مختصر" hint="اختياري">
              <textarea
                value={form.description}
                onChange={(e) => setF('description', e.target.value)}
                placeholder="سيُعرض تحت العنوان للمستخدم..."
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>

          {/* Behaviour toggles */}
          <div className="grid grid-cols-2 gap-3">
            <ToggleRow
              label="السماح بالتخطي"
              hint="allowSkip"
              value={form.allowSkip}
              onChange={(v) => setF('allowSkip', v)}
            />
            <ToggleRow
              label="عرض تلقائي"
              hint="autoPresent"
              value={form.autoPresent}
              onChange={(v) => setF('autoPresent', v)}
            />
          </div>

          {/* ── Question builder ────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-ink-500 font-mono uppercase tracking-wider">
                الأسئلة — {questions.length}
              </p>
              <button
                onClick={addQuestion}
                className="flex items-center gap-1.5 text-xs font-arabic px-3 py-1.5 rounded-lg bg-sand-900/40 hover:bg-sand-900/70 border border-sand-800/50 text-sand-400 hover:text-sand-300 transition-all"
              >
                <span className="text-base leading-none">+</span>
                إضافة سؤال
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <SortableQuestion
                      key={q.id}
                      question={q}
                      index={idx}
                      total={questions.length}
                      onChange={(patch) => updateQuestion(q.id, patch)}
                      onRemove={() => removeQuestion(q.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Expiry */}
          <Field label="تاريخ الانتهاء" hint="اختياري">
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setF('expiresAt', e.target.value)}
              className={`${inputCls} [color-scheme:dark]`}
              dir="ltr"
            />
          </Field>

          {/* Segment */}
          <div className="space-y-3">
            <p className="text-xs text-ink-500 font-mono uppercase tracking-wider">الاستهداف — اتركها فارغة للجميع</p>
            <Field label="معرّفات المستخدمين" hint="مفصولة بفاصلة">
              <input value={form.segmentUserIds} onChange={(e) => setF('segmentUserIds', e.target.value)}
                placeholder="uid1, uid2" className={inputCls} dir="ltr" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="مسارات الطالب">
                <input value={form.segmentStudentPaths} onChange={(e) => setF('segmentStudentPaths', e.target.value)}
                  placeholder="math/grade7" className={inputCls} dir="ltr" />
              </Field>
              <Field label="الحد الأدنى للإصدار">
                <input type="number" value={form.segmentMinVersionCode}
                  onChange={(e) => setF('segmentMinVersionCode', e.target.value)}
                  placeholder="42" className={inputCls} dir="ltr" />
              </Field>
            </div>
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
          <button onClick={onClose} className="px-4 py-2 text-sm text-ink-500 hover:text-ink-300 font-arabic transition-colors">
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-arabic font-medium bg-sand-700/30 hover:bg-sand-700/50 border border-sand-700/50 text-sand-300 hover:text-sand-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '…جارٍ النشر' : 'نشر الاستطلاع'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sortable question card ─────────────────────────────────────────────────── */
function SortableQuestion({ question, index, total, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex:  isDragging ? 10 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-ink-800/40 border border-ink-700/40 rounded-xl overflow-hidden"
    >
      {/* Question header row */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-ink-600 hover:text-ink-400 cursor-grab active:cursor-grabbing touch-none shrink-0 text-base"
          title="اسحب لإعادة الترتيب"
        >
          ⋮⋮
        </button>

        {/* Index badge */}
        <span className="text-2xs font-mono text-ink-600 shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Type selector */}
        <select
          value={question.type}
          onChange={(e) => onChange({ type: e.target.value, choices: ['', ''], minLabel: '', maxLabel: '' })}
          className="flex-1 bg-ink-900/60 border border-ink-700/40 rounded-lg px-2.5 py-1.5 text-xs text-ink-300 font-arabic focus:outline-none focus:border-sand-700/50 transition-colors"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>

        {/* Remove */}
        {total > 1 && (
          <button
            onClick={onRemove}
            className="text-ink-700 hover:text-red-400 text-sm transition-colors shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {/* Question text */}
      <div className="px-3 pb-3">
        <input
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="نص السؤال..."
          className={`${inputCls} text-sm mb-3`}
        />

        {/* Type-specific fields */}
        <TypeFields question={question} onChange={onChange} />
      </div>
    </div>
  );
}

/* ── Per-type field panels ──────────────────────────────────────────────────── */
function TypeFields({ question, onChange }) {
  const { type } = question;

  if (type === 'YES_NO') {
    return (
      <div className="flex gap-2">
        {['نعم', 'لا'].map((lbl) => (
          <span key={lbl} className="flex-1 text-center py-1.5 rounded-lg border border-ink-700/40 text-xs text-ink-500 bg-ink-900/30">
            {lbl}
          </span>
        ))}
      </div>
    );
  }

  if (type === 'RATING') {
    return (
      <div className="space-y-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="flex-1 text-center py-1.5 rounded-lg border border-ink-700/40 text-xs text-sand-600 bg-ink-900/30">
              {'★'.repeat(n)}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={question.minLabel} onChange={(e) => onChange({ minLabel: e.target.value })}
            placeholder="تسمية الحد الأدنى" className={`${inputCls} text-xs`} />
          <input value={question.maxLabel} onChange={(e) => onChange({ maxLabel: e.target.value })}
            placeholder="تسمية الحد الأعلى" className={`${inputCls} text-xs`} />
        </div>
      </div>
    );
  }

  if (type === 'NPS') {
    return (
      <div className="space-y-2">
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className="w-7 text-center py-1 rounded border border-ink-700/40 text-2xs text-ink-500 bg-ink-900/30">
              {i}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={question.minLabel} onChange={(e) => onChange({ minLabel: e.target.value })}
            placeholder="غير محتمل أبداً" className={`${inputCls} text-xs`} />
          <input value={question.maxLabel} onChange={(e) => onChange({ maxLabel: e.target.value })}
            placeholder="محتمل جداً" className={`${inputCls} text-xs`} />
        </div>
      </div>
    );
  }

  if (type === 'FREE_FORM') {
    return (
      <div className="py-1.5 px-3 rounded-lg border border-ink-700/40 bg-ink-900/30 text-xs text-ink-600 font-arabic">
        ✎ سيُعرض للمستخدم حقل نص حر
      </div>
    );
  }

  if (type === 'MULTIPLE_CHOICE') {
    const choices = question.choices ?? ['', ''];

    const setChoice = (i, val) => {
      const next = [...choices];
      next[i] = val;
      onChange({ choices: next });
    };

    const addChoice = () => onChange({ choices: [...choices, ''] });

    const removeChoice = (i) => {
      if (choices.length <= 2) return;
      onChange({ choices: choices.filter((_, idx) => idx !== i) });
    };

    return (
      <div className="space-y-2">
        {choices.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-2xs font-mono text-ink-600 w-4 shrink-0">{i + 1}</span>
            <input
              value={c}
              onChange={(e) => setChoice(i, e.target.value)}
              placeholder={`الخيار ${i + 1}`}
              className={`${inputCls} text-xs flex-1`}
            />
            {choices.length > 2 && (
              <button onClick={() => removeChoice(i)} className="text-ink-700 hover:text-red-400 text-xs transition-colors">
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addChoice}
          className="text-xs text-ink-500 hover:text-sand-400 font-arabic transition-colors flex items-center gap-1"
        >
          <span>+</span> إضافة خيار
        </button>
      </div>
    );
  }

  return null;
}

/* ── Shared helpers ─────────────────────────────────────────────────────────── */
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

function ToggleRow({ label, hint, value, onChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-ink-800/40 border border-ink-700/40">
      <div>
        <p className="text-sm text-ink-200 font-arabic">{label}</p>
        {hint && <p className="text-2xs text-ink-600 font-mono mt-0.5">{hint}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}