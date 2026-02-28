/**
 * Lesson completion status — single source of truth.
 * Used in SubjectOverview dots, UnitView cards, and LessonEditorPage checklist.
 */

export const LESSON_STATUS = {
  EMPTY:    'empty',       // no sections at all
  STARTED:  'started',     // has sections but no blocks yet
  PARTIAL:  'partial',     // has blocks but no summary
  DONE:     'done',        // has blocks + summary
};

export const STATUS_CONFIG = {
  empty:   { label: 'فارغ',        dot: 'bg-ink-700',    badge: 'bg-ink-800 text-ink-500 border-ink-700',             ring: 'border-ink-700'   },
  started: { label: 'بدأ',         dot: 'bg-amber-500',  badge: 'bg-amber-900/40 text-amber-400 border-amber-700/50', ring: 'border-amber-700' },
  partial: { label: 'قيد العمل',   dot: 'bg-blue-500',   badge: 'bg-blue-900/40 text-blue-400 border-blue-700/50',    ring: 'border-blue-700'  },
  done:    { label: 'مكتمل',       dot: 'bg-emerald-500',badge: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50', ring: 'border-emerald-700' },
};

/**
 * @param {string}   lessonId
 * @param {object[]} sections
 * @param {object[]} blocks
 * @param {object}   lesson    — needs lesson.summary
 * @returns {keyof LESSON_STATUS}
 */
export function getLessonStatus(lessonId, sections, blocks, lesson) {
  const lessonSections = sections.filter((s) => s.lessonId === lessonId);
  if (lessonSections.length === 0) return LESSON_STATUS.EMPTY;

  const sectionIds  = lessonSections.map((s) => s.id);
  const totalBlocks = blocks.filter((b) => sectionIds.includes(b.sectionId)).length;
  if (totalBlocks === 0) return LESSON_STATUS.STARTED;

  const hasSummary = lesson?.summary?.trim()?.length > 0;
  if (!hasSummary) return LESSON_STATUS.PARTIAL;

  return LESSON_STATUS.DONE;
}

/**
 * Aggregate progress for a unit or the whole subject.
 * Returns { done, total, pct }
 */
export function computeProgress(lessonIds, sections, blocks, lessonsMap) {
  const total = lessonIds.length;
  if (total === 0) return { done: 0, total: 0, pct: 0 };

  const done = lessonIds.filter(
    (id) => getLessonStatus(id, sections, blocks, lessonsMap[id]) === LESSON_STATUS.DONE
  ).length;

  return { done, total, pct: Math.round((done / total) * 100) };
}