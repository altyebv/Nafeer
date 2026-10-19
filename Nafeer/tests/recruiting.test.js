import { describe, it, expect } from 'vitest';
import { resolveQuestions, interviewSnapshot, questionsFor } from '@/lib/interview';
import { shapeForLead } from '@/lib/applicants';
import { buildDigest } from '@/lib/digest';
import { navFor, activeNavId } from '@/components/editor/layout/nav';

// ─── Recruiting rules (docs/team-leads.md L3) — the pure parts ────────────────

const role = {
  name: 'كاتب محتوى',
  interviewQuestions: [{ _id: 'g2', text: 'عام ٢', order: 2 }, { _id: 'g1', text: 'عام ١', order: 1 }],
  microTask: { prompt: 'مهمة عامة', minChars: 100 },
  subjectQuestionMap: [
    { subjectId: 'PHYSICS', questions: [{ _id: 'p1', text: 'فيزياء ١', order: 0, minChars: 60 }], microTask: { prompt: 'مهمة فيزياء' } },
    { subjectId: 'MATH', questions: [], microTask: { prompt: '' } },
  ],
};

describe('which interview questions', () => {
  it('the first subject\'s entry wins, in order', () => {
    const r = resolveQuestions(role, ['PHYSICS', 'MATH']);
    expect(r.questions.map((q) => q._id)).toEqual(['p1']);
    expect(r.microTask.prompt).toBe('مهمة فيزياء');
    expect(r.isSubjectSpecific).toBe(true);
  });

  it('an empty subject entry, or a later subject, falls back to the generic set', () => {
    expect(resolveQuestions(role, ['MATH']).questions.map((q) => q._id)).toEqual(['g1', 'g2']);
    expect(resolveQuestions(role, ['GEOGRAPHY', 'PHYSICS']).isSubjectSpecific).toBe(false);
  });

  it('never reorders the role\'s own array', () => {
    resolveQuestions(role, []);
    expect(role.interviewQuestions[0]._id).toBe('g2');
  });
});

describe('the invite snapshot', () => {
  it('keeps the questions as they were, whatever the role becomes', () => {
    const applicant = { subjectsOfInterest: ['PHYSICS'], interviewSnapshot: interviewSnapshot(role, ['PHYSICS']) };
    const edited = { ...role, subjectQuestionMap: [{ subjectId: 'PHYSICS', questions: [{ _id: 'new', text: 'جديد' }] }] };
    const q = questionsFor(applicant, edited);
    expect(q.questions.map((x) => x._id)).toEqual(['p1']);
    expect(q.questions[0].minChars).toBe(60);
    expect(q.roleName).toBe('كاتب محتوى');
  });

  it('an invite from before snapshots still resolves from the role', () => {
    expect(questionsFor({ subjectsOfInterest: ['PHYSICS'] }, role).questions[0]._id).toBe('p1');
    expect(questionsFor({ subjectsOfInterest: [] }, null).questions).toEqual([]);
  });
});

describe('what a lead sees of an applicant', () => {
  const doc = {
    _id: 'x', name: 'منى', email: 'muna@example.com', age: '18-22', town: 'كسلا',
    subjectsOfInterest: ['PHYSICS', 'MATH'], status: 'pending',
    background: 'طالبة هندسة', usesAiTools: true, aiToolsList: ['chatgpt'],
    dynamicAnswersSubmittedAt: new Date('2026-10-10'),
    dynamicAnswers: [{ question: 'لماذا؟', answer: 'لأن…' }], dynamicMicroTask: 'شرح الحركة',
    interviewToken: 'secret-token', passwordHash: 'h',
    pendingDecision: { action: 'reject', reason: 'r', byName: 'سارة', decideAt: new Date('2026-10-19T12:30:00Z') },
  };
  const shaped = shapeForLead(doc, { subjectId: 'PHYSICS', roleName: 'كاتب', now: new Date('2026-10-19T12:00:00Z') });

  it('never carries email, age, town or any token', () => {
    const json = JSON.stringify(shaped);
    for (const secret of ['muna@example.com', '18-22', 'كسلا', 'secret-token']) expect(json).not.toContain(secret);
    for (const key of ['email', 'age', 'town', 'interviewToken', 'passwordHash']) expect(shaped).not.toHaveProperty(key);
  });

  it('carries what the decision needs', () => {
    expect(shaped).toMatchObject({
      primary: true, stage: 'answered', microTask: 'شرح الحركة', aiTools: ['chatgpt'],
      answers: [{ question: 'لماذا؟', answer: 'لأن…' }],
      pendingDecision: { action: 'reject', byName: 'سارة' },
    });
  });

  it('a decision past its window is no longer shown as pending', () => {
    expect(shapeForLead(doc, { subjectId: 'PHYSICS', now: new Date('2026-10-19T13:00:00Z') }).pendingDecision).toBeNull();
  });

  it('marks applicants who picked the subject second', () => {
    expect(shapeForLead(doc, { subjectId: 'MATH' }).primary).toBe(false);
  });
});

describe('the owner\'s digest', () => {
  it('nothing happened, nothing is sent', () => {
    expect(buildDigest([])).toBeNull();
  });

  it('groups by subject and spells out decisions about people', () => {
    const d = buildDigest([
      { subjectId: 'PHYSICS', actorName: 'سارة', action: 'lesson.approve' },
      { subjectId: 'PHYSICS', actorName: 'سارة', action: 'lesson.approve' },
      { subjectId: 'PHYSICS', actorName: 'سارة', action: 'applicant.reject', reason: 'إجابات قصيرة جداً', target: { label: 'عمر' } },
    ], new Date('2026-10-19'));
    expect(d.message).toContain('فيزياء — 3 إجراءات');
    expect(d.message).toContain('سارة: اعتمد ×2');
    expect(d.message).toContain('رفض متقدماً «عمر» — إجابات قصيرة جداً');
  });
});

describe('the lead nav', () => {
  const lead = (perms) => ({ lead: { active: true, canReview: false, canManageTeam: false, canDecideApplicants: false, canEditInterview: false, ...perms } });
  const ids = (c) => navFor(c).map((n) => n.id);

  it('shows each lead page only with one of its permissions', () => {
    expect(ids(lead({ canReview: true }))).toContain('lead');
    expect(ids(lead({ canReview: true }))).not.toContain('recruiting');
    expect(ids(lead({ canEditInterview: true }))).toContain('recruiting');
    expect(ids({ lead: null })).not.toContain('team');
  });

  it('highlights the lead sub-pages', () => {
    expect(activeNavId('/editor/lead')).toBe('lead');
    expect(activeNavId('/editor/lead/team')).toBe('team');
    expect(activeNavId('/editor/lead/recruiting')).toBe('recruiting');
  });
});
