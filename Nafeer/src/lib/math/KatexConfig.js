/**
 * katexConfig.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all KaTeX configuration used across the CMS and
 * the Android app.
 *
 * CMS path  : src/lib/math/katexConfig.js
 * App mirror: assets/katex/katex_host.html  (inlined — keep in sync)
 *
 * ─── Adding a new Arabic operator ────────────────────────────────────────────
 * Append ONE object to ARABIC_OPERATORS below. Nothing else needs to change.
 *
 * Fields:
 *   macro      {string}       LaTeX command, e.g. '\\nha'
 *   expansion  {string}       What KaTeX expands it to
 *   arabic     {string|null}  Raw Arabic text normalizeMathInput() will replace.
 *                             Set null for single-letter variables — too short
 *                             to auto-normalize safely.
 *   normalize  {boolean}      Whether normalizeMathInput() should auto-replace
 *                             the raw arabic string.
 */
export const ARABIC_OPERATORS = [
  // ── Calculus ────────────────────────────────────────────────────────────────
  {
    macro:     '\\nha',
    expansion: '\\operatorname{نها}',
    arabic:    'نها',
    normalize: true,
  },

  // ── Named functions ─────────────────────────────────────────────────────────
  {
    macro:     '\\dfn',
    expansion: '\\operatorname{د}',
    arabic:    'د',
    normalize: true,
  },

  // ── Variable shorthands ─────────────────────────────────────────────────────
  // normalize: false — single Arabic letters are too short to replace safely
  // without a parser. Use \sen, \sad, etc. explicitly in LaTeX input.
  {
    macro:     '\\sen',
    expansion: 'س',
    arabic:    null,
    normalize: false,
  },
  {
    macro:     '\\sad',
    expansion: 'ص',
    arabic:    null,
    normalize: false,
  },
  {
    macro:     '\\tat',
    expansion: 'ت',
    arabic:    null,
    normalize: false,
  },
  {
    macro:     '\\nun',
    expansion: 'ن',
    arabic:    null,
    normalize: false,
  },
];

/**
 * getKatexConfig()
 *
 * Returns the canonical KaTeX options object.
 * All Arabic macros are injected automatically from ARABIC_OPERATORS.
 *
 * output: 'html' is used for BOTH CMS and app:
 *   - CMS: rendered directly into the DOM, postProcessMath traverses the live tree.
 *   - App: rendered inside katex_host.html, postProcessMath runs there,
 *          and the resulting innerHTML (with inline RTL fixes) is returned to
 *          KatexRenderer.kt, then displayed in the FormulaBlock WebView which
 *          loads katex.min.css for correct visual rendering.
 *
 * @returns {object} KaTeX options
 */
export function getKatexConfig() {
  const macros = {
    // Standard math-set shorthands (preserved from original FormulaPreview)
    '\\R': '\\mathbb{R}',
    '\\N': '\\mathbb{N}',
    '\\Z': '\\mathbb{Z}',
    '\\Q': '\\mathbb{Q}',
  };

  for (const op of ARABIC_OPERATORS) {
    macros[op.macro] = op.expansion;
  }

  return {
    output:       'html',    // html in both targets — see note above
    throwOnError: false,     // show error in-place, never throw to the caller
    strict:       false,     // allow unknown macros without warnings
    trust:        false,
    macros,
  };
}