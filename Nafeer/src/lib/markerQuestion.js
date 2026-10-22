// ─── markerQuestion ───────────────────────────────────────────────────────────
// Marker questions (docs/question-markers.md): the rules a question must meet,
// its word bank, and its grading. Pure functions, shared by the question
// form, the API and the student view — and the reference the Android app
// ports, so the grading tests (tests/markerQuestion.test.js) are the contract.
//
//   label   each pin gets its name from one shared word bank; partial credit
//   locate  one tap, right when it lands within the target's radius
//
// Positions are fractions of the image's width and height; `radius` is a
// fraction of its WIDTH, so distances are measured with the image's aspect.

export const MARKER_TYPE = 'IMAGE_MARKER';
export const MARKER_MODES = ['label', 'locate'];
export const MARKER_SENTINEL = { label: 'MARKER_LABELS', locate: 'MARKER_LOCATE' };
export const LOCATE_RADIUS = { min: 0.02, max: 0.2, default: 0.06 };
export const MIN_LABEL_PINS = 2;

const clean = (s) => String(s ?? '').trim();

/** Distractors as a clean list — stored in `options` for label mode. */
export function distractorsOf(q) {
  return Array.isArray(q?.options) ? q.options.map(clean).filter(Boolean) : [];
}

/**
 * What still stops this question from being valid, as Arabic sentences for
 * the form's checklist and the API's refusal. Empty when it is ready.
 * @returns {string[]}
 */
export function markerIssues(q) {
  if (q?.type !== MARKER_TYPE) return [];
  const issues = [];
  const markers = Array.isArray(q.markers) ? q.markers : [];
  if (!clean(q.imageUrl)) issues.push('اختر صورة السؤال');
  if (!MARKER_MODES.includes(q.markerMode)) {
    issues.push('اختر نوع السؤال: تسمية العلامات أو تحديد الموضع');
    return issues;
  }
  if (markers.some((m) => !(m.x >= 0 && m.x <= 1 && m.y >= 0 && m.y <= 1))) {
    issues.push('علامة خارج حدود الصورة');
  }

  if (q.markerMode === 'label') {
    if (markers.length < MIN_LABEL_PINS) issues.push(`ضع ${MIN_LABEL_PINS} علامات على الأقل`);
    const missing = markers.map((m, i) => (clean(m.answer) ? null : i + 1)).filter(Boolean);
    if (missing.length) issues.push(`اكتب إجابة العلامة ${missing.join('، ')}`);
    const answers = markers.map((m) => clean(m.answer)).filter(Boolean);
    if (new Set(answers).size !== answers.length) issues.push('لكل علامة إجابة مختلفة — هناك إجابتان متطابقتان');
    const distractors = distractorsOf(q);
    if (distractors.some((d) => answers.includes(d))) issues.push('خيار مضلِّل يطابق إجابة إحدى العلامات');
    if (new Set(distractors).size !== distractors.length) issues.push('خيار مضلِّل مكرر');
  } else {
    if (markers.length !== 1) issues.push('ضع علامة واحدة على الموضع المطلوب');
    const [t] = markers;
    if (t && !clean(t.label)) issues.push('اكتب اسم ما يبحث عنه الطالب');
    if (t && !(t.radius >= LOCATE_RADIUS.min && t.radius <= LOCATE_RADIUS.max)) {
      issues.push('نصف قطر المنطقة الصحيحة خارج المدى المسموح');
    }
  }
  return issues;
}

// ─── Word bank ────────────────────────────────────────────────────────────────

// A tiny seeded PRNG (mulberry32) so one attempt keeps one order.
function rng(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every pin's answer plus the distractors, shuffled the same way for one seed. */
export function markerBank(q, seed = q?.id || q?.contentId || '') {
  const words = [...new Set([
    ...(q?.markers || []).map((m) => clean(m.answer)).filter(Boolean),
    ...distractorsOf(q),
  ])];
  const rand = rng(seed);
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words;
}

// ─── Grading ──────────────────────────────────────────────────────────────────

/**
 * Label mode. `picks` maps marker id → the word chosen for it.
 * score is a fraction 0–1; points earned = question.points × score.
 * @returns {{ score: number, right: number, total: number, perPin: Record<string, boolean> }}
 */
export function gradeLabels(q, picks = {}) {
  const markers = q?.markers || [];
  const perPin = {};
  let right = 0;
  for (const m of markers) {
    const ok = clean(picks[m.id]) !== '' && clean(picks[m.id]) === clean(m.answer);
    perPin[m.id] = ok;
    if (ok) right += 1;
  }
  const total = markers.length;
  return { score: total ? right / total : 0, right, total, perPin };
}

/**
 * Locate mode. `tap` is { x, y } in fractions of the image. `size` is the
 * image's { width, height }, from the question or the loaded image; without
 * it the image is taken as square.
 * `distance` is in fractions of the image's width, like `radius`.
 * @returns {{ correct: boolean, distance: number }}
 */
export function gradeLocate(q, tap, size = q?.image) {
  const target = q?.markers?.[0];
  if (!target || !tap) return { correct: false, distance: Infinity };
  const aspect = size?.width && size?.height ? size.height / size.width : 1;
  const dx = tap.x - target.x;
  const dy = (tap.y - target.y) * aspect;
  const distance = Math.hypot(dx, dy);
  const radius = Number.isFinite(target.radius) ? target.radius : LOCATE_RADIUS.default;
  return { correct: distance <= radius, distance };
}
