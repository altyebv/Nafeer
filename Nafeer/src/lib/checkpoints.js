// ─── Recall checkpoints ───────────────────────────────────────────────────────
// A checkpoint is a question with isCheckpoint and a sectionId: Basheer asks it
// inside the lesson, in that section. Where it is asked is a QUESTION block
// (CHECKPOINT in the app) whose content is the question's id; a checkpoint no
// block names is asked after the section's last block. A section may have
// several. This mirrors Basheer's SectionUiModel.withRecall (RecallPlacement.kt).

/** The question types Basheer can ask inside a lesson (INLINE_QUESTION_TYPES). */
export const INLINE_TYPES = ['MCQ', 'TRUE_FALSE', 'ORDER'];

export const isCheckpointBlock = (block) => block?.type === 'QUESTION';

/** The id of the question a checkpoint block asks; '' before one is written. */
export const blockQuestionId = (block) => String(block?.content ?? '').trim();

/** A question's choices or items as a list, however they were stored. */
export function optionList(options) {
  if (Array.isArray(options)) return options;
  if (typeof options !== 'string' || !options.trim()) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const filled = (list) => list.map((x) => String(x ?? '').trim()).filter(Boolean);

/** The section's recall questions, in store order. */
export const sectionCheckpoints = (questions, sectionId) =>
  questions.filter((q) => q.isCheckpoint && q.sectionId === sectionId);

/**
 * The section's page as the app shows it: its blocks (sorted by order) with
 * each recall question in its place.
 * @returns {Array<{ kind: 'block', block } | { kind: 'recall', question, placed: boolean }>}
 *   `placed` is false for a question asked after the last block because no block names it.
 *   A checkpoint block that names no question of this section stays as a block,
 *   so the editor can show it; the app leaves such a block out.
 */
export function sectionWithRecall(blocks, questions, sectionId) {
  const own = sectionCheckpoints(questions, sectionId);
  const byId = new Map(own.map((q) => [q.id, q]));
  const placed = new Set();
  const steps = [];
  [...blocks].sort((a, b) => a.order - b.order).forEach((block) => {
    const q = isCheckpointBlock(block) ? byId.get(blockQuestionId(block)) : null;
    if (q && !placed.has(q.id)) {
      placed.add(q.id);
      steps.push({ kind: 'recall', question: q, placed: true, block });
    } else {
      steps.push({ kind: 'block', block });
    }
  });
  own.forEach((q) => { if (!placed.has(q.id)) steps.push({ kind: 'recall', question: q, placed: false }); });
  return steps;
}

/** Checkpoints of the section that no block places: the app asks them after the last block. */
export const unplacedCheckpoints = (blocks, questions, sectionId) =>
  sectionWithRecall(blocks, questions, sectionId)
    .filter((s) => s.kind === 'recall' && !s.placed)
    .map((s) => s.question);

/**
 * What keeps a checkpoint from being asked as written, in words for the
 * contributor; [] when it is ready. Blocking problems only — a missing
 * explanation is advice, not a problem.
 */
export function checkpointIssues(q) {
  if (!q) return ['لا يوجد سؤال'];
  const issues = [];
  if (!String(q.textAr ?? '').trim()) issues.push('اكتب نص السؤال');
  if (!INLINE_TYPES.includes(q.type)) {
    issues.push('هذا النوع لا يُسأل داخل الدرس: التطبيق يسأل هنا اختياراً من متعدد وصح أو خطأ وترتيباً فقط');
    return issues;
  }
  if (q.type === 'MCQ') {
    const options = filled(optionList(q.options));
    if (options.length < 2) issues.push('اكتب خيارين على الأقل');
    else if (!options.includes(String(q.correctAnswer ?? '').trim())) issues.push('حدّد الخيار الصحيح');
    if (new Set(options).size !== options.length) issues.push('خياران متطابقان');
  }
  if (q.type === 'TRUE_FALSE' && !['true', 'false'].includes(q.correctAnswer)) issues.push('اختر صح أو خطأ');
  if (q.type === 'ORDER') {
    const items = filled(optionList(q.options));
    if (items.length < 2) issues.push('اكتب عنصرين على الأقل للترتيب');
    if (new Set(items).size !== items.length) issues.push('عنصران متطابقان');
  }
  if (!q.sectionId) issues.push('غير مربوط بقسم، فلن يظهر في الدرس');
  return issues;
}

/**
 * The fields a checkpoint form edits, cleaned for saving: blank choices and
 * items dropped (with their notes), the answer key written as the app reads it.
 */
export function checkpointForSave(form) {
  const base = {
    type:        form.type,
    textAr:      String(form.textAr ?? '').trim(),
    explanation: String(form.explanation ?? '').trim() || null,
    mistakeNote: String(form.mistakeNote ?? '').trim() || null,
    conceptIds:  form.conceptIds || [],
    difficulty:  form.difficulty || 1,
    cognitiveLevel: form.cognitiveLevel || 'RECALL',
    isCheckpoint: true,
    feedEligible: false,
  };
  if (form.type === 'MCQ') {
    const raw = optionList(form.options).map((o) => String(o ?? '').trim());
    const notes = raw.map((_, i) => String(form.optionNotes?.[i] ?? '').trim());
    const keep = raw.map((o, i) => (o ? i : -1)).filter((i) => i >= 0);
    const options = keep.map((i) => raw[i]);
    const correct = String(form.correctAnswer ?? '').trim();
    // The right choice has no "why it's wrong" note.
    const optionNotes = keep.map((i) => (raw[i] === correct ? '' : notes[i]));
    return { ...base, options, correctAnswer: correct, optionNotes: optionNotes.some(Boolean) ? optionNotes : [] };
  }
  if (form.type === 'ORDER') {
    const items = filled(optionList(form.options));
    return { ...base, options: items, correctAnswer: items.join(' | '), optionNotes: [] };
  }
  return { ...base, options: null, correctAnswer: form.correctAnswer || '', optionNotes: [] };
}
