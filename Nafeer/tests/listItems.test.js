import { describe, expect, test } from 'vitest';
import { listContent, listRows, listWithKnownConcepts } from '@/lib/listItems';

// The shapes LessonMapper.parseListItems reads.
describe('list items', () => {
  test('a plain list stays one item per line', () => {
    const rows = listRows('أ\n\nب\n', { style: 'bullet' });
    expect(rows).toEqual([{ text: 'أ', conceptRef: null, level: 0 }, { text: 'ب', conceptRef: null, level: 0 }]);
    expect(listContent(rows)).toEqual({ content: 'أ\nب', hasConceptLinks: false });
  });

  test('links and sub-items write the JSON form, and read back the same', () => {
    const rows = [
      { text: 'الصخور النارية', conceptRef: 'c1', level: 0 },
      { text: 'البازلت', conceptRef: null, level: 1 },
      { text: 'الجرانيت', conceptRef: 'c2', level: 1 },
      { text: 'الرسوبية', conceptRef: null, level: 0 },
    ];
    const saved = listContent(rows);
    expect(saved.hasConceptLinks).toBe(true);
    expect(JSON.parse(saved.content)).toEqual([
      { text: 'الصخور النارية', conceptRef: 'c1', children: [{ text: 'البازلت' }, { text: 'الجرانيت', conceptRef: 'c2' }] },
      { text: 'الرسوبية' },
    ]);
    expect(listRows(saved.content, { hasConceptLinks: true })).toEqual(rows);
  });

  test('empty rows go, and a sub-item with nothing above becomes an item', () => {
    expect(listContent([{ text: ' ', level: 0 }, { text: 'ب', level: 1 }])).toEqual({ content: 'ب', hasConceptLinks: false });
  });

  test('string children and unreadable JSON are read as the app reads them', () => {
    expect(listRows('[{"text":"أ","children":["ب"]}]', null).map((r) => [r.text, r.level])).toEqual([['أ', 0], ['ب', 1]]);
    expect(listRows('[not json', { hasConceptLinks: true })).toEqual([{ text: '[not json', conceptRef: null, level: 0 }]);
  });

  test('a release keeps only links to concepts it carries', () => {
    const content = JSON.stringify([{ text: 'أ', conceptRef: 'c1', children: [{ text: 'ب', conceptRef: 'gone' }] }]);
    const { content: out, dropped } = listWithKnownConcepts(content, { hasConceptLinks: true }, new Set(['c1']));
    expect(dropped).toEqual(['gone']);
    expect(JSON.parse(out)).toEqual([{ text: 'أ', conceptRef: 'c1', children: [{ text: 'ب' }] }]);
    expect(listWithKnownConcepts('أ\nب', null, new Set())).toEqual({ content: 'أ\nب', dropped: [] });
  });
});
