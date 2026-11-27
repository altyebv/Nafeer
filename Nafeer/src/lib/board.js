// ─── The lesson board ─────────────────────────────────────────────────────────
// Where each lesson stands and who has it, for the lessons list. Pure, from
// what the subject already carries: `unclaimed`, `started` and `ownerName` come
// with the subject GET (lib/api/subject.js).

export const BOARD_STATES = [
  { id: 'available', label: 'متاح',             tone: 'special' },
  { id: 'claimed',   label: 'محجوز',            tone: 'neutral' },
  { id: 'progress',  label: 'قيد العمل',        tone: 'neutral' },
  { id: 'submitted', label: 'بانتظار المراجعة', tone: 'info' },
  { id: 'returned',  label: 'أُعيد',            tone: 'warn' },
  { id: 'approved',  label: 'معتمد',            tone: 'success' },
];

export const BOARD_BY_ID = {
  ...Object.fromEntries(BOARD_STATES.map((s) => [s.id, s])),
  archived: { id: 'archived', label: 'مؤرشف', tone: 'neutral' },
};

/** `hasSections` is what this browser has loaded, on top of the server's `started`. */
export function lessonState(lesson, hasSections = false) {
  if (lesson.atlasStatus === 'archived') return 'archived';
  if (lesson.atlasStatus === 'approved') return 'approved';
  if (lesson.atlasStatus === 'review') return 'submitted';
  if (lesson.reviewState?.returned && !lesson.unclaimed) return 'returned';
  if (lesson.unclaimed) return 'available';
  return lesson.started || lesson.revising || hasSections ? 'progress' : 'claimed';
}

/** Whether the holder may give the lesson back (lib/lessonAccess.js releaseLesson). */
export const canHandBack = (lesson, me) =>
  !!me && lesson.owner === me && !lesson.unclaimed && !lesson.revising
  && (lesson.atlasStatus || 'draft') === 'draft';
