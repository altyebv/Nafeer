'use client';
import { useState } from 'react';
import { Modal }    from '../ui/modal';
import { Btn }      from '../ui/Btn';

const CATEGORIES = [
  { id: 'content',     label: 'محتوى تعليمي', icon: '◈', subs: ['متخصص مادة', 'كاتب دروس', 'مناهج'] },
  { id: 'development', label: 'تطوير',         icon: '⬡', subs: ['باك إند', 'موبايل', 'فرونت إند'] },
  { id: 'design',      label: 'تصميم',         icon: '◇', subs: ['واجهات', 'رسوم توضيحية'] },
];

const DEFAULT_Q = { text: '', placeholder: '', minChars: 80 };

function inputStyle(extra = '') {
  return `w-full px-3 py-2 rounded-lg text-sm font-arabic transition-colors bg-ink-800/60 border border-ink-700/50 text-ink-200 placeholder-ink-700 focus:outline-none focus:border-sand-700/60 ${extra}`;
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-arabic text-ink-400">
        {label}
        {hint && <span className="mr-2 text-ink-700">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function QuestionRow({ q, idx, total, onChange, onRemove, onMove }) {
  return (
    <div className="p-3 rounded-xl bg-ink-800/40 border border-ink-800/80 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-ink-700 shrink-0 w-5 text-center">{idx + 1}</span>
        <div className="flex-1" />
        <button
          onClick={() => onMove(idx, -1)}
          disabled={idx === 0}
          className="text-[11px] text-ink-700 hover:text-ink-400 disabled:opacity-30 transition-colors px-1"
          title="تحريك لأعلى"
        >↑</button>
        <button
          onClick={() => onMove(idx, 1)}
          disabled={idx === total - 1}
          className="text-[11px] text-ink-700 hover:text-ink-400 disabled:opacity-30 transition-colors px-1"
          title="تحريك لأسفل"
        >↓</button>
        <button
          onClick={() => onRemove(idx)}
          className="text-[11px] text-red-700 hover:text-red-400 transition-colors px-1"
          title="حذف السؤال"
        >✕</button>
      </div>

      {/* Question text */}
      <textarea
        rows={2}
        value={q.text}
        onChange={(e) => onChange(idx, 'text', e.target.value)}
        placeholder="نص السؤال..."
        className={inputStyle('resize-none leading-relaxed')}
      />

      <div className="grid grid-cols-2 gap-2">
        {/* Placeholder */}
        <input
          type="text"
          value={q.placeholder}
          onChange={(e) => onChange(idx, 'placeholder', e.target.value)}
          placeholder="نص التلميح (اختياري)"
          className={inputStyle()}
        />
        {/* MinChars */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={10}
            max={500}
            value={q.minChars}
            onChange={(e) => onChange(idx, 'minChars', Number(e.target.value))}
            className={inputStyle('w-20')}
          />
          <span className="text-[11px] font-mono text-ink-700 shrink-0">حرف على الأقل</span>
        </div>
      </div>
    </div>
  );
}

export function RoleModal({ role = null, onClose, onSaved }) {
  const isEdit = !!role;

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const [name,        setName]        = useState(role?.name        || '');
  const [category,    setCategory]    = useState(role?.category    || '');
  const [subcategory, setSubcategory] = useState(role?.subcategory || '');
  const [description, setDescription] = useState(role?.description || '');
  const [isActive,    setIsActive]    = useState(role?.isActive    !== false);
  const [questions,   setQuestions]   = useState(
    role?.interviewQuestions?.length > 0
      ? role.interviewQuestions.map((q) => ({ text: q.text, placeholder: q.placeholder || '', minChars: q.minChars ?? 80 }))
      : [{ ...DEFAULT_Q }]
  );
  const [microTask,     setMicroTask]     = useState(role?.microTask?.prompt    || '');
  const [microMinChars, setMicroMinChars] = useState(role?.microTask?.minChars  ?? 80);

  // ── Question list helpers ───────────────────────────────────────────────────
  const addQuestion = () => setQuestions((qs) => [...qs, { ...DEFAULT_Q }]);

  const removeQuestion = (idx) =>
    setQuestions((qs) => qs.filter((_, i) => i !== idx));

  const updateQuestion = (idx, field, val) =>
    setQuestions((qs) => qs.map((q, i) => i === idx ? { ...q, [field]: val } : q));

  const moveQuestion = (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= questions.length) return;
    setQuestions((qs) => {
      const arr = [...qs];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!name.trim()) { setError('اسم الدور مطلوب'); return; }
    if (!category)    { setError('الفئة مطلوبة');      return; }

    setSaving(true);
    setError('');

    const payload = {
      name:               name.trim(),
      category,
      subcategory:        subcategory.trim(),
      description:        description.trim(),
      isActive,
      interviewQuestions: questions
        .filter((q) => q.text.trim())
        .map((q, i) => ({ ...q, order: i })),
      microTask: { prompt: microTask.trim(), minChars: microMinChars },
    };

    try {
      const url    = isEdit ? `/api/admin/roles/${role._id}` : '/api/admin/roles';
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'حدث خطأ'); setSaving(false); return; }
      onSaved(data.role);
    } catch {
      setError('تعذّر الاتصال بالخادم');
      setSaving(false);
    }
  };

  const activeCat = CATEGORIES.find((c) => c.id === category);

  return (
    <Modal title={isEdit ? `تعديل: ${role.name}` : 'دور جديد'} onClose={onClose}>
      {/* Make modal wider + scrollable */}
      <div className="space-y-5 max-h-[72vh] overflow-y-auto pl-1 -mr-1">

        {error && (
          <p className="text-xs text-red-400 font-arabic px-3 py-2 rounded-lg bg-red-950/30 border border-red-900/40">
            {error}
          </p>
        )}

        {/* Name */}
        <Field label="اسم الدور *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: متخصص فيزياء"
            className={inputStyle()}
          />
        </Field>

        {/* Category */}
        <Field label="الفئة *">
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setSubcategory(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-arabic border transition-all ${
                  category === cat.id
                    ? 'bg-sand-900/50 border-sand-700/60 text-sand-300'
                    : 'bg-ink-800/40 border-ink-700/50 text-ink-500 hover:text-ink-300 hover:border-ink-600/60'
                }`}
              >
                <span className="block text-base mb-0.5">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Subcategory */}
        {activeCat && (
          <Field label="التخصص الفرعي" hint="(اختياري)">
            <div className="flex gap-1.5 flex-wrap">
              {activeCat.subs.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubcategory(subcategory === sub ? '' : sub)}
                  className={`px-3 py-1 rounded-lg text-xs font-arabic border transition-all ${
                    subcategory === sub
                      ? 'bg-sand-900/40 border-sand-800/60 text-sand-400'
                      : 'bg-ink-800/40 border-ink-700/40 text-ink-600 hover:text-ink-400'
                  }`}
                >
                  {sub}
                </button>
              ))}
              <input
                type="text"
                value={activeCat.subs.includes(subcategory) ? '' : subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="أو اكتب تخصصاً..."
                className={inputStyle('flex-1 min-w-[120px]')}
              />
            </div>
          </Field>
        )}

        {/* Description */}
        <Field label="وصف مختصر" hint="(اختياري)">
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ما الذي يفعله هذا المساهم؟"
            className={inputStyle('resize-none leading-relaxed')}
          />
        </Field>

        {/* Active toggle */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-ink-800/30 border border-ink-800/60">
          <span className="text-xs font-arabic text-ink-400">الدور مفعّل</span>
          <button
            onClick={() => setIsActive((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-sand-700/60' : 'bg-ink-700/60'}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                isActive ? 'right-0.5 bg-sand-400' : 'left-0.5 bg-ink-500'
              }`}
            />
          </button>
        </div>

        {/* Interview questions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-arabic text-ink-400">أسئلة المقابلة</span>
            <button
              onClick={addQuestion}
              className="text-[11px] font-mono px-2 py-1 rounded-lg bg-ink-800/60 border border-ink-700/50 text-sand-600 hover:text-sand-400 hover:border-sand-800/60 transition-colors"
            >
              + سؤال
            </button>
          </div>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <QuestionRow
                key={i}
                q={q}
                idx={i}
                total={questions.length}
                onChange={updateQuestion}
                onRemove={removeQuestion}
                onMove={moveQuestion}
              />
            ))}
          </div>
          {questions.length === 0 && (
            <p className="text-[11px] font-arabic text-ink-700 text-center py-4 border border-dashed border-ink-800/60 rounded-lg">
              لا توجد أسئلة — ستُستخدم الأسئلة الافتراضية
            </p>
          )}
        </div>

        {/* Micro task */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-arabic text-ink-400">المهمة التطبيقية</span>
            <span className="text-[10px] font-mono text-ink-700">(اختياري)</span>
          </div>
          <textarea
            rows={3}
            value={microTask}
            onChange={(e) => setMicroTask(e.target.value)}
            placeholder="اطلب من المتقدم إنجاز مهمة صغيرة تكشف عن أسلوبه..."
            className={inputStyle('resize-none leading-relaxed mb-2')}
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={1000}
              value={microMinChars}
              onChange={(e) => setMicroMinChars(Number(e.target.value))}
              className={inputStyle('w-20')}
            />
            <span className="text-[11px] font-mono text-ink-700">حرف على الأقل</span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="flex gap-2 mt-5 pt-4 border-t border-ink-800/60">
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <Btn variant="sand" loading={saving} onClick={save}>
          {isEdit ? 'حفظ التعديلات' : 'إنشاء الدور'}
        </Btn>
      </div>
    </Modal>
  );
}
