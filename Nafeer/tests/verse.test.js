import { describe, it, expect } from 'vitest';
import {
  readVerseMeta, verseLines, variantPatch, patchVerseMeta, pieceLinesFrom,
  setLineMeaning, lineWords, verseProblems,
} from '@/lib/verse';
import { fromServerBlock, blockPayload } from '@/lib/editorSync';

// ─── VERSE blocks ─────────────────────────────────────────────────────────────
// What the editor writes must come out of export in the shape Basheer's
// parseVerseMetadata (VerseMetadata.kt) reads. `parseVerse` below is a line-by-
// line port of that function, so a change on Basheer's side should be mirrored.

function parseVerse(metadata) {
  let root = null;
  try { root = JSON.parse(metadata); } catch { root = null; }
  if (!root || typeof root !== 'object' || Array.isArray(root)) root = null;
  const prim = (v) => (v !== null && typeof v !== 'object' ? v : undefined);
  const text = (o, k) => { const v = prim(o?.[k]); const s = v == null ? '' : String(v).trim(); return s || null; };
  const int = (o, k) => { const v = prim(o?.[k]); const n = typeof v === 'number' ? v : typeof v === 'string' && /^-?\d+$/.test(v) ? Number(v) : NaN; return Number.isInteger(n) ? n : null; };
  const list = (k) => (Array.isArray(root?.[k]) ? root[k] : []).filter((e) => e && typeof e === 'object' && !Array.isArray(e));

  const pl = Array.isArray(root?.pieceLines) ? root.pieceLines.map((x) => int({ x }, 'x')).filter((x) => x != null) : null;
  const range = pl && pl.length === 2 && pl[0] >= 1 && pl[1] >= pl[0] ? pl : null;
  const words = list('words').flatMap((w) => {
    const line = int(w, 'line');
    if (line == null || line < 1) return [];
    const word = text(w, 'word'); const meaning = text(w, 'meaning');
    return word && meaning ? [{ line, word, meaning }] : [];
  });
  const meanings = {};
  for (const m of list('meanings')) {
    const line = int(m, 'line');
    const t = text(m, 'text');
    if (line != null && line >= 1 && t) meanings[line] = t;
  }
  return {
    variant: (text(root, 'variant') ?? '').toLowerCase() === 'quran' ? 'QURAN' : 'POETRY',
    surah: text(root, 'surah'), ayah: text(root, 'ayah'), pieceId: text(root, 'pieceId'),
    pieceLines: range, words, meanings,
  };
}

// The export's block mapping: metadata stringified (coerceMixedToString).
const exportBlock = (doc) => ({
  id: doc.contentId, type: doc.type, content: doc.content || '', order: doc.order,
  conceptRef: doc.conceptRef || null, caption: doc.caption || null,
  metadata: doc.metadata == null ? null : typeof doc.metadata === 'string' ? doc.metadata : JSON.stringify(doc.metadata),
});

// An editor block through save (store → payload → Mongo doc) and export.
function roundTrip(block) {
  const payload = blockPayload({ ...block, sectionId: 'sec_1', _v: 1 }, 'ARABIC');
  const doc = { ...payload, version: 1 };
  const reloaded = fromServerBlock(doc);
  return { reloaded, exported: JSON.parse(JSON.stringify(exportBlock(doc))) };
}

const nur = [
  'أَوْ كَظُلُمَاتٍ فِي بَحْرٍ لُّجِّيٍّ يَغْشَاهُ مَوْجٌ',
  'وَمَن لَّمْ يَجْعَلِ اللَّهُ لَهُ نُورًا فَمَا لَهُ مِن نُّورٍ',
].join('\n');

describe('a Quran verse block', () => {
  let meta = patchVerseMeta(null, variantPatch('quran'));
  meta = patchVerseMeta(meta, { surah: 'النور', ayah: '40–41' });
  meta = patchVerseMeta(meta, { pieceId: 'qr_nur', pieceLines: pieceLinesFrom('3', '4') });
  meta = patchVerseMeta(meta, { words: [{ line: 1, word: 'لُّجِّيٍّ', meaning: 'عميق كثير الماء' }] });
  meta = patchVerseMeta(meta, { meanings: setLineMeaning([], 2, 'من لم يهده الله فلا هادي له') });
  const block = { id: 'b1', type: 'VERSE', content: nur, order: 1, metadata: meta };

  it('round-trips save and reload unchanged', () => {
    const { reloaded } = roundTrip(block);
    expect(reloaded.metadata).toEqual(meta);
    expect(reloaded.content).toBe(nur);
  });

  it('exports metadata as a string Basheer parses', () => {
    const { exported } = roundTrip(block);
    expect(exported.type).toBe('VERSE');
    expect(typeof exported.metadata).toBe('string');
    expect(parseVerse(exported.metadata)).toEqual({
      variant: 'QURAN', surah: 'النور', ayah: '40–41', pieceId: 'qr_nur', pieceLines: [3, 4],
      words: [{ line: 1, word: 'لُّجِّيٍّ', meaning: 'عميق كثير الماء' }],
      meanings: { 2: 'من لم يهده الله فلا هادي له' },
    });
  });

  it('keeps the text clean: no glosses in content', () => {
    expect(roundTrip(block).exported.content).toBe(nur);
    expect(verseProblems(nur, meta)).toEqual([]);
  });

  it('warns about ﴿ ﴾ and markup typed into Quran text', () => {
    const kinds = verseProblems('﴿ **أَوْ** ﴾', meta).map((p) => p.kind);
    expect(kinds).toContain('marks');
    expect(kinds).toContain('markup');
  });
});

describe('a poetry verse block', () => {
  const content = 'إذا غامرت في شرف مروم | فلا تقنع بما دون النجوم';
  const meta = patchVerseMeta(null, { words: [{ line: 1, word: 'مروم', meaning: 'مطلوب' }] });
  const block = { id: 'b2', type: 'VERSE', content, order: 2, caption: 'المتنبي', metadata: meta };

  it('defaults to poetry and exports the caption beside it', () => {
    const { exported } = roundTrip(block);
    expect(exported.caption).toBe('المتنبي');
    expect(parseVerse(exported.metadata)).toMatchObject({ variant: 'POETRY', surah: null, ayah: null, pieceLines: null });
  });

  it('drops surah and ayah when switched to poetry', () => {
    const q = patchVerseMeta(null, { variant: 'quran', surah: 'النور', ayah: '1' });
    expect(patchVerseMeta(q, variantPatch('poetry'))).toEqual({ variant: 'poetry' });
  });
});

describe('verse helpers', () => {
  it('reads metadata stored as a string (restored content)', () => {
    expect(readVerseMeta('{"variant":"quran","surah":"الفاتحة"}')).toEqual({ variant: 'quran', surah: 'الفاتحة' });
    expect(readVerseMeta('not json')).toEqual({ variant: 'poetry' });
    expect(readVerseMeta(null)).toEqual({ variant: 'poetry' });
  });

  it('counts lines as Basheer does', () => {
    expect(verseLines(' a \n\n b \n')).toEqual(['a', 'b']);
  });

  it('removes emptied keys and keeps unknown ones', () => {
    expect(patchVerseMeta({ variant: 'quran', surah: 'x', extra: 1 }, { surah: '' })).toEqual({ variant: 'quran', extra: 1 });
  });

  it('sets, replaces and clears a line meaning', () => {
    let m = setLineMeaning([], 2, 'b');
    m = setLineMeaning(m, 1, 'a');
    m = setLineMeaning(m, 2, 'bb');
    expect(m).toEqual([{ line: 1, text: 'a' }, { line: 2, text: 'bb' }]);
    expect(setLineMeaning(m, 1, '')).toEqual([{ line: 2, text: 'bb' }]);
  });

  it('splits a line into words to pick, without punctuation or the bayt bar', () => {
    expect(lineWords('قِفا نَبكِ، مِن | ذِكرى «حَبيبٍ»')).toEqual(['قِفا', 'نَبكِ', 'مِن', 'ذِكرى', 'حَبيبٍ']);
  });

  it('flags what Basheer generator would refuse', () => {
    const content = 'سطر واحد';
    const meta = {
      variant: 'poetry', pieceLines: [2, 4],
      words: [{ line: 1, word: 'غير', meaning: 'x' }, { line: 3, word: 'سطر', meaning: 'y' }],
      meanings: [{ line: 5, text: 'z' }],
    };
    const kinds = verseProblems(content, meta).map((p) => `${p.kind}${p.index ?? ''}`);
    expect(kinds).toEqual(expect.arrayContaining(['pieceLines', 'pieceId', 'word0', 'word1', 'meaning0']));
  });
});
