/**
 * postProcessMath.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DOM traversal layer that fixes RTL-related visual issues after KaTeX renders.
 *
 * CMS path  : src/lib/math/postProcessMath.js
 * App mirror: assets/katex/katex_host.html  (inlined — keep in sync)
 *
 * Design principles:
 *   - Surgical: targets specific KaTeX DOM classes, no global RTL flip.
 *   - Safe: each fixer guards against double-processing via data-rtl-fixed.
 *   - Composable: each fix is a standalone named function, easy to test solo.
 *   - Extensible: registerMathFixer() lets callers add fixes without forking.
 *
 * ─── Adding a new RTL fix ─────────────────────────────────────────────────────
 * 1. Write a function  fixYourThing(root) { ... }  following the pattern below.
 * 2. Call it inside postProcessMath(), OR register it via registerMathFixer().
 *    Use registerMathFixer() for fixes that are context-specific (e.g. only
 *    needed on a certain page) — it keeps this file clean.
 */

/** Matches any Arabic/Arabic-Extended Unicode character. */
const ARABIC_RANGE = /[\u0600-\u06FF]/;

// ─── Fix 1: Square root direction ────────────────────────────────────────────
//
// KaTeX renders √ on the left side of the radicand (LTR convention).
// In Arabic math, the surd belongs on the right.
//
// Strategy:
//   a. Flip the entire .sqrt container with scaleX(-1)
//      → surd moves to the right, radicand content is now mirrored.
//   b. Counter-flip the radicand's content node only
//      → radicand text is readable again.
//   c. The .svg-align span (which holds the surd SVG) is intentionally left
//      flipped — the √ path reads naturally when mirrored.
//
// KaTeX .sqrt DOM structure (v0.16.x):
//   .sqrt
//     .vlist-t.vlist-t2
//       .vlist-r
//         .vlist
//           span[0]   ← [pstrut + radicand]   ← we counter-flip this span's child
//           .svg-align  ← surd SVG             ← leave flipped
//         .vlist-s
//       .vlist-r  ← height spacer
//
function fixSquareRoots(root) {
  root.querySelectorAll('.sqrt').forEach((sqrtEl) => {
    if (sqrtEl.dataset.rtlFixed) return;
    sqrtEl.dataset.rtlFixed = '1';

    // (a) Flip the shell
    sqrtEl.style.transform = 'scaleX(-1)';
    sqrtEl.style.display   = 'inline-block';

    // (b) Counter-flip the radicand content
    const vlist = sqrtEl.querySelector('.vlist');
    if (!vlist) return;

    for (const child of vlist.children) {
      if (child.classList.contains('svg-align')) continue; // (c) leave the surd

      // child = span containing [pstrut, <radicand-content>]
      // We want the content node (not the pstrut sizing element)
      const content = child.querySelector(':not(.pstrut)');
      if (content) {
        content.style.transform = 'scaleX(-1)';
        content.style.display   = 'inline-block';
      }
    }
  });
}

// ─── Fix 2: Superscript / subscript positioning ───────────────────────────────
//
// Problem: when a parent element carries direction:rtl (as we set on formula
// wrappers), KaTeX's .msupsub internal LTR absolute-positioning can be
// disrupted by the Unicode Bidi algorithm, causing exponents to shift left
// instead of appearing above-right of the base character.
//
// Fix: isolate .msupsub from the outer bidi context so its internal LTR
// layout is preserved regardless of parent direction.
//
function fixSuperscripts(root) {
  root.querySelectorAll('.msupsub').forEach((el) => {
    if (el.dataset.rtlFixed) return;
    el.dataset.rtlFixed = '1';

    el.style.unicodeBidi = 'isolate'; // modern spec; isolates bidi context
    el.style.direction   = 'ltr';    // internal KaTeX layout is always LTR
  });
}

// ─── Fix 3: Arabic operator font and spacing ──────────────────────────────────
//
// Problem: KaTeX wraps operator text in .mop spans and may apply letter-spacing
// tuned for Latin. Arabic ligatures and spacing look wrong with letter-spacing,
// and the default math font (KaTeX_Math) has no Arabic glyphs — the browser
// falls back to an arbitrary system font, often one without proper Arabic shaping.
//
// Fix: for .mop spans containing Arabic characters, explicitly set a proper
// Arabic font stack and zero out letter-spacing.
//
function fixOperators(root) {
  root.querySelectorAll('.mop').forEach((el) => {
    if (el.dataset.rtlFixed) return;
    if (!ARABIC_RANGE.test(el.textContent)) return;
    el.dataset.rtlFixed = '1';

    // Arabic-capable font stack: Amiri for academic elegance,
    // Cairo/Noto as widely available fallbacks.
    el.style.fontFamily    = "'Amiri', 'Cairo', 'Noto Naskh Arabic', serif";
    el.style.letterSpacing = '0';
    el.style.display       = 'inline-block';
  });
}

// ─── Extension registry ───────────────────────────────────────────────────────

/** @type {Array<function(Element): void>} */
const _customFixers = [];

/**
 * registerMathFixer(fixerFn)
 *
 * Register an additional post-processor to run after the built-in fixes.
 * Useful for context-specific fixes (e.g. fractions in a specific feature)
 * without touching this file.
 *
 * @param {function(Element): void} fixerFn — receives the root element
 *
 * Example:
 *   import { registerMathFixer } from '@/lib/math/postProcessMath';
 *   registerMathFixer((root) => {
 *     root.querySelectorAll('.mfrac').forEach(el => { ... });
 *   });
 */
export function registerMathFixer(fixerFn) {
  _customFixers.push(fixerFn);
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * postProcessMath(rootElement)
 *
 * Apply all RTL fixes to a KaTeX-rendered DOM subtree.
 * Safe to call multiple times — each fixer is guarded by data-rtl-fixed.
 * Runs synchronously (no async work).
 *
 * @param {Element} rootElement — DOM element KaTeX rendered into
 */
export function postProcessMath(rootElement) {
  if (!rootElement) return;

  fixSquareRoots(rootElement);
  fixSuperscripts(rootElement);
  fixOperators(rootElement);

  for (const fn of _customFixers) {
    fn(rootElement);
  }
}