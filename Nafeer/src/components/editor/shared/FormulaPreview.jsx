'use client';
import { useEffect, useRef } from 'react';
// KaTeX stylesheet must be imported alongside the JS — without it all
// rendered math spans have no styles and appear invisible.
import 'katex/dist/katex.min.css';
import { renderMath } from '@/lib/math/RenderMath.js';
import { useMathNotation } from '@/components/editor/shared/MathNotationContext';

// ─── FormulaPreview ────────────────────────────────────────────────────────────
// Typesets one formula exactly as the Android app will (see lib/math/ArabicMath.js).
//
// Props:
//   latex       {string}   — LaTeX source
//   displayMode {boolean}  — true = block/centred equation (default)
//                            false = inline, fits within surrounding text
//   notation    {string}   — 'ARABIC' or 'LATIN'. Defaults to the subject's notation
//                            from MathNotationContext.
//   onError     {fn}       — called with KaTeX's message, or null when the source is
//                            valid. When given, a broken source keeps the last good
//                            render on screen (so a preview does not blink while the
//                            contributor is mid-keystroke); without it the raw source
//                            is shown instead.
//   className   {string}   — extra classes on the wrapper span

export default function FormulaPreview({
  latex       = '',
  displayMode = true,
  notation: notationProp,
  onError,
  className   = '',
}) {
  const contextNotation = useMathNotation();
  const notation        = notationProp ?? contextNotation;
  const ref        = useRef(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!latex.trim()) {
      el.replaceChildren();
      el.dataset.error = '';
      onErrorRef.current?.(null);
      return;
    }

    let cancelled = false;
    // Render off-screen, then swap in — a failed render never clears the preview.
    const target = document.createElement('span');

    renderMath(latex, target, { displayMode, notation })
      .then((error) => {
        if (cancelled || !ref.current) return;
        if (!error) {
          ref.current.replaceChildren(...target.childNodes);
        } else if (!onErrorRef.current) {
          ref.current.textContent = latex;
        }
        ref.current.dataset.error = error ? 'true' : '';
        onErrorRef.current?.(error);
      })
      .catch(() => {
        // Only an unexpected module-load failure lands here.
        if (!cancelled && ref.current) ref.current.textContent = latex;
      });

    return () => { cancelled = true; };
  }, [latex, displayMode, notation]);

  return (
    <span
      ref={ref}
      // KaTeX does not pin its own direction, and the CMS is an RTL page:
      // without this the browser reorders the formula's boxes.
      dir="ltr"
      style={{ unicodeBidi: 'isolate' }}
      className={[
        'formula-preview',
        displayMode ? 'block text-center' : 'inline-block align-middle',
        className,
      ].filter(Boolean).join(' ')}
      data-display={displayMode ? 'block' : 'inline'}
    />
  );
}
