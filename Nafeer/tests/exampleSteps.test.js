import { describe, expect, test } from 'vitest';
import { predictionIssue, stepPredict, stepText } from '@/lib/exampleSteps';

// The app's rule: LessonMapper.parseStepPrediction, and ExampleBlock.kt never asking before step 1.
describe('predictionIssue', () => {
  test('a usable prediction', () => {
    expect(predictionIssue(1, { choices: ['صح', 'خطأ'], answer: 0 })).toBeNull();
    expect(predictionIssue(3, { choices: ['أ', 'ب', 'ج'], answer: 2 })).toBeNull();
  });

  test('no prediction is no problem', () => {
    expect(predictionIssue(1, null)).toBeNull();
    expect(predictionIssue(0, null)).toBeNull();
  });

  test('the first step is never asked', () => {
    expect(predictionIssue(0, { choices: ['أ', 'ب'], answer: 0 })).toMatch(/الأولى/);
  });

  test('what the app skips', () => {
    expect(predictionIssue(1, { choices: ['أ'], answer: 0 })).toMatch(/اختياران/);
    expect(predictionIssue(1, { choices: [], answer: 0 })).toMatch(/اختياران/);
    expect(predictionIssue(1, { choices: ['أ', '  '], answer: 0 })).toMatch(/الفارغ/);
    expect(predictionIssue(1, { choices: ['أ', 'ب'], answer: 2 })).toMatch(/صحيح/);
    expect(predictionIssue(1, { choices: ['أ', 'ب'] })).toMatch(/صحيح/);
  });
});

describe('step shape', () => {
  test('a string or an object', () => {
    expect(stepText('خطوة')).toBe('خطوة');
    expect(stepText({ text: 'خطوة', predict: {} })).toBe('خطوة');
    expect(stepPredict('خطوة')).toBeNull();
    expect(stepPredict({ text: 'x', predict: { choices: [] } })).toEqual({ choices: [] });
  });
});
