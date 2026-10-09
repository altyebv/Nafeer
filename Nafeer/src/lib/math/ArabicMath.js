/**
 * ArabicMath.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Turns ordinary LaTeX into the notation of the Sudanese curriculum.
 *
 * Contributors write standard LaTeX for every subject, e.g. \lim_{x \to 0} f(x).
 * A subject whose mathNotation is ARABIC (see shared/curriculum.js) is typeset
 * right-to-left with Arabic letters, digits and function names; every other
 * subject gets stock KaTeX.
 *
 * Two things produce the Arabic notation:
 *   1. A curriculum table: function names become Arabic through KaTeX macros;
 *      single letters and digits are swapped on the rendered glyphs. Arabic
 *      letters typed directly pass through untouched.
 *   2. One layout rule: the whole formula is mirrored, then every letter and
 *      digit is mirrored back. Exponents land on the left; roots, integrals,
 *      brackets and arrows flip; matrix columns run right to left.
 *
 * Escapes for contributors:
 *   \latin{...}  keep Latin letters and digits inside an Arabic formula
 *   \ltr{...}    left-to-right island, left untouched
 *   \text{...}   Arabic words and their spaces — math mode drops spaces, and
 *                two bare Arabic letters are treated as two variables
 *
 * App mirror: Basheer's assets/katex/katex_host.html inlines sections 1–4 as
 * plain var/function declarations. Change one, change the other.
 */

// ── 1. Curriculum table ──────────────────────────────────────────────────────
// Function names, expanded by KaTeX as macros.
export const ARABIC_FUNCTIONS = {
  // Calculus — the limit always sits under the stretched name
  '\\lim':  '\\operatorname*{نهـــا}\\limits',
  // Trigonometry
  '\\sin':  '\\operatorname{جا}',
  '\\cos':  '\\operatorname{جتا}',
  '\\tan':  '\\operatorname{ظا}',
  '\\sec':  '\\operatorname{قا}',
  '\\csc':  '\\operatorname{قتا}',
  '\\cot':  '\\operatorname{ظتا}',
  // Probability, sets
  '\\Pr':   '\\operatorname{ح}',
  '\\R':    '\\text{ح}',
  // Factorial in corner notation: \fact{7}
  '\\fact': '\\underline{\\vert\\,#1\\,}',
  // Counting: \perm{n}{r} التباديل, \comb{n}{r} التوافيق
  '\\perm': '{}^{#1}\\text{ل}_{#2}',
  '\\comb': '{}^{#1}\\text{ق}_{#2}',
};

// The same macros for subjects that keep Latin notation, so a formula
// written once renders under either.
export const LATIN_FUNCTIONS = {
  '\\R':    '\\mathbb{R}',
  '\\fact': '#1!',
  '\\perm': '{}^{#1}P_{#2}',
  '\\comb': '{}^{#1}C_{#2}',
};

// Single letters, swapped on the rendered glyphs (math italics only, so
// \text{}, \mathrm{} and \latin{} are left alone). A letter that is not
// listed stays Latin.
export const ARABIC_LETTERS = {
  x: 'س', y: 'ص', z: 'ع', n: 'ن', t: 'ن', r: 'ر',
  f: 'د', g: 'هـ', h: 'هـ', d: 'د', u: 'ع', v: 'ل', i: 'ت',
  a: 'أ', b: 'ب', c: 'جـ', C: 'ث',
  A: 'أ', B: 'ب', L: 'ل',
};

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

// ── 2. getKatexConfig() ──────────────────────────────────────────────────────
export function getKatexConfig(arabic) {
  const functions = arabic ? ARABIC_FUNCTIONS : LATIN_FUNCTIONS;
  const macros = {
    '\\N': '\\mathbb{N}',
    '\\Z': '\\mathbb{Z}',
    '\\Q': '\\mathbb{Q}',
    '\\latin': '\\htmlClass{bsh-latin}{#1}',
    '\\ltr':   '\\htmlClass{bsh-ltr}{#1}',
    // Shorthands from the first version of the pipeline
    '\\nha': '\\lim',
    '\\dfn': '\\operatorname{د}',
    '\\sen': 'س', '\\sad': 'ص', '\\tat': 'ت', '\\nun': 'ن',
  };
  for (const name in functions) macros[name] = functions[name];
  return {
    output:       'html',
    throwOnError: false,
    strict:       false,
    // \htmlClass only — it carries the \latin and \ltr markers
    trust:        (context) => context.command === '\\htmlClass',
    macros,
  };
}

// ── 3. localizeGlyphs() ──────────────────────────────────────────────────────
// Walks the rendered text nodes: swaps digits and letters, and un-mirrors
// every glyph that has to read the right way round in the mirrored formula.

const ARABIC_RANGE  = /[\u0600-\u06FF]/;
// Letters and digits: Latin, Greek, Arabic, letterlike symbols (ℝ, ℕ…)
const READS_ONE_WAY = /[0-9A-Za-z\u00C0-\u024F\u0370-\u03FF\u0600-\u06FF\u2100-\u214F]/;
// A run of Arabic letters (tatweel excluded, so جـ counts as one letter)
const ARABIC_RUN    = /[\u0621-\u063A\u0641-\u064A]+/g;
const LETTER_GAP    = '\u200A';   // hair space: separate letters, never a word
const ARABIC_FONT   = "'Amiri','Cairo','Noto Naskh Arabic',serif";

function toArabicDigits(text) {
  return text.replace(/[0-9]/g, (d) => ARABIC_DIGITS.charAt(+d)).replace(/,/g, '،');
}

function toArabicLetters(text) {
  const out = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    out.push(Object.prototype.hasOwnProperty.call(ARABIC_LETTERS, ch) ? ARABIC_LETTERS[ch] : ch);
  }
  return out.join(LETTER_GAP);
}

function unmirror(el) {
  el.style.display     = 'inline-block';
  el.style.transform   = 'scaleX(-1)';
  el.style.unicodeBidi = 'isolate';
}

function localizeGlyphs(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodes  = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const el = node.parentElement;
    let text = node.nodeValue;
    if (!el || !READS_ONE_WAY.test(text)) continue;
    if (el.closest('.bsh-ltr')) continue;          // island, already upright

    if (!el.closest('.bsh-latin')) {
      text = toArabicDigits(text);
      if (el.classList.contains('mathnormal')) {
        text = toArabicLetters(text);
      } else if (!el.closest('.text, .mop')) {
        // Two Arabic letters side by side are two variables (دس, ب ص);
        // a longer run is a word typed without \text{} and stays joined.
        text = text.replace(ARABIC_RUN, (run) =>
          run.length === 2 ? run.charAt(0) + LETTER_GAP + run.charAt(1) : run);
      }
      node.nodeValue = text;
    }

    unmirror(el);
    if (ARABIC_RANGE.test(text)) {
      el.style.fontFamily    = ARABIC_FONT;
      el.style.fontStyle     = 'normal';
      el.style.letterSpacing = '0';
    }
  }
}

// ── 4. mirrorLayout() + postProcessMath() ────────────────────────────────────
// All mutations are inline styles, so the result survives being serialised to
// innerHTML (which is how the app moves it between its two WebViews).

function mirrorLayout(root) {
  // KaTeX does not pin its own direction: inside RTL text the browser would
  // reorder its boxes first. Lay out left-to-right, then mirror once.
  for (const el of root.querySelectorAll('.katex')) {
    el.style.direction   = 'ltr';
    el.style.unicodeBidi = 'isolate';
  }
  for (const el of root.querySelectorAll('.katex-html')) {
    el.style.display   = 'inline-block';
    el.style.transform = 'scaleX(-1)';
    el.style.textAlign = 'left';   // wrapped lines end up right-aligned
  }
  // \ltr{...} islands are mirrored back as a whole
  for (const el of root.querySelectorAll('.bsh-ltr')) unmirror(el);
}

export function postProcessMath(rootElement) {
  if (!rootElement) return;
  mirrorLayout(rootElement);
  localizeGlyphs(rootElement);
}

// ── 5. Inline formulas inside text ───────────────────────────────────────────
// Any text field may carry formulas between dollar signs:
//   مشتقة الدالة $f(x) = x^2$ هي $2x$
// A literal dollar sign is written \$.

const INLINE_MATH = /(?<!\\)\$([^$\n]+?)(?<!\\)\$/g;

/** True when [text] contains at least one $...$ formula. */
export function hasInlineMath(text) {
  INLINE_MATH.lastIndex = 0;
  return typeof text === 'string' && INLINE_MATH.test(text);
}

/**
 * Splits [text] into plain and formula segments, in order.
 * @returns {{ type: 'text' | 'math', value: string }[]}
 */
export function splitInlineMath(text) {
  if (typeof text !== 'string' || !text) return [];
  const segments = [];
  const plain = (s) => { if (s) segments.push({ type: 'text', value: s.replace(/\\\$/g, '$') }); };
  let last = 0;
  INLINE_MATH.lastIndex = 0;
  for (let m = INLINE_MATH.exec(text); m; m = INLINE_MATH.exec(text)) {
    plain(text.slice(last, m.index));
    segments.push({ type: 'math', value: m[1].trim() });
    last = m.index + m[0].length;
  }
  plain(text.slice(last));
  return segments;
}

/**
 * The $...$ formula that contains position [index] of [text], if any — lets an
 * editor reopen the formula under the cursor instead of inserting a new one.
 * @returns {{ start: number, end: number, latex: string } | null}
 */
export function findInlineMathAt(text, index) {
  if (typeof text !== 'string') return null;
  INLINE_MATH.lastIndex = 0;
  for (let m = INLINE_MATH.exec(text); m; m = INLINE_MATH.exec(text)) {
    const end = m.index + m[0].length;
    if (index >= m.index && index <= end) return { start: m.index, end, latex: m[1].trim() };
  }
  return null;
}
