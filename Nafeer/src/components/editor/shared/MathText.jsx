'use client';
import FormulaPreview from '@/components/editor/shared/FormulaPreview';
import { splitInlineMath } from '@/lib/math/ArabicMath.js';

// ─── MathText ──────────────────────────────────────────────────────────────────
// Renders a text field's content with its inline formulas typeset:
//   مشتقة الدالة $f(x) = x^2$ هي $2x$
// Text without dollar signs comes out unchanged, so this is safe to use for any
// text a contributor writes.
//
// Props:
//   text      {string} — the raw field content
//   notation  {string} — 'ARABIC' or 'LATIN'. Defaults to the subject's notation
//                        from MathNotationContext.

export default function MathText({ text = '', notation }) {
  const segments = splitInlineMath(text);
  if (segments.length === 1 && segments[0].type === 'text') return segments[0].value;

  return segments.map((segment, i) =>
    segment.type === 'math' ? (
      <FormulaPreview
        key={i}
        latex={segment.value}
        displayMode={false}
        notation={notation}
        className="mx-0.5"
      />
    ) : (
      <span key={i}>{segment.value}</span>
    )
  );
}
