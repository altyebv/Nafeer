// ─── List items ───────────────────────────────────────────────────────────────
// A LIST block's content, as Basheer reads it (LessonMapper.parseListItems):
//
//   plain    one item per line — what a list without links or sub-items is
//   linked   a JSON array, with `hasConceptLinks: true` in the metadata:
//            [{ "text": "…", "conceptRef": "concept id"?, "children": [ "…" | { "text", "conceptRef"? } ]? }]
//
// An item with a concept is underlined in the app and opens that concept's
// sheet. Sub-items go one level deep; deeper ones are not read. Item text is
// drawn plainly: no $…$ math.
//
// The editor works on flat rows, { text, conceptRef, level: 0 | 1 }, and writes
// the plain form whenever nothing needs the JSON one.

const clean = (v) => String(v ?? '').trim();

function parseArray(content) {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const itemOf = (x) => (typeof x === 'string'
  ? { text: x, conceptRef: null }
  : { text: String(x?.text ?? ''), conceptRef: x?.conceptRef || null });

/** The block's items as flat rows. JSON that cannot be read is taken line by line, as the app does. */
export function listRows(content, metadata) {
  const text = String(content ?? '');
  const array = (metadata?.hasConceptLinks || text.trim().startsWith('[')) ? parseArray(text) : null;
  if (array) {
    return array.flatMap((x) => [
      { ...itemOf(x), level: 0 },
      ...(Array.isArray(x?.children) ? x.children.map((c) => ({ ...itemOf(c), level: 1 })) : []),
    ]);
  }
  return text.split('\n').filter((l) => l.trim()).map((l) => ({ text: l.trim(), conceptRef: null, level: 0 }));
}

/**
 * Rows as the block stores them: { content, hasConceptLinks }. Empty rows are
 * dropped; a sub-item with no item above it becomes an item.
 */
export function listContent(rows) {
  const tree = [];
  for (const row of rows) {
    const text = clean(row.text);
    if (!text) continue;
    const item = row.conceptRef ? { text, conceptRef: row.conceptRef } : { text };
    if (row.level === 1 && tree.length) (tree[tree.length - 1].children ??= []).push(item);
    else tree.push(item);
  }
  const linked = tree.some((i) => i.conceptRef || i.children?.length);
  return linked
    ? { content: JSON.stringify(tree), hasConceptLinks: true }
    : { content: tree.map((i) => i.text).join('\n'), hasConceptLinks: false };
}

/**
 * The content with links to concepts outside `known` taken out, for a release
 * that does not carry those concepts (lib/releaseLinks.js).
 * @returns {{ content: string, dropped: string[] }}
 */
export function listWithKnownConcepts(content, metadata, known) {
  const text = String(content ?? '');
  const array = (metadata?.hasConceptLinks || text.trim().startsWith('[')) ? parseArray(text) : null;
  if (!array) return { content: text, dropped: [] };
  const dropped = [];
  const keep = (x) => {
    if (!x || typeof x !== 'object' || !x.conceptRef || known.has(x.conceptRef)) return x;
    dropped.push(x.conceptRef);
    const { conceptRef, ...rest } = x;
    return rest;
  };
  const next = array.map((x) => {
    const item = keep(x);
    return Array.isArray(item?.children) ? { ...item, children: item.children.map(keep) } : item;
  });
  return dropped.length ? { content: JSON.stringify(next), dropped } : { content: text, dropped };
}
