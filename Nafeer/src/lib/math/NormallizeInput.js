/**
 * normalizeMathInput.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight pre-processing step that converts raw Arabic math notation into
 * macro-based LaTeX before KaTeX sees it.
 *
 * CMS path  : src/lib/math/normalizeMathInput.js
 * App mirror: assets/katex/katex_host.html  (inlined — keep in sync)
 *
 * Examples:
 *   'نها(س)'     → '\nha (س)'
 *   'د(س + ص)'  → '\dfn (س + ص)'
 *   '\nha س'    → '\nha س'   ← already normalized, passes through unchanged
 *
 * Rules derived automatically from ARABIC_OPERATORS (normalize: true only).
 * Longer strings are matched before shorter ones — no partial-match collisions.
 * Idempotent: running the function twice on the same string is safe.
 *
 * Intentional limitations (keep simple until a parser is needed):
 *   - Single-letter Arabic variables (س، ص، ت) are NOT auto-replaced.
 *     They are too short to distinguish from prose text safely.
 *     Use the explicit macros (\sen, \sad, \tat) in LaTeX input instead.
 *   - Content already inside \operatorname{} is not re-processed because
 *     the regex uses a negative lookbehind (?<!\\) to skip escaped contexts.
 */
import { ARABIC_OPERATORS } from './KatexConfig.js';

/**
 * Normalization rules, built once at module load time.
 * Sorted longest-first to prevent shorter patterns clobbering longer ones
 * (e.g. 'نها' must be matched before a hypothetical single-char rule for 'ن').
 */
const NORMALIZE_RULES = ARABIC_OPERATORS
  .filter(op => op.normalize && op.arabic)
  .sort((a, b) => b.arabic.length - a.arabic.length)
  .map(op => ({
    /**
     * Negative lookbehind (?<!\\) skips Arabic text that is already part
     * of a LaTeX command (e.g. inside \operatorname{نها}).
     * The 'u' flag enables full Unicode matching.
     */
    pattern:     new RegExp(`(?<!\\\\)${op.arabic}`, 'gu'),
    replacement: `${op.macro} `,
    // Trailing space ensures the macro is separated from any following argument,
    // e.g. 'نها(س)' → '\nha (س)' which KaTeX parses as \nha{} followed by (س).
  }));

/**
 * normalizeMathInput(input)
 *
 * @param  {string} input — raw LaTeX, possibly containing Arabic operator text
 * @returns {string}       — LaTeX with Arabic operators replaced by macros
 */
export function normalizeMathInput(input) {
  if (!input || typeof input !== 'string') return input ?? '';

  let result = input;

  for (const { pattern, replacement } of NORMALIZE_RULES) {
    result = result.replace(pattern, replacement);
  }

  return result;
}