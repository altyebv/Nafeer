/**
 * renderMath.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates the full Arabic-first math rendering pipeline:
 *   1. normalizeMathInput  — Arabic text → macro calls
 *   2. katex.render        — LaTeX → KaTeX HTML DOM
 *   3. postProcessMath     — RTL DOM fixes
 *
 * CMS path: src/lib/math/renderMath.js
 *
 * This is the only function FormulaPreview.jsx (and any other CMS component)
 * needs to import. The three underlying modules are implementation details.
 */
import { getKatexConfig }    from './KatexConfig.js';
import { normalizeMathInput } from './normalizeMathInput.js';
import { postProcessMath }    from './PostProcessMath.js';

/**
 * renderMath(expression, element, overrides?)
 *
 * @param {string}  expression       — raw LaTeX (may contain Arabic operators)
 * @param {Element} element          — DOM element to render into (cleared first)
 * @param {object}  [overrides={}]   — optional KaTeX option overrides,
 *                                     e.g. { displayMode: false }
 * @returns {Promise<void>}           — resolves after render + post-processing
 *
 * Error handling:
 *   On a KaTeX parse error, the element receives:
 *     - data-error="true"
 *     - textContent = first line of the error message in Arabic context
 *   No exception is thrown — the caller never needs a try/catch.
 *
 * Example (FormulaPreview):
 *   await renderMath('\\nha_{x \\to 0} \\dfn(\\sen)', el, { displayMode: true });
 *
 * Example (inline override):
 *   await renderMath('\\frac{س}{ص}', el, { displayMode: false });
 */
export async function renderMath(expression, element, overrides = {}) {
  const { default: katex } = await import('katex');

  const normalized = normalizeMathInput(expression);
  const config     = { ...getKatexConfig(), ...overrides };

  try {
    katex.render(normalized, element, config);
    element.dataset.error = '';
    postProcessMath(element);
  } catch (err) {
    element.dataset.error   = 'true';
    element.textContent     = err.message?.split('\n')[0] ?? 'خطأ في الصياغة';
  }
}