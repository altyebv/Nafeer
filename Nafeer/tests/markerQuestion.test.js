import { describe, it, expect } from 'vitest';
import { gradeLabels, gradeLocate, markerBank, markerIssues, MARKER_SENTINEL } from '@/lib/markerQuestion';

// The reference behaviour for marker questions (docs/question-markers.md).
// The Android app ports lib/markerQuestion.js; these cases are the contract.

const label = (over = {}) => ({
  id: 'q_cell', type: 'IMAGE_MARKER', markerMode: 'label', imageUrl: 'https://x/cell.png',
  correctAnswer: MARKER_SENTINEL.label,
  markers: [
    { id: 'a', x: 0.5, y: 0.45, label: '1', answer: 'النواة' },
    { id: 'b', x: 0.72, y: 0.35, label: '2', answer: 'الميتوكوندريا' },
    { id: 'c', x: 0.3, y: 0.65, label: '3', answer: 'الريبوسوم' },
    { id: 'd', x: 0.6, y: 0.7, label: '4', answer: 'الشبكة الإندوبلازمية' },
  ],
  options: ['الجدار الخلوي'],
  ...over,
});

const locate = (over = {}) => ({
  id: 'q_find', type: 'IMAGE_MARKER', markerMode: 'locate', imageUrl: 'https://x/map.png',
  correctAnswer: MARKER_SENTINEL.locate,
  image: { width: 1000, height: 500 },
  markers: [{ id: 't', x: 0.5, y: 0.5, label: 'النيل', radius: 0.05 }],
  ...over,
});

describe('gradeLabels', () => {
  it('gives partial credit, pin by pin', () => {
    const r = gradeLabels(label(), { a: 'النواة', b: 'الميتوكوندريا', c: 'الجدار الخلوي' });
    expect(r).toEqual({ score: 0.5, right: 2, total: 4, perPin: { a: true, b: true, c: false, d: false } });
  });

  it('ignores surrounding spaces, but not a different word', () => {
    expect(gradeLabels(label(), { a: ' النواة ' }).perPin.a).toBe(true);
    expect(gradeLabels(label(), { a: 'نواة' }).perPin.a).toBe(false);
  });

  it('scores 1 when every pin is right', () => {
    const picks = Object.fromEntries(label().markers.map((m) => [m.id, m.answer]));
    expect(gradeLabels(label(), picks).score).toBe(1);
  });
});

describe('gradeLocate', () => {
  it('measures across in widths and down with the image aspect', () => {
    // 0.04 of the width across: inside a 0.05 radius.
    expect(gradeLocate(locate(), { x: 0.54, y: 0.5 }).correct).toBe(true);
    // 0.08 of the height down on a 2:1 image is 0.04 of the width: inside.
    expect(gradeLocate(locate(), { x: 0.5, y: 0.58 }).correct).toBe(true);
    // 0.12 of the height down = 0.06 of the width: outside.
    expect(gradeLocate(locate(), { x: 0.5, y: 0.62 }).correct).toBe(false);
  });

  it('takes the image as square without a size', () => {
    const q = locate({ image: null });
    expect(gradeLocate(q, { x: 0.5, y: 0.54 }).correct).toBe(true);
    expect(gradeLocate(q, { x: 0.5, y: 0.56 }).correct).toBe(false);
  });

  it('is wrong with no tap', () => {
    expect(gradeLocate(locate(), null)).toEqual({ correct: false, distance: Infinity });
  });
});

describe('markerBank', () => {
  it('holds every answer and distractor once, in a stable order per seed', () => {
    const bank = markerBank(label(), 'attempt-1');
    expect([...bank].sort()).toEqual(['الجدار الخلوي', 'الريبوسوم', 'الشبكة الإندوبلازمية', 'الميتوكوندريا', 'النواة'].sort());
    expect(markerBank(label(), 'attempt-1')).toEqual(bank);
  });
});

describe('markerIssues', () => {
  it('passes a complete question of each kind', () => {
    expect(markerIssues(label())).toEqual([]);
    expect(markerIssues(locate())).toEqual([]);
  });

  it('leaves other types alone', () => {
    expect(markerIssues({ type: 'FIGURE', markers: [{ id: 'x', x: 0.1, y: 0.1 }] })).toEqual([]);
  });

  it('names what a label question is missing', () => {
    const q = label({
      imageUrl: '',
      markers: [{ id: 'a', x: 0.1, y: 0.1, answer: 'النواة' }, { id: 'b', x: 0.2, y: 0.2, answer: '' }],
      options: ['النواة'],
    });
    const issues = markerIssues(q);
    expect(issues).toContain('اختر صورة السؤال');
    expect(issues).toContain('اكتب إجابة العلامة 2');
    expect(issues).toContain('خيار مضلِّل يطابق إجابة إحدى العلامات');
  });

  it('refuses repeated answers and too few pins', () => {
    expect(markerIssues(label({ markers: [{ id: 'a', x: 0.1, y: 0.1, answer: 'س' }] }))).toContain('ضع 2 علامات على الأقل');
    expect(markerIssues(label({ markers: [
      { id: 'a', x: 0.1, y: 0.1, answer: 'س' }, { id: 'b', x: 0.2, y: 0.2, answer: 'س' },
    ] }))).toContain('لكل علامة إجابة مختلفة — هناك إجابتان متطابقتان');
  });

  it('wants exactly one named target with a radius in range for locate', () => {
    expect(markerIssues(locate({ markers: [] }))).toContain('ضع علامة واحدة على الموضع المطلوب');
    expect(markerIssues(locate({ markers: [{ id: 't', x: 0.5, y: 0.5, label: '', radius: 0.5 }] })))
      .toEqual(['اكتب اسم ما يبحث عنه الطالب', 'نصف قطر المنطقة الصحيحة خارج المدى المسموح']);
  });

  it('asks for a mode first', () => {
    expect(markerIssues(label({ markerMode: null }))).toContain('اختر نوع السؤال: تسمية العلامات أو تحديد الموضع');
  });
});
