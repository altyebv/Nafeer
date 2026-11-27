import { describe, expect, test } from 'vitest';
import { gapCount, wordBank, wrongWords } from '@/lib/fillBlank';
import { optionList } from '@/lib/checkpoints';

describe('wordBank', () => {
  test('holds the right word once, among the wrong ones in their order', () => {
    const bank = wordBank('وجه الشبه', ['أداة التشبيه', 'المشبه به', 'القرينة']);
    expect(bank).toHaveLength(4);
    expect(bank.filter((w) => w === 'وجه الشبه')).toHaveLength(1);
    expect(bank.filter((w) => w !== 'وجه الشبه')).toEqual(['أداة التشبيه', 'المشبه به', 'القرينة']);
  });

  test('the same words always give the same order', () => {
    expect(wordBank('أ', ['ب', 'ج'])).toEqual(wordBank(' أ ', ['ب ', 'ج']));
  });

  test('the right word is not always first', () => {
    const spots = new Set(['النيل', 'الكونغو', 'الزمبيزي', 'النيجر', 'أوكافانغو', 'السنغال', 'جوبا', 'عطبرة']
      .map((answer) => wordBank(answer, ['x', 'y', 'z']).indexOf(answer)));
    expect(spots.size).toBeGreaterThan(1);
  });

  test('blanks and repeats are dropped, the answer among the wrong words too', () => {
    expect(wordBank('أ', ['', 'ب', 'ب', ' أ ', '  ']).sort()).toEqual(['أ', 'ب']);
  });

  test('no bank without a right word or a wrong one', () => {
    expect(wordBank('', ['ب'])).toEqual([]);
    expect(wordBank('أ', [])).toEqual([]);
    expect(wordBank('أ', ['', ' '])).toEqual([]);
  });
});

describe('wrongWords', () => {
  test('a stored bank without its answer', () => {
    expect(wrongWords(['ب', 'أ', 'ج'], 'أ')).toEqual(['ب', 'ج']);
    expect(wrongWords(['أ', 'ب'], ' أ ')).toEqual(['ب']);
  });

  test('no bank, or an answer not in it', () => {
    expect(wrongWords(null, 'أ')).toEqual([]);
    expect(wrongWords(['ب', 'ج'], 'أ')).toEqual(['ب', 'ج']);
  });

  test('a bank restored as the app JSON string keeps its words when saved', () => {
    const stored = '["وجه الشبه","أداة التشبيه","القرينة"]';
    const saved = wordBank('وجه الشبه', wrongWords(optionList(stored), 'وجه الشبه'));
    expect([...saved].sort()).toEqual(['أداة التشبيه', 'القرينة', 'وجه الشبه'].sort());
  });

  test('round trip: what the editor loads gives back the same bank', () => {
    const bank = wordBank('الخرطوم', ['أم درمان', 'بحري']);
    expect(wordBank('الخرطوم', wrongWords(bank, 'الخرطوم'))).toEqual(bank);
  });
});

describe('gapCount', () => {
  test('gapCount reads two or more underscores as a gap', () => {
    expect(gapCount('تسمى ___.')).toBe(1);
    expect(gapCount('تسمى _ فقط')).toBe(0);
    expect(gapCount('__ و ____')).toBe(2);
    expect(gapCount(null)).toBe(0);
  });

});
