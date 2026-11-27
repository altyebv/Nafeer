import { describe, expect, test } from 'vitest';
import {
  checkpointForSave, checkpointIssues, optionList, sectionWithRecall, unplacedCheckpoints,
} from '@/lib/checkpoints';
import { blockContentForApp, blockGoesToApp, blockTypeForApp, blockTypeFromApp } from '@/lib/appExport';

const text = (id, order) => ({ id, type: 'TEXT', content: id, order, sectionId: 's1' });
const cp = (id, order, questionId) => ({ id, type: 'QUESTION', content: questionId, order, sectionId: 's1' });
const q = (id, sectionId = 's1', extra = {}) => ({ id, isCheckpoint: true, sectionId, type: 'MCQ', ...extra });

// Steps as short names: block ids, "?q" for a question asked by its block, "?q." after the last block.
const names = (steps) => steps.map((s) => (s.kind === 'block' ? s.block.id : `?${s.question.id}${s.placed ? '' : '.'}`));

describe('where a section asks its recall questions (as RecallPlacement.kt)', () => {
  test('at its checkpoint block', () => {
    expect(names(sectionWithRecall([text('b1', 1), cp('b2', 2, 'q1'), text('b3', 3)], [q('q1')], 's1')))
      .toEqual(['b1', '?q1', 'b3']);
  });

  test('after the last block when no block names it', () => {
    expect(names(sectionWithRecall([text('b1', 1)], [q('q1')], 's1'))).toEqual(['b1', '?q1.']);
  });

  test('blocks in order, several questions, other sections and practice questions left alone', () => {
    const questions = [q('q1'), q('q2'), q('q3', 's2'), { id: 'q4', sectionId: 's1', isCheckpoint: false }];
    const blocks = [text('b2', 2), cp('b1', 1, 'q2')];
    expect(names(sectionWithRecall(blocks, questions, 's1'))).toEqual(['?q2', 'b2', '?q1.']);
    expect(unplacedCheckpoints(blocks, questions, 's1').map((x) => x.id)).toEqual(['q1']);
  });

  test('a checkpoint block naming nothing of the section stays a block', () => {
    expect(names(sectionWithRecall([cp('b1', 1, ''), cp('b2', 2, 'q3')], [q('q3', 's2')], 's1')))
      .toEqual(['b1', 'b2']);
  });

  test('a question two blocks name is asked at the first', () => {
    expect(names(sectionWithRecall([cp('b1', 1, 'q1'), cp('b2', 2, ' q1 ')], [q('q1')], 's1')))
      .toEqual(['?q1', 'b2']);
  });
});

describe('checkpointIssues', () => {
  const ok = { textAr: 'س', sectionId: 's1' };

  test('ready questions of each inline type', () => {
    expect(checkpointIssues({ ...ok, type: 'MCQ', options: ['أ', 'ب'], correctAnswer: 'ب' })).toEqual([]);
    expect(checkpointIssues({ ...ok, type: 'MCQ', options: '["أ","ب"]', correctAnswer: 'أ' })).toEqual([]);
    expect(checkpointIssues({ ...ok, type: 'TRUE_FALSE', correctAnswer: 'false' })).toEqual([]);
    expect(checkpointIssues({ ...ok, type: 'ORDER', options: ['1', '2'] })).toEqual([]);
  });

  test('what is missing', () => {
    expect(checkpointIssues({ ...ok, textAr: ' ', type: 'TRUE_FALSE', correctAnswer: 'true' })).toHaveLength(1);
    expect(checkpointIssues({ ...ok, type: 'MCQ', options: ['أ', ''], correctAnswer: 'أ' })).toHaveLength(1);
    expect(checkpointIssues({ ...ok, type: 'MCQ', options: ['أ', 'ب'], correctAnswer: '' })).toHaveLength(1);
    expect(checkpointIssues({ ...ok, type: 'ORDER', options: ['1', '1'] })).toHaveLength(1);
    expect(checkpointIssues({ ...ok, type: 'TRUE_FALSE', correctAnswer: 'true', sectionId: null })).toHaveLength(1);
  });

  test('a type the app does not ask in a lesson', () => {
    expect(checkpointIssues({ ...ok, type: 'FILL_BLANK', correctAnswer: 'x' })).toHaveLength(1);
  });
});

describe('checkpointForSave', () => {
  test('MCQ: blank choices go with their notes, the right one keeps none', () => {
    const saved = checkpointForSave({
      type: 'MCQ', textAr: ' س ', options: ['أ', '', 'ب', 'ج'], correctAnswer: 'ب',
      optionNotes: ['لأن أ', 'x', 'لا', ''], explanation: '', mistakeNote: ' ',
    });
    expect(saved).toMatchObject({
      textAr: 'س', options: ['أ', 'ب', 'ج'], correctAnswer: 'ب', optionNotes: ['لأن أ', '', ''],
      explanation: null, mistakeNote: null, isCheckpoint: true, feedEligible: false,
    });
  });

  test('MCQ without notes stores none', () => {
    expect(checkpointForSave({ type: 'MCQ', options: ['أ', 'ب'], correctAnswer: 'أ', optionNotes: ['', ''] }).optionNotes).toEqual([]);
  });

  test('ORDER: items in order, the key as the app reads it', () => {
    expect(checkpointForSave({ type: 'ORDER', options: ['أ', '', 'ب'] })).toMatchObject({ options: ['أ', 'ب'], correctAnswer: 'أ | ب' });
  });

  test('TRUE_FALSE has no options', () => {
    expect(checkpointForSave({ type: 'TRUE_FALSE', correctAnswer: 'true', options: ['x'] })).toMatchObject({ options: null, correctAnswer: 'true' });
  });

  test('optionList reads arrays, JSON strings and nothing', () => {
    expect(optionList(['a'])).toEqual(['a']);
    expect(optionList('["a","b"]')).toEqual(['a', 'b']);
    expect(optionList('not json')).toEqual([]);
    expect(optionList(null)).toEqual([]);
  });
});

describe('checkpoint blocks in the app', () => {
  test('a QUESTION block goes as CHECKPOINT once it names its question', () => {
    expect(blockGoesToApp('QUESTION', '')).toBe(false);
    expect(blockGoesToApp('QUESTION', '  ')).toBe(false);
    expect(blockGoesToApp('QUESTION', 'q1')).toBe(true);
    expect(blockGoesToApp('TEXT', '')).toBe(true);
    expect(blockTypeForApp('QUESTION')).toBe('CHECKPOINT');
    expect(blockTypeForApp('TEXT')).toBe('TEXT');
    expect(blockContentForApp('QUESTION', ' q1\n')).toBe('q1');
    expect(blockContentForApp('TEXT', null)).toBe('');
  });

  test('a restored CHECKPOINT block is a QUESTION block again', () => {
    expect(blockTypeFromApp('CHECKPOINT')).toBe('QUESTION');
    expect(blockTypeFromApp('VERSE')).toBe('VERSE');
  });
});
