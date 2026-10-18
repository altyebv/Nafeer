// ─── adminPipeline.js ─────────────────────────────────────────────────────────
// The joining pipeline, one stage per contributor. Shared by the overview
// counts and the contributors screen so the two can never disagree.
//
//   new         applied; no interview sent yet
//   invited     interview link sent; no answers yet
//   answered    answers in — waiting on the admin's decision
//   onboarding  approved but has not finished onboarding
//   approved    a working contributor
//   rejected    turned down
//
// `interviewToken` is select:false on the model; callers that want "invited"
// must select it (and must not send it to the browser).

export const PIPELINE_STAGES = ['new', 'invited', 'answered', 'onboarding', 'approved', 'rejected'];

export function pipelineStage(c) {
  if (c.status === 'rejected') return 'rejected';
  if (c.status === 'approved') return c.onboarded ? 'approved' : 'onboarding';
  if (c.interviewAnswers?.submittedAt || c.dynamicAnswersSubmittedAt) return 'answered';
  if (c.interviewToken) return 'invited';
  return 'new';
}
