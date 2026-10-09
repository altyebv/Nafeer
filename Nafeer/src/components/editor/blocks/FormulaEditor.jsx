'use client';
import { useState, useRef, useCallback, useMemo } from 'react';
import { CircleAlert, CircleHelp } from 'lucide-react';
import FormulaPreview from '@/components/editor/shared/FormulaPreview';
import { MATH_NOTATION } from '@/shared/curriculum';
import { useMathNotation } from '@/components/editor/shared/MathNotationContext';

// ─── Palette ───────────────────────────────────────────────────────────────────
// Every snippet is ordinary LaTeX. In a subject with Arabic notation the chips
// and the preview show it the way the student will see it (x → س, \lim → نها),
// so there is nothing Arabic to type or remember.
const PALETTE = {
  'أساسيات': [
    '\\frac{a}{b}', 'x^{2}', 'x^{n}', 'x_{1}', '\\sqrt{x}', '\\sqrt[3]{x}',
    '\\left( x \\right)', '\\left| x \\right|',
    '\\pm', '\\times', '\\div', '\\cdot', '\\leq', '\\geq', '\\neq', '\\approx', '\\infty',
  ],
  'تفاضل وتكامل': [
    '\\lim_{x \\to a} f(x)', "f'(x)", '\\frac{dy}{dx}', '\\frac{d}{dx}', '\\frac{d^2y}{dx^2}',
    '\\int f(x)\\,dx', '\\int_{a}^{b} f(x)\\,dx', '\\sum_{i=1}^{n} x_i', '\\to',
  ],
  'مثلثات': [
    '\\sin x', '\\cos x', '\\tan x', '\\sec x', '\\csc x', '\\cot x',
    '\\sin^2 x + \\cos^2 x = 1', '30^\\circ', '\\theta', '\\pi',
  ],
  'احتمالات وعدّ': [
    '\\fact{n}', '\\perm{n}{r}', '\\comb{n}{r}',
    '\\Pr(A)', '\\Pr(A \\cup B)', '\\Pr(A \\cap B)', "\\Pr(A')",
    '\\{1, 2, 3\\}', '\\in', '\\notin', '\\subset',
  ],
  'مصفوفات وفترات': [
    '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
    '\\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix}',
    '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
    ']a, b[', '[a, b]', '\\R', '\\R - \\{0\\}',
  ],
  'يونانية': [
    '\\alpha', '\\beta', '\\gamma', '\\delta', '\\theta', '\\lambda', '\\mu', '\\pi',
    '\\sigma', '\\phi', '\\omega', '\\rho', '\\epsilon', '\\Delta', '\\Sigma', '\\Omega',
  ],
  'فيزياء': [
    'F = ma', 'v = \\frac{d}{t}', 'E_k = \\frac{1}{2}mv^2', 'E_p = mgh', 'P = \\frac{W}{t}',
    'v^2 = u^2 + 2as', 'F = \\frac{kq_1 q_2}{r^2}', 'V = IR', 'v = f\\lambda',
    '\\vec{F}', '\\rho = \\frac{m}{V}', 'Q = mc\\Delta T',
  ],
  'كيمياء': [
    '\\mathrm{H_2O}', '\\mathrm{CO_2}', '\\mathrm{H_2SO_4}', '\\mathrm{NaCl}',
    '\\mathrm{Ca^{2+}}', '\\mathrm{Cl^{-}}', '\\rightarrow', '\\rightleftharpoons',
    '2\\mathrm{H_2} + \\mathrm{O_2} \\rightarrow 2\\mathrm{H_2O}',
    '{}^{12}_{6}\\mathrm{C}', '[\\mathrm{H^+}]', '\\mathrm{C}_n\\mathrm{H}_{2n+2}',
  ],
  'نص ورموز لاتينية': [
    '\\text{صفر}', '\\latin{cm}', '\\ltr{E = mc^2}',
  ],
};

// Subjects with Latin notation are the sciences — lead with their tabs.
const TAB_ORDER = {
  [MATH_NOTATION.ARABIC]: ['أساسيات', 'تفاضل وتكامل', 'مثلثات', 'احتمالات وعدّ', 'مصفوفات وفترات', 'يونانية', 'نص ورموز لاتينية'],
  [MATH_NOTATION.LATIN]:  ['أساسيات', 'فيزياء', 'كيمياء', 'يونانية', 'تفاضل وتكامل', 'مثلثات', 'احتمالات وعدّ', 'مصفوفات وفترات'],
};

const HELP = {
  [MATH_NOTATION.ARABIC]: [
    ['اكتب LaTeX عادياً بالحروف اللاتينية', 'f(x) = x^2', 'يظهر للطالب بالترميز العربي تلقائياً'],
    ['كلمة عربية داخل المعادلة', '\\text{صفر}', 'ضعها دائماً داخل \\text'],
    ['حرف عربي غير موجود في الجدول', 'م = \\int_a^b f(x)\\,dx', 'اكتبه مباشرة بالعربية'],
    ['رمز أو وحدة تبقى لاتينية', '5\\,\\latin{cm}', 'استخدم \\latin'],
  ],
  [MATH_NOTATION.LATIN]: [
    ['اكتب LaTeX عادياً', 'E_k = \\frac{1}{2}mv^2', 'يظهر للطالب كما هو، من اليسار لليمين'],
    ['رموز العناصر الكيميائية', '\\mathrm{H_2O}', 'ضعها داخل \\mathrm لتظهر قائمة لا مائلة'],
    ['كلمة عربية داخل المعادلة', '\\text{ثابت}', 'ضعها داخل \\text'],
  ],
};

// ─── FormulaEditor ─────────────────────────────────────────────────────────────
// Authoring widget for a formula: a FORMULA block, or an inline formula inside
// a text field (see MathTextarea).
//
// Props:
//   value     {string}  — the LaTeX source
//   onChange  {fn}      — called with the new LaTeX source
//   notation  {string}  — 'ARABIC' or 'LATIN'. Defaults to the subject's notation
//                         from MathNotationContext.
//   inline    {boolean} — preview at inline size, as it will sit inside a sentence
//   autoFocus {boolean}

export default function FormulaEditor({
  value     = '',
  onChange,
  notation: notationProp,
  inline    = false,
  autoFocus = false,
}) {
  const contextNotation = useMathNotation();
  const notation = notationProp ?? contextNotation;
  const tabs = TAB_ORDER[notation] ?? TAB_ORDER[MATH_NOTATION.LATIN];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [error,     setError]     = useState(null);
  const [showHelp,  setShowHelp]  = useState(false);
  const textareaRef = useRef(null);
  // Tracks the last snippet inserted via palette so smart-delete can remove it whole.
  // Shape: { text: string, endPos: number } | null
  const lastSnippet = useRef(null);

  const isArabic = notation === MATH_NOTATION.ARABIC;
  const chips    = useMemo(() => PALETTE[tabs.includes(activeTab) ? activeTab : tabs[0]], [activeTab, tabs]);
  const emit     = useCallback((latex) => onChange?.(latex), [onChange]);

  // Insert snippet at cursor position (or replace selection)
  const insertSnippet = useCallback((snippet) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    // Keep two snippets from fusing into one command name (\pi\theta is fine, \pix is not).
    const glue  = start > 0 && /[A-Za-z]$/.test(value.slice(0, start)) && /^[A-Za-z0-9]/.test(snippet) ? ' ' : '';
    const text  = glue + snippet;
    lastSnippet.current = { text, endPos: start + text.length };
    emit(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }, [value, emit]);

  // Smart delete: if the cursor sits right after a palette snippet and the text
  // still matches, Backspace removes the whole snippet.
  const handleKeyDown = useCallback((e) => {
    // Navigation / modifier keys — don't touch snippet tracking
    if (
      e.key.startsWith('Arrow') ||
      e.key === 'Home' || e.key === 'End' ||
      e.key === 'PageUp' || e.key === 'PageDown' ||
      e.key === 'Shift' || e.key === 'Control' ||
      e.key === 'Alt' || e.key === 'Meta' ||
      e.key === 'CapsLock' || e.key === 'Tab' ||
      e.ctrlKey || e.metaKey
    ) return;

    if (e.key !== 'Backspace') {
      lastSnippet.current = null;
      return;
    }

    const el     = e.currentTarget;
    const cursor = el.selectionStart;

    if (cursor !== el.selectionEnd || !lastSnippet.current) {
      lastSnippet.current = null;
      return;
    }

    const { text, endPos } = lastSnippet.current;
    lastSnippet.current = null;

    if (cursor === endPos && value.slice(cursor - text.length, cursor) === text) {
      e.preventDefault();
      const deleteFrom = cursor - text.length;
      emit(value.slice(0, deleteFrom) + value.slice(cursor));
      requestAnimationFrame(() => el.setSelectionRange(deleteFrom, deleteFrom));
    }
  }, [value, emit]);

  const hasValue = value.trim().length > 0;

  return (
    <div className="rounded-xl border border-ink-800 bg-ink-950 overflow-hidden text-sm" dir="rtl">

      {/* ── Preview — what the student sees ─────────────────────────────────── */}
      <div className="px-3 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-2xs text-ink-500 font-arabic">كما يراها الطالب</p>
          <span
            className={[
              'px-2 py-0.5 rounded-full border text-2xs font-arabic',
              isArabic ? 'bg-warn-surface border-warn-border text-warn' : 'bg-info-surface border-info-border text-info',
            ].join(' ')}
            title={isArabic
              ? 'هذه المادة تُعرض معادلاتها بالترميز العربي من اليمين لليسار'
              : 'هذه المادة تُعرض معادلاتها بالترميز اللاتيني من اليسار لليمين'}
          >
            {isArabic ? 'ترميز عربي' : 'ترميز لاتيني'}
          </span>
        </div>

        <div
          className={[
            'rounded-lg border flex items-center justify-center min-h-[96px] px-4 py-4 overflow-x-auto transition-colors',
            error ? 'border-danger-border bg-danger-surface' : 'border-ink-800 bg-ink-900',
          ].join(' ')}
        >
          {hasValue ? (
            <FormulaPreview
              latex={value}
              displayMode={!inline}
              notation={notation}
              onError={setError}
              className={['peer text-sand-100', inline ? 'text-lg' : 'text-xl', error ? 'opacity-40' : ''].join(' ')}
            />
          ) : (
            <span className="text-ink-600 text-xs font-arabic">اكتب المعادلة أو اختر من الرموز بالأسفل</span>
          )}
          {/* Nothing valid has been typed yet, so there is no last good render to keep */}
          {hasValue && error && (
            <span className="hidden peer-empty:inline text-danger text-xs font-arabic">أكمل الصياغة لتظهر المعادلة</span>
          )}
        </div>

        {/* Reserved height — the layout does not jump as errors come and go */}
        <div className="min-h-[22px] mt-1 flex items-start gap-1.5" role="status" aria-live="polite">
          {hasValue && error && (
            <>
              <CircleAlert size={13} strokeWidth={1.9} className="text-danger shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-2xs text-danger font-arabic">الصياغة غير مكتملة — المعاينة تعرض آخر صيغة صحيحة.</p>
                <p className="text-2xs text-danger font-mono opacity-80 break-words" dir="ltr">{error}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── LaTeX source ────────────────────────────────────────────────────── */}
      <div className="px-3 pb-3">
        <label className="block text-2xs text-ink-500 font-arabic mb-1.5">
          المعادلة بصيغة LaTeX
        </label>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => emit(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={() => { lastSnippet.current = null; }}
          autoFocus={autoFocus}
          dir="ltr"
          rows={inline ? 2 : 3}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={isArabic ? '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1' : 'E_k = \\frac{1}{2} m v^2'}
          className="w-full px-3 py-2 bg-ink-900 border border-ink-800 rounded-lg text-sand-100 font-mono text-[13px] leading-relaxed resize-y focus:ring-1 focus:ring-sand-700 focus:border-sand-700 focus:outline-none placeholder-ink-600 hover:border-ink-700 transition-colors"
          style={{ unicodeBidi: 'plaintext' }}
        />
      </div>

      {/* ── Palette ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-ink-800 bg-ink-900">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-ink-800" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'shrink-0 px-3 py-2 text-2xs font-arabic transition-colors whitespace-nowrap border-b-2',
                activeTab === tab
                  ? 'border-sand-600 text-sand-300'
                  : 'border-transparent text-ink-500 hover:text-ink-300',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 p-2.5">
          {chips.map((latex) => (
            <button
              key={latex}
              type="button"
              title={latex}
              aria-label={`إدراج ${latex}`}
              onClick={() => insertSnippet(latex)}
              className="min-w-[40px] min-h-[36px] inline-flex items-center justify-center px-2.5 py-1 rounded-md border border-ink-800 bg-ink-950 text-sand-200 hover:border-sand-700 hover:bg-ink-800 transition-colors"
            >
              <FormulaPreview latex={latex} displayMode={false} notation={notation} className="text-[13px] pointer-events-none" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Help ────────────────────────────────────────────────────────────── */}
      <div className="border-t border-ink-800">
        <button
          type="button"
          onClick={() => setShowHelp((open) => !open)}
          aria-expanded={showHelp}
          className="w-full flex items-center gap-1.5 px-3 py-2 text-2xs text-ink-500 hover:text-ink-300 font-arabic transition-colors"
        >
          <CircleHelp size={13} strokeWidth={1.9} />
          {showHelp ? 'إخفاء طريقة الكتابة' : 'طريقة الكتابة'}
        </button>

        {showHelp && (
          <ul className="px-3 pb-3 space-y-2">
            {HELP[notation].map(([title, example, note]) => (
              <li key={example} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-center">
                <div>
                  <p className="text-2xs text-sand-200 font-arabic">{title}</p>
                  <p className="text-2xs text-ink-500 font-arabic">{note}</p>
                </div>
                <div className="flex items-center gap-2 justify-self-start sm:justify-self-end">
                  <code className="font-mono text-2xs text-ink-300 bg-ink-900 border border-ink-800 px-1.5 py-0.5 rounded" dir="ltr">
                    {example}
                  </code>
                  <span className="text-ink-600">←</span>
                  <FormulaPreview latex={example} displayMode={false} notation={notation} className="text-[13px] text-sand-200" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
