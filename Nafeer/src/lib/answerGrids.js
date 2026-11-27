// ─── Compare and table questions ──────────────────────────────────────────────
// The shapes Basheer grades (AnswerKeys.kt), and the form the editor works on.
//
// COMPARE (CompareCard.kt)
//   options       {"item1Label": "…", "item2Label": "…", "aspects": ["…", …]}
//   correctAnswer {"comparisons": [{"first": "…", "second": "…"}, …]}, one per aspect
//   The student places each answer under its item, from a pool the app makes
//   of all the answers and mixes. Both labels are needed, and as many pairs as
//   aspects, or the app cannot mark it and the student judges it.
//
// TABLE, FILL_MISSING (TableCard.kt)
//   tableData     {"variant": "FILL_MISSING", "headers": […], "rows": [[…], …],
//                  "suggestions": […]}   — a cell holding "؟" is one to fill
//   correctAnswer [[…], …], the rows filled in, cell for cell
//   The student fills the ؟ cells from `suggestions`. The app shows the pool in
//   its stored order (it mixes it only when it has to add a missing answer), so
//   the editor mixes it, the same way every time for the same words.

export const TABLE_BLANK = '؟';

const clean = (v) => String(v ?? '').trim();

const parsed = (v) => {
  if (typeof v !== 'string') return v ?? null;
  try { return JSON.parse(v); } catch { return null; }
};
const objectOf = (v) => {
  const p = parsed(v);
  return p && typeof p === 'object' && !Array.isArray(p) ? p : null;
};

/** The same items in an order that depends only on them. */
export function stableMix(items, seed = items.join('|')) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** An answer written before these editors existed: plain text, kept so it can be copied over. */
const legacyAnswer = (answer, readable) => (readable || !clean(answer) ? null : clean(answer));

// ── Compare ──────────────────────────────────────────────────────────────────

/** The form's model: two labels and a row per aspect. */
export function compareFromQuestion(q) {
  const shape = objectOf(q?.options) || {};
  const pairs = objectOf(q?.correctAnswer)?.comparisons;
  const aspects = Array.isArray(shape.aspects) ? shape.aspects : [];
  const rows = aspects.map((aspect, i) => ({
    aspect: aspect ?? '', first: pairs?.[i]?.first ?? '', second: pairs?.[i]?.second ?? '',
  }));
  return {
    item1Label: shape.item1Label ?? '',
    item2Label: shape.item2Label ?? '',
    rows: rows.length ? rows : [{ aspect: '', first: '', second: '' }, { aspect: '', first: '', second: '' }],
    legacy: legacyAnswer(q?.correctAnswer, Array.isArray(pairs)),
  };
}

/** The fields the question saves; rows left wholly empty are dropped. */
export function compareToQuestion(model) {
  const rows = model.rows
    .map((r) => ({ aspect: clean(r.aspect), first: clean(r.first), second: clean(r.second) }))
    .filter((r) => r.aspect || r.first || r.second);
  return {
    options: { item1Label: clean(model.item1Label), item2Label: clean(model.item2Label), aspects: rows.map((r) => r.aspect) },
    correctAnswer: rows.length ? JSON.stringify({ comparisons: rows.map(({ first, second }) => ({ first, second })) }) : '',
  };
}

/** Why the app could not mark it, in words; [] when it can. */
export function compareIssues(model) {
  const issues = [];
  if (!clean(model.item1Label) || !clean(model.item2Label)) issues.push('اكتب اسمي الشيئين المقارَن بينهما.');
  const rows = model.rows.filter((r) => clean(r.aspect) || clean(r.first) || clean(r.second));
  if (rows.length === 0) issues.push('أضف وجهاً واحداً على الأقل للمقارنة.');
  if (rows.some((r) => !clean(r.aspect) || !clean(r.first) || !clean(r.second))) issues.push('املأ كل وجه: اسمه وإجابته في الجهتين.');
  return issues;
}

// ── Table ────────────────────────────────────────────────────────────────────

const BLANK_TABLE = () => ({
  headers: ['', ''],
  rows: [[{ value: '', blank: false }, { value: '', blank: true }], [{ value: '', blank: false }, { value: '', blank: true }]],
  extra: [],
});

/** The form's model: headers, cells that know whether the student fills them, and wrong suggestions. */
export function tableFromQuestion(q) {
  const data = objectOf(q?.tableData) || objectOf(q?.options);
  const grid = parsed(q?.correctAnswer);
  const gridOk = Array.isArray(grid) && grid.every(Array.isArray);
  if (!data || !Array.isArray(data.rows) || data.variant === 'MATCH_COLUMNS') {
    return { ...BLANK_TABLE(), legacy: legacyAnswer(q?.correctAnswer, gridOk) };
  }
  const rows = data.rows.map((row, r) => {
    const cells = Array.isArray(row) ? row : Array.isArray(row?.cells) ? row.cells : [];
    return cells.map((cell, c) => {
      const blank = clean(cell) === TABLE_BLANK;
      return { value: blank ? (gridOk ? grid[r]?.[c] ?? '' : '') : cell ?? '', blank };
    });
  });
  const width = Math.max(Array.isArray(data.headers) ? data.headers.length : 0, ...rows.map((r) => r.length), 1);
  const pad = (list, make) => [...list, ...Array.from({ length: width - list.length }, make)];
  // Suggestions beyond the answers the blanks need are the wrong ones.
  const needed = rows.flat().filter((c) => c.blank).map((c) => clean(c.value));
  const extra = [];
  for (const s of Array.isArray(data.suggestions) ? data.suggestions : []) {
    const at = needed.indexOf(clean(s));
    if (at >= 0) needed.splice(at, 1); else extra.push(s);
  }
  return {
    headers: pad(Array.isArray(data.headers) ? data.headers : [], () => ''),
    rows: rows.map((r) => pad(r, () => ({ value: '', blank: false }))),
    extra,
    legacy: legacyAnswer(q?.correctAnswer, gridOk),
  };
}

/** The fields the question saves; rows left wholly empty are dropped. */
export function tableToQuestion(model) {
  const rows = model.rows.filter((row) => row.some((c) => clean(c.value) || c.blank));
  const answers = rows.flat().filter((c) => c.blank).map((c) => clean(c.value)).filter(Boolean);
  const wrong = model.extra.map(clean).filter(Boolean);
  const suggestions = stableMix([...answers, ...wrong]);
  return {
    tableData: {
      variant: 'FILL_MISSING',
      headers: model.headers.map(clean),
      rows: rows.map((row) => row.map((c) => (c.blank ? TABLE_BLANK : clean(c.value)))),
      suggestions,
    },
    correctAnswer: rows.length ? JSON.stringify(rows.map((row) => row.map((c) => clean(c.value)))) : '',
  };
}

/** Why the app could not mark it, in words; [] when it can. */
export function tableIssues(model) {
  const cells = model.rows.flat();
  const issues = [];
  if (!cells.some((c) => c.blank)) issues.push('حدّد خانة واحدة على الأقل يملؤها الطالب.');
  if (cells.some((c) => c.blank && !clean(c.value))) issues.push('اكتب الإجابة الصحيحة لكل خانة يملؤها الطالب.');
  if (cells.some((c) => !c.blank && clean(c.value) === TABLE_BLANK)) issues.push('علامة ؟ تعني خانة يملؤها الطالب؛ استعمل الزر بدلاً من كتابتها.');
  return issues;
}
