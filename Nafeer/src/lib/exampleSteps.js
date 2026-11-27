// ─── Worked-example steps ─────────────────────────────────────────────────────
// A step of an EXAMPLE block is a string, or { text, predict: { choices, answer } }
// when Basheer asks the student what comes next before showing it. The app asks
// a prediction only when it has at least two choices, none blank, and `answer`
// points at one of them (LessonMapper.parseStepPrediction); otherwise it shows
// the step plainly. It never asks before the first step, which is always shown
// (ExampleBlock.kt starts with one step revealed).

export const stepText = (step) => (typeof step === 'string' ? step : step?.text ?? '');
export const stepPredict = (step) => (step && typeof step === 'object' ? step.predict ?? null : null);

/** Why the app will not ask this step's prediction, in words; null when it will (or there is none). */
export function predictionIssue(index, predict) {
  if (!predict) return null;
  if (index === 0) return 'الخطوة الأولى تظهر دائماً، فلا يُسأل الطالب عنها.';
  const choices = Array.isArray(predict.choices) ? predict.choices : [];
  if (choices.length < 2) return 'لن يُسأل الطالب: يلزم اختياران على الأقل.';
  if (choices.some((c) => !String(c ?? '').trim())) return 'لن يُسأل الطالب: املأ كل الاختيارات أو احذف الفارغ منها.';
  const answer = Number.isInteger(predict.answer) ? predict.answer : -1;
  if (answer < 0 || answer >= choices.length) return 'لن يُسأل الطالب: لا يوجد اختيار صحيح.';
  return null;
}
