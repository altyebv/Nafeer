// ─── Fill-in-the-blank questions ──────────────────────────────────────────────
// How Basheer asks one (FillBlankCard.kt): the sentence has one gap, two or more
// underscores, and the student taps a word from `options` to fill it. Grading
// compares the word with `correctAnswer` (or `acceptedAnswers`), so the right
// word must be in the bank exactly. With no bank the student writes the answer
// and judges it against the model one (isSelfGraded in AnswerKeys.kt).
//
// The app shows the words in the order they are stored, without mixing them.
// So the editor takes the right word and the wrong ones, and places the right
// word itself: at a spot that depends on the words, so it is not always first
// and does not move between saves of the same question.

const GAP = /_{2,}/g;

const clean = (w) => String(w ?? '').trim();

/** How many gaps the sentence has; the app fills the first and shows any other as written. */
export const gapCount = (text) => (String(text ?? '').match(GAP) || []).length;

/** The wrong words of a stored bank: every word but the first that is the answer. */
export function wrongWords(options, answer) {
  const words = Array.isArray(options) ? options : [];
  const right = clean(answer);
  let skipped = false;
  return words.filter((w) => {
    if (!skipped && right && clean(w) === right) { skipped = true; return false; }
    return true;
  });
}

function spotFor(seed, slots) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h % slots;
}

/**
 * The bank as the app shows it: the wrong words in the author's order, blanks
 * and repeats dropped, with the right word placed among them. [] without a
 * right word or without any wrong word: a bank of one word asks nothing.
 */
export function wordBank(answer, wrong) {
  const right = clean(answer);
  const seen = new Set([right]);
  const others = (wrong || []).map(clean).filter((w) => w && !seen.has(w) && seen.add(w));
  if (!right || others.length === 0) return [];
  const at = spotFor(`${right}|${others.join('|')}`, others.length + 1);
  return [...others.slice(0, at), right, ...others.slice(at)];
}
