// ─── Editor ↔ Atlas sync rules ────────────────────────────────────────────────
// Pure functions shared by the content/subject stores and useAtlasSync.
//
// Every lesson, section and block in the editor's local cache carries two
// bookkeeping fields, persisted with it:
//   _v      the server version the local copy is based on. Absent means the
//           item has never been saved (or predates this scheme).
//   _dirty  true while the item has local edits the server hasn't seen.
//
// A save sends only dirty items, each with `baseVersion: _v`; the server
// refuses any whose base is stale (see lib/api/versionCheck.js). Loading a
// lesson merges the server copy in without dropping local work. Neither costs
// a request of its own: the save request and the lesson GET already happen.

export const LESSON_FIELDS = [
  'title', 'estimatedMinutes', 'summary', 'metadata', 'parentLesson',
  'variationType', 'variationNote', 'groupId', 'groupTitle', 'groupMetadata',
];
export const SECTION_FIELDS = ['title', 'order', 'learningType', 'kind', 'conceptIds', 'partIndex'];
export const BLOCK_FIELDS   = ['sectionId', 'type', 'content', 'order', 'conceptRef', 'caption', 'metadata'];

// ── Server document → store shape ─────────────────────────────────────────────

export const fromServerLesson = (l) => ({
  title:            l.title,
  estimatedMinutes: l.estimatedMinutes ?? 15,
  summary:          l.summary          ?? null,
  metadata:         l.metadata         ?? null,
  parentLesson:     l.parentLesson     ?? null,
  variationType:    l.variationType    ?? null,
  variationNote:    l.variationNote    ?? null,
  groupId:          l.groupId          ?? null,
  groupTitle:       l.groupTitle       ?? null,
  groupMetadata:    l.groupMetadata    ?? null,
  atlasStatus:      l.status           || 'draft',
  // Server-owned like the status: returned / round / when. Never edited
  // locally, so mergeLesson takes the server's copy even over a dirty draft.
  reviewState:      l.reviewState      ?? null,
  // Whose it is (docs/team-leads.md L4) — server-owned too. `owner` comes
  // from the subject list; a lesson GET carries ownerId / createdBy.
  ...ownership(l),
  _v:               l.version          ?? 1,
});

function ownership(l) {
  const owner = l.owner ?? (l.ownerId || l.createdBy ? String(l.ownerId || l.createdBy) : undefined);
  return {
    ...(owner !== undefined && { owner }),
    ...(l.unclaimed !== undefined && { unclaimed: !!l.unclaimed }),
  };
}

export const fromServerSection = (s) => ({
  id:           s.contentId,
  lessonId:     s.lessonContentId,
  title:        s.title,
  order:        s.order,
  learningType: s.learningType || 'UNDERSTANDING',
  kind:         s.kind         || 'GENERAL',
  conceptIds:   s.conceptIds   || [],
  partIndex:    s.partIndex    ?? 0,
  _v:           s.version      ?? 1,
});

export const fromServerBlock = (b) => ({
  id:         b.contentId,
  sectionId:  b.sectionContentId,
  type:       b.type,
  content:    b.content    || '',
  order:      b.order,
  conceptRef: b.conceptRef || null,
  caption:    b.caption    || null,
  metadata:   b.metadata   ?? null,
  mediaPath:  b.mediaPath  || null,
  _v:         b.version    ?? 1,
});

// ── Store shape → save payload ────────────────────────────────────────────────

export const lessonPayload = (l) => ({
  title:            l.title,
  estimatedMinutes: l.estimatedMinutes,
  summary:          l.summary       || null,
  metadata:         l.metadata      || null,
  parentLesson:     l.parentLesson  || null,
  variationType:    l.variationType || null,
  variationNote:    l.variationNote || null,
  groupId:          l.groupId       || null,
  groupTitle:       l.groupTitle    || null,
  groupMetadata:    l.groupMetadata || null,
  baseVersion:      l._v,
});

export const sectionPayload = (s, subjectId) => ({
  contentId: s.id, subjectId, lessonContentId: s.lessonId,
  title: s.title, order: s.order,
  learningType: s.learningType || 'UNDERSTANDING', kind: s.kind || 'GENERAL',
  conceptIds: s.conceptIds || [], partIndex: s.partIndex ?? 0,
  baseVersion: s._v,
});

export const blockPayload = (b, subjectId) => ({
  contentId: b.id, sectionContentId: b.sectionId, type: b.type, subjectId,
  content: b.content || '', order: b.order, conceptRef: b.conceptRef || null,
  caption: b.caption || null, metadata: b.metadata || null,
  baseVersion: b._v,
});

// ── Comparison ────────────────────────────────────────────────────────────────

const canon = (v) => {
  if (v === undefined || v === '') return null;
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  }
  return v;
};

export const sameFields = (a, b, fields) =>
  fields.every((f) => JSON.stringify(canon(a[f])) === JSON.stringify(canon(b[f])));

export const hasVersion = (item) => item?._v !== undefined && item?._v !== null;

// ── Merge ─────────────────────────────────────────────────────────────────────
// Folds the server's copy of a set of items into the local copy:
//   local dirty            → keep local; the save checks its base version
//   local clean            → take the server copy
//   local from old cache   → take the server copy if equal, else keep local as
//                            an edit on top of the server version (what a save
//                            did before this scheme)
//   server only            → add
//   local only, never saved→ keep, marked dirty so the next save creates it
//   local only, had _v     → deleted on the server: drop it, unless it holds
//                            unsaved work — then keep it so the save reports it
function mergeItems(local, server, fields, keepAnyway = () => false) {
  const serverById = new Map(server.map((s) => [s.id, s]));
  const out = [];

  for (const l of local) {
    const s = serverById.get(l.id);
    if (s) {
      serverById.delete(l.id);
      if (l._dirty) out.push(l);
      else if (!hasVersion(l)) out.push(sameFields(l, s, fields) ? s : { ...l, _v: s._v, _dirty: true });
      else out.push(s);
    } else if (!hasVersion(l)) {
      out.push({ ...l, _dirty: true });
    } else if (l._dirty || keepAnyway(l)) {
      out.push(l);
    }
  }

  return [...out, ...serverById.values()];
}

// Returns new { sections, blocks } arrays for the whole store, with one
// lesson's content merged against `serverSections` (the lesson GET's
// `sections`, each carrying its `blocks`).
export function mergeLessonContent(state, lessonId, serverSections = []) {
  const serverSecs   = serverSections.map(fromServerSection);
  const serverBlocks = serverSections.flatMap((s) => (s.blocks || []).map(fromServerBlock));

  const localSecs   = state.sections.filter((s) => s.lessonId === lessonId);
  const localSecIds = new Set(localSecs.map((s) => s.id));
  const serverSecIds = new Set(serverSecs.map((s) => s.id));
  const localBlocks = state.blocks.filter((b) => localSecIds.has(b.sectionId) || serverSecIds.has(b.sectionId));

  const blocks = mergeItems(localBlocks, serverBlocks, BLOCK_FIELDS);
  const holdsWork = new Set(blocks.filter((b) => b._dirty).map((b) => b.sectionId));
  const sections = mergeItems(localSecs, serverSecs, SECTION_FIELDS, (s) => holdsWork.has(s.id));

  const keptSecIds   = new Set(sections.map((s) => s.id));
  const mergedIds    = new Set(blocks.map((b) => b.id));
  const replaced     = new Set(localBlocks);
  const lessonBlocks = blocks.filter((b) => keptSecIds.has(b.sectionId));

  return {
    sections: [...state.sections.filter((s) => s.lessonId !== lessonId), ...sections],
    blocks: [
      ...state.blocks.filter((b) => !replaced.has(b) && !mergedIds.has(b.id)),
      ...lessonBlocks,
    ],
  };
}

// One lesson's meta, local vs incoming (store shape — fromServerLesson output
// or a bootstrap row). Same rules as mergeItems. An incoming row without a
// version (the admin export carries none) only refreshes clean lessons.
export function mergeLesson(local, incoming) {
  if (!local) return incoming;
  const status = incoming.atlasStatus ?? local.atlasStatus;
  const reviewState = incoming.reviewState !== undefined ? incoming.reviewState : local.reviewState;
  // Ownership is the server's, like the status: never kept from a stale copy.
  const owned = {
    owner:     incoming.owner     !== undefined ? incoming.owner     : local.owner,
    unclaimed: incoming.unclaimed !== undefined ? incoming.unclaimed : local.unclaimed,
  };
  if (local._dirty) return { ...local, atlasStatus: status, reviewState, ...owned };
  if (!hasVersion(local) && hasVersion(incoming) && !sameFields(local, incoming, LESSON_FIELDS)) {
    return { ...local, atlasStatus: status, reviewState, ...owned, _v: incoming._v, _dirty: true };
  }
  return { ...local, ...incoming, _dirty: false };
}

// After a save: items still identical to what was sent are clean at the new
// version; items edited while the request was in flight keep `_dirty` but
// move their base to the version just written.
export function applySaved(items, sent, savedDocs) {
  const sentById = new Map(sent.map((i) => [i.id, i]));
  const version  = new Map(savedDocs.map((d) => [d.contentId, d.version ?? 1]));
  return items.map((item) => {
    if (!version.has(item.id)) return item;
    const _v = version.get(item.id);
    return item === sentById.get(item.id) ? { ...item, _v, _dirty: false } : { ...item, _v };
  });
}
