import { describe, it, expect } from 'vitest';
import {
  blockGoesToApp, blockMetadataForApp, styleKey, metadataObject,
  pieceLessons, pieceForApp, questionGoesToApp, questionForApp,
} from '@/lib/appExport';
import { normalizePiece, verseFromPiece, verseProblems } from '@/lib/verse';
import { gradeLabels } from '@/lib/markerQuestion';

// ─── What the Basheer app reads (docs/contract.md) ────────────────────────────

describe('block metadata for the app', () => {
  it('lower-cases highlight box and list styles (G1)', () => {
    expect(JSON.parse(blockMetadataForApp('HIGHLIGHT_BOX', { style: 'DEFINITION' }))).toEqual({ style: 'definition' });
    expect(JSON.parse(blockMetadataForApp('LIST', '{"style":"NUMBERED"}'))).toEqual({ style: 'numbered' });
  });

  it('passes other metadata through as a string', () => {
    expect(blockMetadataForApp('VERSE', { variant: 'quran' })).toBe('{"variant":"quran"}');
    expect(blockMetadataForApp('HEADING', '{"level":3}')).toBe('{"level":3}');
    expect(blockMetadataForApp('TEXT', null)).toBeNull();
  });

  it('reads a stored style in either case', () => {
    expect(styleKey('definition', 'NOTE')).toBe('DEFINITION');
    expect(styleKey(undefined, 'NOTE')).toBe('NOTE');
  });

  it('sends every block type but the Nafeer-only checkpoint', () => {
    expect(blockGoesToApp('VERSE')).toBe(true);
    expect(blockGoesToApp('WIDGET')).toBe(true);
    expect(blockGoesToApp('QUESTION')).toBe(false);
  });
});

describe('restored metadata (G5)', () => {
  it('parses a JSON object string and keeps anything else', () => {
    expect(metadataObject('{"style":"note"}')).toEqual({ style: 'note' });
    expect(metadataObject('[1,2]')).toBe('[1,2]');
    expect(metadataObject('not json')).toBe('not json');
    expect(metadataObject({ a: 1 })).toEqual({ a: 1 });
    expect(metadataObject(undefined)).toBeNull();
  });
});

describe('memorization pieces (G2)', () => {
  const units = [{ contentId: 'U2', order: 2 }, { contentId: 'U1', order: 1 }];
  const lessons = [
    { contentId: 'L_U2', unitContentId: 'U2', order: 1 },
    { contentId: 'L_U1b', unitContentId: 'U1', order: 2 },
    { contentId: 'L_U1a', unitContentId: 'U1', order: 1 },
  ];
  const sections = lessons.map((l) => ({ contentId: `S_${l.contentId}`, lessonContentId: l.contentId }));
  const verse = (lesson, pieceId) => ({ type: 'VERSE', sectionContentId: `S_${lesson}`, metadata: { variant: 'quran', pieceId } });

  it('takes the first lesson, in unit then lesson order, that shows the piece', () => {
    const blocks = [verse('L_U2', 'pc_a'), verse('L_U1b', 'pc_a'), verse('L_U1a', 'pc_b'),
      { type: 'VERSE', sectionContentId: 'S_L_U1a', metadata: '{"pieceId":"pc_c"}' }];
    const of = pieceLessons({ units, lessons, sections, blocks });
    expect(of.get('pc_a')).toBe('L_U1b');
    expect(of.get('pc_b')).toBe('L_U1a');
    expect(of.get('pc_c')).toBe('L_U1a');
  });

  it('writes the PieceJson shape', () => {
    const piece = { contentId: 'pc_a', kind: 'QURAN', title: 'النور', lines: [' a ', '', 'b'], surah: 'النور', ayahFrom: 1, ayahTo: 2, order: 3 };
    expect(pieceForApp(piece, 'L1')).toEqual({
      id: 'pc_a', kind: 'QURAN', title: 'النور', lines: ['a', 'b'], poet: null,
      surah: 'النور', ayahFrom: 1, ayahTo: 2, lessonId: 'L1', order: 3,
    });
  });

  it('validates a piece and fills ayahTo from the lines', () => {
    expect(normalizePiece({ kind: 'QURAN', title: 'x', lines: 'a\nb\n', ayahFrom: '39' }).value)
      .toMatchObject({ kind: 'QURAN', lines: ['a', 'b'], ayahFrom: 39, ayahTo: 40, poet: null });
    expect(normalizePiece({ title: '', lines: 'a' }).error).toBeTruthy();
    expect(normalizePiece({ title: 'x', lines: ' ' }).error).toBeTruthy();
    expect(normalizePiece({ kind: 'QURAN', title: 'x', lines: 'a', ayahFrom: 5, ayahTo: 3 }).error).toBeTruthy();
  });

  it('fills a verse from lines of a piece, numbered from its first ayah', () => {
    const piece = { id: 'pc', kind: 'QURAN', surah: 'النور', ayahFrom: 35, lines: ['a', 'b', 'c', 'd'] };
    expect(verseFromPiece(piece, 2, 3)).toEqual({
      content: 'b\nc',
      patch: { pieceId: 'pc', pieceLines: [2, 3], variant: 'quran', surah: 'النور', ayah: '36–37' },
    });
    expect(verseFromPiece(piece).patch.pieceLines).toBeUndefined();
  });

  it('warns when the piece is missing or the range does not fit it', () => {
    const pieces = [{ id: 'pc', lines: ['a', 'b'] }];
    expect(verseProblems('a', { pieceId: 'nope' }, pieces).map((p) => p.kind)).toContain('pieceId');
    expect(verseProblems('a\nb\nc', { pieceId: 'pc', pieceLines: [1, 3] }, pieces).map((p) => p.message).join())
      .toMatch(/2 سطر/);
    expect(verseProblems('a', { pieceId: 'pc' }, pieces).map((p) => p.kind)).toContain('pieceLines');
    expect(verseProblems('a\nb', { pieceId: 'pc' }, pieces)).toEqual([]);
  });
});

describe('marker questions (G7)', () => {
  const label = {
    contentId: 'q1', type: 'IMAGE_MARKER', markerMode: 'label', imageUrl: 'https://x/cell.png',
    markers: [
      { id: 'm1', x: 0.5, y: 0.4, label: '1', answer: 'النواة' },
      { id: 'm2', x: 0.7, y: 0.3, label: '2', answer: ' الميتوكوندريا ' },
    ],
    options: ['الريبوسوم'],
  };
  const dto = { id: 'q1', type: 'IMAGE_MARKER', options: '["الريبوسوم"]', markers: label.markers, tableData: null, correctAnswer: 'MARKER_LABELS' };

  it('sends a valid label question as a FIGURE PIN question', () => {
    expect(questionGoesToApp(label)).toBe(true);
    const out = questionForApp(label, dto);
    expect(out).toMatchObject({ id: 'q1', type: 'FIGURE', options: null, markers: [] });
    const table = JSON.parse(out.tableData);
    expect(table.variant).toBe('PIN');
    expect(table.pins).toEqual([
      { id: 'm1', x: 0.5, y: 0.4, label: 'النواة' },
      { id: 'm2', x: 0.7, y: 0.3, label: 'الميتوكوندريا' },
    ]);
    expect([...table.suggestions].sort()).toEqual(['الريبوسوم', 'الميتوكوندريا', 'النواة'].sort());
  });

  it("keeps the app's answer key the same as Nafeer's grading", () => {
    const pins = JSON.parse(questionForApp(label, dto).tableData).pins;
    const picks = Object.fromEntries(pins.map((p) => [p.id, p.label]));
    expect(gradeLabels(label, picks).score).toBe(1);
  });

  it('keeps locate and unfinished marker questions out', () => {
    expect(questionGoesToApp({ ...label, markerMode: 'locate', markers: [{ id: 'm', x: 0.5, y: 0.5, label: 'x', radius: 0.06 }] })).toBe(false);
    expect(questionGoesToApp({ ...label, markers: [label.markers[0]] })).toBe(false);
  });

  it('leaves other questions as they are', () => {
    const mcq = { type: 'MCQ' };
    expect(questionGoesToApp(mcq)).toBe(true);
    expect(questionForApp(mcq, { id: 'q2', type: 'MCQ' })).toEqual({ id: 'q2', type: 'MCQ' });
  });
});
