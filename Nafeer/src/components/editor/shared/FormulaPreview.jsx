'use client';
import { useEffect, useRef } from 'react';
// KaTeX stylesheet must be imported alongside the JS — without it all
// rendered math spans have no styles and appear invisible.
import 'katex/dist/katex.min.css';
import { renderMath } from '@/lib/math/RenderMath.js';

// ─── FormulaPreview ────────────────────────────────────────────────────────────
// Lightweight KaTeX renderer using the shared Arabic math pipeline:
//   normalizeMathInput → katex.render (with Arabic macros) → postProcessMath
//
// Props:
//   latex       {string}  — LaTeX source (block.content). May contain raw
//                           Arabic operators like 'نها' — normalization handles
//                           the conversion automatically.
//   displayMode {boolean} — true = block/centred equation (default)
//                           false = inline, fits within surrounding text
//   rtlMath     {boolean} — sets direction:rtl on the wrapper so Arabic term
//                           order reads right-to-left. KaTeX's internal LTR
//                           absolute-positioning is unaffected because
//                           postProcessMath isolates .msupsub from bidi.
//   className   {string}  — extra Tailwind/CSS classes on the wrapper span

export default function FormulaPreview({
  latex       = '',
  displayMode = true,
  rtlMath     = false,
  className   = '',
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    if (!latex.trim()) {
      el.textContent = '';
      return;
    }

    let cancelled = false;

    renderMath(latex, el, { displayMode })
      .catch(() => {
        // renderMath handles KaTeX errors internally (sets data-error + textContent).
        // This catch only fires on an unexpected module-load failure.
        if (!cancelled && ref.current) {
          ref.current.textContent = latex;
        }
      });

    return () => { cancelled = true; };
  }, [latex, displayMode]);

  return (
    <span
      ref={ref}
      // dir is NOT set here — the rtlMath class below controls direction
      // so that KaTeX's internal LTR absolute-positioning is unaffected
      // while the inline flow of Arabic terms reads RTL.
      className={[
        'formula-preview',
        displayMode ? 'block text-center' : 'inline',
        rtlMath     ? '[direction:rtl]'   : '',
        className,
      ].filter(Boolean).join(' ')}
      data-display={displayMode ? 'block' : 'inline'}
    />
  );
}