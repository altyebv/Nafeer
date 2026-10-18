import { describe, it, expect } from 'vitest';
import { pipelineStage, PIPELINE_STAGES } from '@/lib/adminPipeline';
import { nextStep } from '@/app/admin/dashboard/screens/useOverview';

describe('pipelineStage', () => {
  it('walks an applicant through the six stages', () => {
    expect(pipelineStage({ status: 'pending' })).toBe('new');
    expect(pipelineStage({ status: 'pending', interviewToken: 't' })).toBe('invited');
    expect(pipelineStage({ status: 'pending', interviewToken: 't', interviewAnswers: { submittedAt: new Date() } })).toBe('answered');
    expect(pipelineStage({ status: 'pending', dynamicAnswersSubmittedAt: new Date() })).toBe('answered');
    expect(pipelineStage({ status: 'approved', onboarded: false })).toBe('onboarding');
    expect(pipelineStage({ status: 'approved', onboarded: true })).toBe('approved');
    expect(pipelineStage({ status: 'rejected', interviewToken: 't' })).toBe('rejected');
  });

  it('names every stage it can return', () => {
    expect(PIPELINE_STAGES).toEqual(['new', 'invited', 'answered', 'onboarding', 'approved', 'rejected']);
  });
});

describe('nextStep', () => {
  const base = { seeded: true, people: 1, withContent: 0, lessons: { review: 0 } };
  it('puts the most blocking problem first', () => {
    expect(nextStep({ ...base, seeded: false }).label).toBe('ابذرها من المنهج');
    expect(nextStep({ ...base, lessons: { review: 2 } }).label).toBe('راجع 2 دروس');
    expect(nextStep({ ...base, people: 0 }).label).toBe('ادعُ مساهماً');
    expect(nextStep(base).label).toBe('لم يبدأ المساهم');
    expect(nextStep({ ...base, withContent: 3 }).label).toBe('تابع: 3 بدأ');
  });
});
