// ─── Word diff ────────────────────────────────────────────────────────────────
// Marks the words that differ between two short texts, for the conflict view.
// Longest-common-subsequence over word tokens; whitespace stays attached to
// the token before it so the output re-joins to the original text exactly.
// Inputs past MAX_CELLS skip highlighting rather than stall the editor.

const MAX_CELLS = 160_000;

const tokenize = (text) => String(text ?? '').match(/\S+\s*|\s+/g) ?? [];

// Returns { a: [{ text, changed }], b: [{ text, changed }] }, or null when
// the texts are too long to compare cheaply.
export function wordDiff(textA, textB) {
  const a = tokenize(textA);
  const b = tokenize(textB);
  if (a.length * b.length > MAX_CELLS) return null;

  const key = (t) => t.trim();
  const rows = a.length + 1;
  const cols = b.length + 1;
  const lcs = new Uint32Array(rows * cols);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i * cols + j] = key(a[i]) === key(b[j])
        ? lcs[(i + 1) * cols + j + 1] + 1
        : Math.max(lcs[(i + 1) * cols + j], lcs[i * cols + j + 1]);
    }
  }

  const outA = [];
  const outB = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (key(a[i]) === key(b[j])) {
      outA.push({ text: a[i++], changed: false });
      outB.push({ text: b[j++], changed: false });
    } else if (lcs[(i + 1) * cols + j] >= lcs[i * cols + j + 1]) {
      outA.push({ text: a[i++], changed: true });
    } else {
      outB.push({ text: b[j++], changed: true });
    }
  }
  while (i < a.length) outA.push({ text: a[i++], changed: true });
  while (j < b.length) outB.push({ text: b[j++], changed: true });

  return { a: outA, b: outB };
}
