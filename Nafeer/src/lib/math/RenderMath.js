/**
 * RenderMath.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The one function CMS components call to typeset a formula. It runs the same
 * pipeline as the Android app (see ArabicMath.js), so what a contributor sees
 * in a preview is what a student sees in a lesson.
 */
import { getKatexConfig, postProcessMath } from './ArabicMath.js';

/**
 * renderMath(expression, element, options?)
 *
 * @param {string}  expression            — LaTeX source
 * @param {Element} element               — DOM element to render into (cleared first)
 * @param {object}  [options]
 * @param {boolean} [options.displayMode] — true = centred block equation (default),
 *                                          false = inline, sized to the surrounding text
 * @param {string}  [options.notation]    — 'ARABIC' or 'LATIN' (default), from the subject
 * @returns {Promise<string|null>}        — null on success, or the first line of
 *                                          KaTeX's error message. Never throws on bad LaTeX.
 */
export async function renderMath(expression, element, { displayMode = true, notation = 'LATIN' } = {}) {
  const { default: katex } = await import('katex');
  const arabic = notation === 'ARABIC';

  try {
    katex.render(expression, element, { ...getKatexConfig(arabic), displayMode, throwOnError: true });
    element.dataset.error = '';
    if (arabic) postProcessMath(element);
    return null;
  } catch (err) {
    element.dataset.error = 'true';
    element.textContent   = '';
    return (err?.message ?? '').split('\n')[0].replace(/^KaTeX parse error:\s*/, '') || 'خطأ في الصياغة';
  }
}
