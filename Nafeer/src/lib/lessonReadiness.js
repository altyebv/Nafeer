// ─── lessonReadiness.js ───────────────────────────────────────────────────────
// The six checks a lesson needs before review — the same ones the editor's
// readiness panel shows — computed from the stores the editor already holds,
// so the lessons list can show them without a request.

export const SCAFFOLD_TITLE_RE = /^الدرس\s+\d+$/;

export const READINESS_CHECKS = [
  { id: 'title',     label: 'عنوان' },
  { id: 'summary',   label: 'ملخص' },
  { id: 'sections',  label: 'أقسام' },
  { id: 'content',   label: 'محتوى' },
  { id: 'questions', label: 'أسئلة' },
  { id: 'feed',      label: 'بطاقة تغذية' },
];

export const isAutoTitle = (title) => !title?.trim() || SCAFFOLD_TITLE_RE.test(title.trim());

/**
 * @returns {{ checks: {id,label,done}[], done: number, missing: string[],
 *             counts: { sections, blocks, questions, feed } }}
 */
export function lessonReadiness(lesson, { sections = [], blocks = [], questions = [], feedItems = [] }) {
  const ls = sections.filter((s) => s.lessonId === lesson.id);
  const ids = new Set(ls.map((s) => s.id));
  const counts = {
    sections:  ls.length,
    blocks:    blocks.filter((b) => ids.has(b.sectionId)).length,
    questions: questions.filter((q) => q.lessonId === lesson.id).length,
    feed:      feedItems.filter((f) => f.lessonId === lesson.id).length,
  };
  const ok = {
    title:     !isAutoTitle(lesson.title),
    summary:   !!lesson.summary?.trim(),
    sections:  counts.sections > 0,
    content:   counts.blocks > 0,
    questions: counts.questions > 0,
    feed:      counts.feed > 0,
  };
  const checks = READINESS_CHECKS.map((c) => ({ ...c, done: ok[c.id] }));
  return {
    checks,
    done: checks.filter((c) => c.done).length,
    missing: checks.filter((c) => !c.done).map((c) => c.label),
    counts,
  };
}

/** "2 أقسام · 7 عناصر · 3 أسئلة" — only what is there; "فارغ" when nothing. */
export function countsInWords({ sections, blocks, questions, feed }) {
  const parts = [];
  if (sections) parts.push(`${sections} ${sections === 1 ? 'قسم' : 'أقسام'}`);
  if (blocks) parts.push(`${blocks} ${blocks === 1 ? 'عنصر' : 'عناصر'}`);
  if (questions) parts.push(`${questions} ${questions === 1 ? 'سؤال' : 'أسئلة'}`);
  if (feed) parts.push(`${feed} ${feed === 1 ? 'بطاقة' : 'بطاقات'}`);
  return parts.length ? parts.join(' · ') : 'فارغ';
}

// ── Recently opened lessons (per browser, no request) ─────────────────────────
const RECENT_KEY = 'nafeer-recent-lessons';
const RECENT_MAX = 6;

export function rememberLessonOpened(lessonId) {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter((r) => r.id !== lessonId);
    list.unshift({ id: lessonId, at: Date.now() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch { /* storage blocked — the strip just stays empty */ }
}

export function recentLessons() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
