'use client';
import { useEffect, useRef } from 'react';
// KaTeX stylesheet must be imported alongside the JS — without it all
// rendered math spans have no styles and appear invisible.
import 'katex/dist/katex.min.css';

// ─── FormulaPreview ────────────────────────────────────────────────────────────
// Lightweight KaTeX renderer. Handles its own dynamic import so the heavy
// KaTeX bundle only loads when a FORMULA block is actually on screen.
//
// Props:
//   latex       {string}  — LaTeX source (block.content)
//   displayMode {boolean} — true = block/centered, false = inline (default: true)
//   rtlMath     {boolean} — wraps output in dir=rtl so Arabic expressions read
//                           right-to-left (correct term order). Note: KaTeX has
//                           no native RTL mode; this fixes inline flow direction.
//                           For left-side superscripts use {}^{n} before the var.
//   className   {string}  — extra wrapper classes

export default function FormulaPreview({
  latex        = '',
  displayMode  = true,
  rtlMath      = false,
  className    = '',
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
          macros       : {
            '\\R' : '\\mathbb{R}',
            '\\N' : '\\mathbb{N}',
            '\\Z' : '\\mathbb{Z}',
          },
        });
        el.dataset.error = '';
      } catch (err) {
        el.dataset.error = 'true';
        el.textContent = err.message?.split('\n')[0] ?? 'خطأ في الصياغة';
      }
    }).catch(() => {
      if (!cancelled && ref.current) {
        ref.current.textContent = latex;
      }
    });

    return () => { cancelled = true; };
  }, [latex, displayMode]);

  return (
    <span
      ref={ref}
      // dir is intentionally NOT set here — the rtlMath wrapper below controls
      // direction so that KaTeX's internal LTR absolute-positioning is unaffected
      // while the inline flow of terms reads RTL.
      className={[
        'formula-preview',
        displayMode ? 'block text-center' : 'inline',
        // When rtlMath: flip inline flow so term order matches Arabic reading direction
        rtlMath ? '[direction:rtl]' : '',
        className,
      ].filter(Boolean).join(' ')}
      data-display={displayMode ? 'block' : 'inline'}
    />
  );
}