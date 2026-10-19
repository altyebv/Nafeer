// ─── Interview questions ──────────────────────────────────────────────────────
// Which questions an applicant answers, and the snapshot taken when they are
// invited (docs/team-leads.md L3).
//
// Questions used to be resolved from the role on every interview request —
// on the page load and again on submit. Once leads edit their subject's
// questions, an applicant halfway through would be checked against questions
// they never saw. So the questions are resolved once, at invite time, and
// stored on the applicant (`Contributor.interviewSnapshot`); the interview
// route reads the snapshot and falls back to resolving only for invites sent
// before snapshots existed.

export const MIN_ANSWER_LENGTH = 80;

/**
 * The questions + micro-task for a role and an applicant's subjects. A role's
 * entry for the applicant's first subject wins when it has questions;
 * otherwise the role's generic set.
 */
export function resolveQuestions(role, subjectsOfInterest = []) {
  const primarySubject = subjectsOfInterest[0] || null;
  const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

  if (primarySubject && Array.isArray(role?.subjectQuestionMap)) {
    const entry = role.subjectQuestionMap.find((e) => e.subjectId === primarySubject);
    if (entry?.questions?.length > 0) {
      return {
        questions:         [...entry.questions].sort(byOrder),
        microTask:         entry.microTask?.prompt
          ? { prompt: entry.microTask.prompt, minChars: entry.microTask.minChars ?? MIN_ANSWER_LENGTH }
          : null,
        isSubjectSpecific: true,
        resolvedSubjectId: primarySubject,
      };
    }
  }

  return {
    questions:         [...(role?.interviewQuestions || [])].sort(byOrder),
    microTask:         role?.microTask?.prompt
      ? { prompt: role.microTask.prompt, minChars: role.microTask.minChars ?? MIN_ANSWER_LENGTH }
      : null,
    isSubjectSpecific: false,
    resolvedSubjectId: null,
  };
}

/** The plain object stored on the applicant when the invite goes out. */
export function interviewSnapshot(role, subjectsOfInterest = [], now = new Date()) {
  if (!role) return null;
  const r = resolveQuestions(role, subjectsOfInterest);
  return {
    roleName: role.name || null,
    questions: r.questions.map((q) => ({
      _id:         q._id,
      text:        q.text,
      placeholder: q.placeholder || '',
      minChars:    q.minChars ?? MIN_ANSWER_LENGTH,
      order:       q.order ?? 0,
    })),
    microTask:         r.microTask,
    isSubjectSpecific: r.isSubjectSpecific,
    subjectId:         r.resolvedSubjectId,
    takenAt:           now,
  };
}

/**
 * The questions an applicant answers: the snapshot when there is one, else
 * resolved from the role now (invites sent before snapshots).
 */
export function questionsFor(contributor, role) {
  const snap = contributor?.interviewSnapshot;
  if (snap?.takenAt) {
    return {
      roleName:          snap.roleName || role?.name || null,
      questions:         snap.questions || [],
      microTask:         snap.microTask?.prompt ? snap.microTask : null,
      isSubjectSpecific: !!snap.isSubjectSpecific,
    };
  }
  if (!role) return { roleName: null, questions: [], microTask: null, isSubjectSpecific: false };
  const r = resolveQuestions(role, contributor?.subjectsOfInterest);
  return { roleName: role.name, questions: r.questions, microTask: r.microTask, isSubjectSpecific: r.isSubjectSpecific };
}
