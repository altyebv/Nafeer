'use client';
import { useRef, useState } from 'react';
import { Sigma } from 'lucide-react';
import Modal from '@/components/editor/shared/Modal';
import MathText from '@/components/editor/shared/MathText';
import FormulaEditor from '@/components/editor/blocks/FormulaEditor';
import { findInlineMathAt, hasInlineMath } from '@/lib/math/ArabicMath.js';

// ─── MathTextarea ──────────────────────────────────────────────────────────────
// A textarea for lesson text that can carry formulas inside the sentence:
//   مشتقة الدالة $f(x) = x^2$ هي $2x$
//
// The contributor never has to type the dollar signs: the «معادلة» button opens
// the formula editor and inserts the result at the cursor. With the cursor
// inside an existing formula the button reopens that formula for editing.
// A preview appears under the field as soon as the text contains a formula.
//
// Props:
//   value, onChange(string), placeholder, autoFocus, className — as a textarea
//   notation {string} — 'ARABIC' or 'LATIN'. Defaults to the subject's notation
//                       from MathNotationContext.

export default function MathTextarea({
  value       = '',
  onChange,
  notation,
  className   = '',
  placeholder = '',
  autoFocus   = false,
}) {
  const textareaRef = useRef(null);
  // A field that was never focused has no meaningful cursor — append instead.
  const touched = useRef(false);
  // The slice of `value` the open formula editor will replace.
  const target = useRef({ start: 0, end: 0 });
  const [draft,   setDraft]   = useState('');
  const [editing, setEditing] = useState(null);   // null | 'new' | 'existing'

  const openEditor = () => {
    const el    = textareaRef.current;
    const start = touched.current ? (el?.selectionStart ?? value.length) : value.length;
    const end   = touched.current ? (el?.selectionEnd   ?? start)        : start;
    const hit   = findInlineMathAt(value, start);

    if (hit) {
      target.current = { start: hit.start, end: hit.end };
      setDraft(hit.latex);
      setEditing('existing');
    } else {
      // A selection becomes the formula's starting source.
      target.current = { start, end };
      setDraft(value.slice(start, end));
      setEditing('new');
    }
  };

  const close = () => {
    setEditing(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const confirm = () => {
    const { start, end } = target.current;
    const latex  = draft.trim();
    const insert = latex ? `$${latex}$` : '';
    onChange?.(value.slice(0, start) + insert + value.slice(end));
    setEditing(null);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + insert.length, start + insert.length);
    });
  };

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => { touched.current = true; }}
        className={className}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />

      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="button"
          onClick={openEditor}
          className="inline-flex items-center gap-1 min-h-[28px] px-2.5 py-1 rounded-md border border-ink-700 bg-ink-900 text-2xs text-ink-300 hover:text-sand-200 hover:border-sand-700 font-arabic transition-colors"
        >
          <Sigma size={13} strokeWidth={1.9} />
          معادلة
        </button>
        <span className="text-2xs text-ink-500 font-arabic">
          تُدرج داخل السطر — ضع المؤشر داخل معادلة لتعديلها
        </span>
      </div>

      {hasInlineMath(value) && (
        <div className="mt-2 rounded-lg border border-ink-800 bg-ink-900 px-3 py-2">
          <p className="text-2xs text-ink-500 font-arabic mb-1">كما يراها الطالب</p>
          <p className="text-sm text-sand-100 font-arabic leading-loose whitespace-pre-wrap">
            <MathText text={value} notation={notation} />
          </p>
        </div>
      )}

      <Modal
        isOpen={editing !== null}
        onClose={close}
        title={editing === 'existing' ? 'تعديل المعادلة' : 'معادلة داخل النص'}
        size="lg"
      >
        <FormulaEditor value={draft} onChange={setDraft} notation={notation} inline autoFocus />
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={close}
            className="px-4 py-2 rounded-lg border border-ink-700 text-xs text-ink-300 hover:text-sand-200 hover:border-ink-600 font-arabic transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={editing === 'new' && !draft.trim()}
            className="px-4 py-2 rounded-lg bg-sand-600 text-ink-950 text-xs font-arabic font-semibold hover:bg-sand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {editing === 'existing' ? (draft.trim() ? 'حفظ التعديل' : 'حذف المعادلة') : 'إدراج في النص'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
