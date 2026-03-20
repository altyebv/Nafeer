'use client';
import { useEffect, useRef } from 'react';

// ─── FormulaPreview ────────────────────────────────────────────────────────────
// Lightweight KaTeX renderer. Handles its own dynamic import so the heavy
// KaTeX bundle only loads when a FORMULA block is actually on screen.
//
// Props:
//   latex       {string}  — LaTeX source (block.content)
//   displayMode {boolean} — true = block/centered, false = inline (default: true)
//   className   {string}  — extra wrapper classes
//   errorClass  {string}  — classes applied when rendering fails

export default function FormulaPreview({
  latex        = '',
  displayMode  = true,
  className    = '',
  errorClass   = '',
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

    import('katex').then(({ default: katex }) => {
      if (cancelled || !ref.current) return;
      try {
        katex.render(latex, el, {
          displayMode,
          throwOnError : true,
          output       : 'html',
          trust        : false,
          strict       : false,
          // Allow common TeX extensions used in high-school curriculum
          macros       : {
            '\\R' : '\\mathbb{R}',
            '\\N' : '\\mathbb{N}',
            '\\Z' : '\\mathbb{Z}',
          },
        });
        // Clear any previous error state
        el.dataset.error = '';
      } catch (err) {
        el.dataset.error = 'true';
        // Show a readable error rather than raw LaTeX string
        el.textContent = err.message?.split('\n')[0] ?? 'خطأ في الصياغة';
      }
    }).catch(() => {
      // KaTeX failed to load — show raw latex as fallback
      if (!cancelled && ref.current) {
        ref.current.textContent = latex;
      }
    });

    return () => { cancelled = true; };
  }, [latex, displayMode]);

  return (
    <span
      ref={ref}
      dir="ltr"
      className={[
        'formula-preview',
        displayMode ? 'block text-center' : 'inline',
        className,
        // errorClass applied via data attr so the caller can style it
      ].filter(Boolean).join(' ')}
      data-display={displayMode ? 'block' : 'inline'}
    />
  );
}