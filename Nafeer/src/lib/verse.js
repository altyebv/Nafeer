// ─── VERSE blocks ─────────────────────────────────────────────────────────────
// A Quran passage or poetry. The text is the block's content, one آية or بيت
// per line (a بيت's halves split by " | "). Everything else is in metadata, in
// the shape Basheer's parseVerseMetadata reads (docs/contract.md §3):
//
//   { variant: 'quran' | 'poetry', surah, ayah, pieceId, pieceLines: [from, to],
//     words: [{ line, word, meaning }], meanings: [{ line, text }] }
//
// Quran text stays clean: glosses are found in it by matching, never marked up.

export const VERSE_VARIANTS = ['quran', 'poetry'];

/** Metadata as an object, whether stored as one or as a JSON string (restored content). */
export function readVerseMeta(metadata) {
  let m = metadata;
  if (typeof m === 'string') {
    try { m = JSON.parse(m); } catch { m = null; }
  }
  if (!m || typeof m !== 'object' || Array.isArray(m)) return { variant: 'poetry' };
  return m;
}

export const isQuran = (meta) => String(meta?.variant ?? '').toLowerCase() === 'quran';

/** The block's lines as Basheer counts them: trimmed, blank ones skipped. */
export function verseLines(content) {
  return String(content ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
}

/** A metadata patch to switch variant; poetry carries no surah or ayah. */
export function variantPatch(variant) {
  return variant === 'quran'
    ? { variant: 'quran' }
    : { variant: 'poetry', surah: undefined, ayah: undefined };
}

/**
 * Applies a patch to verse metadata. Keys set to undefined, '' or null are
 * removed, so the stored object holds only what the author gave; unknown keys
 * are kept.
 */
export function patchVerseMeta(metadata, patch) {
  const next = { ...readVerseMeta(metadata), ...patch };
  for (const k of Object.keys(next)) {
    if (next[k] === undefined || next[k] === null || next[k] === '') delete next[k];
  }
  if (!next.variant) next.variant = 'poetry';
  return next;
}

/** pieceLines from two inputs, or undefined when either is missing. */
export function pieceLinesFrom(from, to) {
  const a = Number.parseInt(from, 10);
  const b = Number.parseInt(to, 10);
  return Number.isInteger(a) && Number.isInteger(b) ? [a, b] : undefined;
}

/** The meanings list with line `line` set to `text` (removed when text is empty). */
export function setLineMeaning(meanings, line, text) {
  const rest = (Array.isArray(meanings) ? meanings : []).filter((m) => m?.line !== line);
  const next = text === '' ? rest : [...rest, { line, text }];
  return next.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
}

const PUNCT = /^[\s«»"'()[\]،,.؛;:!؟?…\-–—]+|[\s«»"'()[\]،,.؛;:!؟?…\-–—]+$/g;

/** The words of a line, for picking one to gloss: split on spaces and "|", outer punctuation trimmed. */
export function lineWords(line) {
  return String(line ?? '').split(/[\s|]+/).map((w) => w.replace(PUNCT, '')).filter(Boolean);
}

/**
 * What Basheer's generator would refuse, as warnings for the author. Each is
 * { kind, index?, line?, message }. Nothing here blocks a save.
 */
export function verseProblems(content, metadata) {
  const meta = readVerseMeta(metadata);
  const lines = verseLines(content);
  const n = lines.length;
  const out = [];

  if (isQuran(meta) && /[﴿﴾۝]/.test(String(content ?? ''))) {
    out.push({ kind: 'marks', message: 'ما تكتب ﴿ ﴾ ولا علامة نهاية الآية؛ التطبيق بيضيفها.' });
  }
  if (isQuran(meta) && /[<>*_[\]{}]/.test(String(content ?? ''))) {
    out.push({ kind: 'markup', message: 'نص القرآن بدون أي تنسيق؛ معاني الكلمات تتكتب تحت.' });
  }

  const pl = meta.pieceLines;
  if (pl != null) {
    const ok = Array.isArray(pl) && pl.length === 2 && pl.every(Number.isInteger) && pl[0] >= 1 && pl[1] >= pl[0];
    if (!ok) out.push({ kind: 'pieceLines', message: 'مدى سطور القطعة ما صحيح: «من» تبدأ من 1، و«إلى» ما أقل من «من».' });
    else if (n && pl[1] - pl[0] + 1 !== n) {
      out.push({ kind: 'pieceLines', message: `المدى ${pl[0]}–${pl[1]} فيهو ${pl[1] - pl[0] + 1} سطر، والنص فيهو ${n}.` });
    }
    if (!meta.pieceId) out.push({ kind: 'pieceId', message: 'في مدى سطور من غير معرّف قطعة.' });
  }

  (Array.isArray(meta.words) ? meta.words : []).forEach((w, index) => {
    if (!w || !Number.isInteger(w.line) || w.line < 1 || w.line > n) {
      out.push({ kind: 'word', index, message: 'الكلمة على سطر ما موجود.' });
    } else if (!String(w.word ?? '').trim() || !String(w.meaning ?? '').trim()) {
      out.push({ kind: 'word', index, message: 'كلمة من غير معنى (أو العكس) ما بتظهر في التطبيق.' });
    } else if (!lines[w.line - 1].includes(String(w.word).trim())) {
      out.push({ kind: 'word', index, message: `«${String(w.word).trim()}» ما مكتوبة كدا في السطر ${w.line}.` });
    }
  });

  (Array.isArray(meta.meanings) ? meta.meanings : []).forEach((m, index) => {
    if (!m || !Number.isInteger(m.line) || m.line < 1 || m.line > n) {
      out.push({ kind: 'meaning', index, line: m?.line, message: `معنى للسطر ${m?.line ?? '؟'}، والنص ما فيهو السطر دا.` });
    }
  });

  return out;
}
