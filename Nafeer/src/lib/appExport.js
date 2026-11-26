// ─── What the Basheer app reads ───────────────────────────────────────────────
// Shared by every path that writes content for the app: /api/export and the
// publish pipeline's full export and delta bundles (lib/publishSubject.js).
// docs/contract.md is the reference.

/** Whether a block of this type goes to the app: all but QUESTION, a Nafeer-only checkpoint placeholder. */
export const blockGoesToApp = (type) => type !== 'QUESTION';

// Nafeer stores these styles in upper case (DEFINITION, NUMBERED); the app
// only matches lower case, and reads anything else as a note or a bullet list.
const LOWER_CASE_STYLE = new Set(['HIGHLIGHT_BOX', 'LIST']);

/**
 * Block metadata as Nafeer keeps it: an object. The app's files carry it as a
 * JSON string; a string that holds a JSON object is parsed, anything else is
 * kept as it is.
 */
export function metadataObject(value) {
  if (typeof value !== 'string') return value ?? null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
}

const asString = (value) => (value == null ? null : typeof value === 'string' ? value : JSON.stringify(value));

/** A block's metadata as the app takes it: a JSON string, with style values in lower case. */
export function blockMetadataForApp(type, metadata) {
  if (metadata == null) return null;
  if (!LOWER_CASE_STYLE.has(type)) return asString(metadata);
  let m = metadata;
  if (typeof m === 'string') {
    try { m = JSON.parse(m); } catch { return metadata; }
  }
  if (!m || typeof m !== 'object' || Array.isArray(m) || typeof m.style !== 'string') return asString(metadata);
  return JSON.stringify({ ...m, style: m.style.toLowerCase() });
}

/**
 * A stored style as the editor's key (NOTE, NUMBERED …). Content restored
 * from the app's own files carries lower case.
 */
export const styleKey = (style, fallback) => (typeof style === 'string' && style ? style.toUpperCase() : fallback);

// ── Memorization pieces ───────────────────────────────────────────────────────

const parseMeta = (metadata) => {
  if (metadata && typeof metadata === 'object') return metadata;
  if (typeof metadata !== 'string') return null;
  try { return JSON.parse(metadata); } catch { return null; }
};

/**
 * pieceId → the lesson that teaches it: the first lesson, in unit then lesson
 * order, with a VERSE block naming the piece. Only lessons, sections and
 * blocks given here count, so pass the exported ones.
 */
export function pieceLessons({ units = [], lessons = [], sections = [], blocks = [] }) {
  const unitOrder = new Map(units.map((u) => [u.contentId, u.order ?? 0]));
  const ordered = [...lessons].sort((a, b) =>
    (unitOrder.get(a.unitContentId) ?? 0) - (unitOrder.get(b.unitContentId) ?? 0) || (a.order ?? 0) - (b.order ?? 0));
  const lessonOfSection = new Map(sections.map((s) => [s.contentId, s.lessonContentId]));
  const piecesOfLesson = new Map();
  for (const b of blocks) {
    if (b.type !== 'VERSE') continue;
    const pieceId = parseMeta(b.metadata)?.pieceId;
    const lessonId = lessonOfSection.get(b.sectionContentId);
    if (typeof pieceId !== 'string' || !pieceId.trim() || !lessonId) continue;
    if (!piecesOfLesson.has(lessonId)) piecesOfLesson.set(lessonId, new Set());
    piecesOfLesson.get(lessonId).add(pieceId.trim());
  }
  const out = new Map();
  for (const l of ordered) {
    for (const id of piecesOfLesson.get(l.contentId) || []) if (!out.has(id)) out.set(id, l.contentId);
  }
  return out;
}

/** A piece as the app's PieceJson (core/data/seed/ExportModels.kt). */
export function pieceForApp(piece, lessonId = null) {
  return {
    id:       piece.contentId,
    kind:     piece.kind === 'QURAN' ? 'QURAN' : 'POETRY',
    title:    piece.title,
    lines:    (piece.lines || []).map((l) => String(l).trim()).filter(Boolean),
    poet:     piece.poet     || null,
    surah:    piece.surah    || null,
    ayahFrom: Number.isInteger(piece.ayahFrom) ? piece.ayahFrom : null,
    ayahTo:   Number.isInteger(piece.ayahTo)   ? piece.ayahTo   : null,
    lessonId: lessonId || null,
    order:    piece.order || 0,
  };
}
