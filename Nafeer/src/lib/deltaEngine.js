/**
 * lib/deltaEngine.js
 *
 * Core delta-publishing engine for Nafeer.
 *
 * ── What this does ────────────────────────────────────────────────────────────
 *
 * Takes a full content snapshot (all approved entities for a subject) and the
 * previous Firestore manifest entry for that subject, then:
 *
 *  1. Computes which entities changed since the last publish by comparing
 *     entity `updatedAt` timestamps against the manifest's `publishedAt`.
 *     New entities (not in the previous entityIndex) are always included.
 *
 *  2. Detects deleted entities — ids present in the previous entityIndex but
 *     absent from the current DB snapshot.
 *
 *  3. Groups changed entities by type into DeltaPatch bundle payloads.
 *
 *  4. Serialises, checksums, and uploads each bundle to Supabase.
 *
 *  5. Returns the updated entityIndex, patches array, and deletion maps
 *     for the caller (publish route) to write into the Firestore manifest.
 *
 * ── Design rules ──────────────────────────────────────────────────────────────
 *
 *  - Bundles are immutable once uploaded (their path encodes a content hash),
 *    so they can be served from CDN edge caches indefinitely.
 *  - If nothing changed for a type, no bundle is created — zero-byte publishes
 *    cost nothing beyond the Firestore manifest write.
 *  - The engine is pure (no Firestore writes) — the publish route owns I/O.
 *  - Entity version tokens are SHA-256(contentId + updatedAt.toISOString())
 *    truncated to 16 hex chars — cheap, deterministic, collision-resistant
 *    enough for this use case.
 */

import crypto from 'crypto';
import { uploadFile, getPublicUrl } from '@/lib/supabase';

const EXPORTS_BUCKET = process.env.SUPABASE_EXPORTS_BUCKET || 'content-exports';

// ── Entity type taxonomy (mirrors Android DeltaEntityType) ────────────────────

export const ENTITY_TYPES = {
  SUBJECT:   'SUBJECT',
  TAG:       'TAG',
  CONCEPT:   'CONCEPT',
  UNIT:      'UNIT',
  LESSON:    'LESSON',
  SECTION:   'SECTION',
  BLOCK:     'BLOCK',
  QUESTION:  'QUESTION',
  EXAM:      'EXAM',
  FEED_ITEM: 'FEED_ITEM',
};

// Apply order must match Android's DeltaEntityType.applyOrder
const APPLY_ORDER = [
  ENTITY_TYPES.SUBJECT,
  ENTITY_TYPES.TAG,
  ENTITY_TYPES.CONCEPT,
  ENTITY_TYPES.UNIT,
  ENTITY_TYPES.LESSON,
  ENTITY_TYPES.SECTION,
  ENTITY_TYPES.BLOCK,
  ENTITY_TYPES.QUESTION,
  ENTITY_TYPES.EXAM,
  ENTITY_TYPES.FEED_ITEM,
];

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Build and upload delta patch bundles for a subject publish.
 *
 * @param {object} params
 * @param {string}  params.subjectId
 * @param {string}  params.exportVersion      - Schema version string (e.g. "2.0")
 * @param {object}  params.snapshot           - Full content snapshot (all approved entities)
 * @param {object|null} params.prevEntry      - Previous Firestore manifest entry, or null for first publish
 * @returns {Promise<DeltaPublishResult>}
 */
export async function buildAndUploadDelta({
  subjectId,
  exportVersion,
  snapshot,
  prevEntry,
}) {
  // ── 1. Build entity maps from current snapshot ────────────────────────────
  const currentEntities = snapshotToEntityMaps(snapshot, subjectId);

  // ── 2. Load previous entityIndex (null on first publish) ─────────────────
  const prevIndex = prevEntry?.entityIndex ?? null;
  const prevPublishedAt = prevEntry?.updatedAt ? new Date(prevEntry.updatedAt) : null;

  // ── 3. Diff: find changed, new, and deleted entities per type ─────────────
  const { changedByType, deletedByType, newEntityIndex } =
    computeDelta(currentEntities, prevIndex, prevPublishedAt);

  // ── 3b. Ancestor cascade ──────────────────────────────────────────────────
  //
  // When a child entity (LESSON, SECTION, BLOCK) is new or changed, its parent
  // may not appear in changedByType (the parent row itself didn't change).
  // But Android's FK constraints require the parent row to exist in Room before
  // the child can be inserted. If this is a fresh install or a new subject, the
  // parent will be missing and the bundle fails with SQLITE_CONSTRAINT_FOREIGNKEY.
  //
  // Fix: for each changed child, ensure its direct parent is included in
  // changedByType. We only add parents that are genuinely absent from the
  // previous entityIndex (i.e. unknown to the device) — if the parent was
  // already synced, it's already in Room and we don't need to re-send it.
  //
  // Cascade is one level at a time (BLOCK→SECTION→LESSON→UNIT) so we process
  // them in reverse apply-order: deepest children first.
  cascadeAncestors({ changedByType, prevIndex, snapshot });

  // ── 4. Build DeltaPatch payloads and upload bundles ───────────────────────
  const patches = [];

  for (const entityType of APPLY_ORDER) {
    const changed  = changedByType[entityType]  || [];
    const deleted  = deletedByType[entityType]  || [];
    if (changed.length === 0 && deleted.length === 0) continue;

    const patch = buildPatchPayload({
      subjectId,
      exportVersion,
      entityType,
      changed,
      deleted,
      snapshot,
    });

    const bundleEntry = await uploadBundle({ subjectId, entityType, patch, entityIndex: newEntityIndex });
    patches.push(bundleEntry);
  }

  return {
    entityIndex: newEntityIndex,
    patches,
    deletedByType,
    stats: {
      changedEntities: Object.values(changedByType).reduce((s, a) => s + a.length, 0),
      deletedEntities: Object.values(deletedByType).reduce((s, a) => s + a.length, 0),
      bundlesUploaded: patches.length,
    },
  };
}

// ── Entity map builder ─────────────────────────────────────────────────────────

/**
 * Convert a full content snapshot into per-type maps of { contentId → entity }.
 * These maps are used both for diffing and for building patch payloads.
 */
function snapshotToEntityMaps(snapshot, subjectId) {
  const maps = {};

  maps[ENTITY_TYPES.SUBJECT]   = snapshot.subject
    ? { [subjectId]: snapshot.subject }
    : {};

  maps[ENTITY_TYPES.TAG]       = toMap(snapshot.tags,      'contentId');
  maps[ENTITY_TYPES.CONCEPT]   = toMap(snapshot.concepts,  'contentId');
  maps[ENTITY_TYPES.UNIT]      = toMap(snapshot.units,     'contentId');
  maps[ENTITY_TYPES.LESSON]    = toMap(snapshot.lessons,   'contentId');
  maps[ENTITY_TYPES.SECTION]   = toMap(snapshot.sections,  'contentId');
  maps[ENTITY_TYPES.BLOCK]     = toMap(snapshot.blocks,    'contentId');
  maps[ENTITY_TYPES.QUESTION]  = toMap(snapshot.questions, 'contentId');
  maps[ENTITY_TYPES.EXAM]      = toMap(snapshot.exams,     'contentId');
  maps[ENTITY_TYPES.FEED_ITEM] = toMap(snapshot.feedItems, 'contentId');

  return maps;
}

function toMap(arr, key) {
  if (!arr) return {};
  return Object.fromEntries(arr.map((item) => [item[key], item]));
}

// ── Delta computation ──────────────────────────────────────────────────────────

/**
 * Compare current entities against the previous entityIndex.
 *
 * Entity version token = sha256(contentId + updatedAt ISO string), first 16 hex chars.
 * Deterministic: same content → same token → app skips bundle.
 *
 * An entity is "changed" when:
 *   - Its version token differs from the previous entityIndex token (edit), OR
 *   - It's absent from the previous entityIndex (new entity).
 *
 * An entity is "deleted" when:
 *   - It appears in the previous entityIndex but is absent from the current snapshot.
 */
function computeDelta(currentEntities, prevIndex, prevPublishedAt) {
  const changedByType = {};
  const deletedByType = {};
  const newEntityIndex = {};

  for (const entityType of APPLY_ORDER) {
    const currentMap = currentEntities[entityType] || {};
    const prevTypeIndex = prevIndex?.[entityType] || {};

    const changedIds = [];
    const typeIndex  = {};

    // Find changed / new entities
    for (const [id, entity] of Object.entries(currentMap)) {
      const token = entityVersionToken(id, entity.updatedAt || entity.createdAt);
      typeIndex[id] = token;

      const prevToken = prevTypeIndex[id];
      if (prevToken !== token) {
        changedIds.push(id);
      }
    }

    // Find deleted entities
    const deletedIds = Object.keys(prevTypeIndex).filter((id) => !(id in currentMap));

    if (changedIds.length > 0) changedByType[entityType] = changedIds;
    if (deletedIds.length > 0) deletedByType[entityType] = deletedIds;
    if (Object.keys(typeIndex).length > 0) newEntityIndex[entityType] = typeIndex;
  }

  return { changedByType, deletedByType, newEntityIndex };
}

// ── Ancestor cascade ───────────────────────────────────────────────────────────

/**
 * Ensure that every changed child entity has its ancestor chain included in
 * changedByType when the ancestor is unknown to the device (absent from
 * prevIndex). This prevents SQLITE_CONSTRAINT_FOREIGNKEY failures on fresh
 * installs or first-time subject syncs.
 *
 * Cascade rules (child → parent FK field on the *Export shape):
 *   BLOCK   → SECTION  (block.sectionId)
 *   SECTION → LESSON   (section.lessonId)
 *   LESSON  → UNIT     (lesson.unitId)
 *
 * We only pull in a parent when it is genuinely absent from prevIndex — if the
 * device already has it stamped, resending it is wasteful (though harmless).
 *
 * Mutates changedByType in-place.
 */
function cascadeAncestors({ changedByType, prevIndex, snapshot }) {
  // Build lookup maps from the export-shaped arrays (id → export object).
  const unitById    = toMap(snapshot.unitsExport,    'id');
  const lessonById  = toMap(snapshot.lessonsExport,  'id');
  const sectionById = toMap(snapshot.sectionsExport, 'id');

  const prevUnits    = prevIndex?.[ENTITY_TYPES.UNIT]    || {};
  const prevLessons  = prevIndex?.[ENTITY_TYPES.LESSON]  || {};
  const prevSections = prevIndex?.[ENTITY_TYPES.SECTION] || {};

  // Helper: add an id to changedByType[type] if not already present.
  function ensureChanged(type, id) {
    if (!id) return;
    if (!changedByType[type]) changedByType[type] = [];
    if (!changedByType[type].includes(id)) changedByType[type].push(id);
  }

  // BLOCK → SECTION: for every changed block, ensure its parent section is
  // included if the device has never seen it.
  for (const blockId of (changedByType[ENTITY_TYPES.BLOCK] || [])) {
    const block = snapshot.blocksExport?.find((b) => b.id === blockId);
    const sectionId = block?.sectionId;
    if (sectionId && !(sectionId in prevSections)) {
      ensureChanged(ENTITY_TYPES.SECTION, sectionId);
    }
  }

  // SECTION → LESSON: for every changed section (including just-cascaded ones),
  // ensure its parent lesson is included if the device has never seen it.
  for (const sectionId of (changedByType[ENTITY_TYPES.SECTION] || [])) {
    const section = sectionById[sectionId] || snapshot.sectionsExport?.find((s) => s.id === sectionId);
    const lessonId = section?.lessonId;
    if (lessonId && !(lessonId in prevLessons)) {
      ensureChanged(ENTITY_TYPES.LESSON, lessonId);
    }
  }

  // LESSON → UNIT: for every changed lesson (including just-cascaded ones),
  // ensure its parent unit is included if the device has never seen it.
  for (const lessonId of (changedByType[ENTITY_TYPES.LESSON] || [])) {
    const lesson = lessonById[lessonId] || snapshot.lessonsExport?.find((l) => l.id === lessonId);
    const unitId = lesson?.unitId;
    if (unitId && !(unitId in prevUnits)) {
      ensureChanged(ENTITY_TYPES.UNIT, unitId);
    }
  }
}

/**
 * Deterministic version token for an entity.
 * 16 hex chars of SHA-256(id + updatedAt ISO string).
 */
function entityVersionToken(id, updatedAt) {
  const ts = updatedAt instanceof Date
    ? updatedAt.toISOString()
    : (updatedAt ? String(updatedAt) : '0');
  return crypto
    .createHash('sha256')
    .update(`${id}:${ts}`)
    .digest('hex')
    .slice(0, 16);
}

// ── Patch payload builder ──────────────────────────────────────────────────────

/**
 * Build a DeltaPatch JSON object for one entity type.
 * Carries only the changed entities + explicit deletion list.
 */
function buildPatchPayload({ subjectId, exportVersion, entityType, changed, deleted, snapshot }) {
  const base = {
    version:    exportVersion,
    subjectId,
    entityType,
    deletions:  deleted.length > 0 ? { [entityType]: deleted } : {},
  };

  switch (entityType) {
    case ENTITY_TYPES.SUBJECT:
      return { ...base, subject: snapshot.subjectExport };

    case ENTITY_TYPES.TAG:
      return { ...base, tags: filterById(snapshot.tagsExport, changed, 'id') };

    case ENTITY_TYPES.CONCEPT:
      return { ...base, concepts: filterById(snapshot.conceptsExport, changed, 'id') };

    case ENTITY_TYPES.UNIT:
      return { ...base, units: filterById(snapshot.unitsExport, changed, 'id') };

    case ENTITY_TYPES.LESSON:
      // Flat list — each lesson carries its unitId FK
      return { ...base, lessons: filterById(snapshot.lessonsExport, changed, 'id') };

    case ENTITY_TYPES.SECTION:
      // Flat list — each section carries its lessonId FK
      return { ...base, sections: filterById(snapshot.sectionsExport, changed, 'id') };

    case ENTITY_TYPES.BLOCK:
      // Flat list — each block carries its sectionId FK
      return { ...base, blocks: filterById(snapshot.blocksExport, changed, 'id') };

    case ENTITY_TYPES.QUESTION:
      return { ...base, questions: filterById(snapshot.questionsExport, changed, 'id') };

    case ENTITY_TYPES.EXAM:
      return { ...base, exams: filterById(snapshot.examsExport, changed, 'id') };

    case ENTITY_TYPES.FEED_ITEM:
      return { ...base, feedItems: filterById(snapshot.feedItemsExport, changed, 'id') };

    default:
      return base;
  }
}

function filterById(arr, ids, idField = 'id') {
  if (!arr || !ids) return [];
  const idSet = new Set(ids);
  return arr.filter((item) => idSet.has(item[idField]));
}

// ── Supabase upload ────────────────────────────────────────────────────────────

/**
 * Serialise a DeltaPatch, compute checksum, upload to Supabase, return
 * a PatchBundleEntry descriptor for the Firestore manifest.
 *
 * Bundle path:  {subjectId}/patches/{entityType}/{bundleId}.json
 * bundleId      = first 12 hex chars of sha256(payload)
 *
 * This makes bundles content-addressed — identical payloads produce the same
 * path, so re-publishing without changes is idempotent (upsert: false will
 * fail silently on the second attempt, which is fine).
 */
async function uploadBundle({ subjectId, entityType, patch, entityIndex }) {
  const jsonBuffer = Buffer.from(JSON.stringify(patch), 'utf-8');
  const sha256     = crypto.createHash('sha256').update(jsonBuffer).digest('hex');
  const bundleId   = sha256.slice(0, 12);
  const size       = jsonBuffer.length;

  const path = `${subjectId.toLowerCase()}/patches/${entityType.toLowerCase()}/${bundleId}.json`;

  // upsert: false — if the same hash was uploaded before the file is identical,
  // skip the upload rather than failing. Supabase throws on conflict with
  // upsert:false; we catch and continue.
  try {
    await uploadFile(EXPORTS_BUCKET, path, jsonBuffer, 'application/json');
  } catch (e) {
    if (!e.message?.includes('already exists') && !e.message?.includes('duplicate')) {
      throw e;
    }
    // Content-identical bundle already exists — safe to reuse the URL.
  }

  const downloadUrl = getPublicUrl(EXPORTS_BUCKET, path);
  if (!downloadUrl) {
    throw new Error(`Failed to get public URL for bundle: ${path}`);
  }

  // Build entityVersions map: entityId → first 16 chars of bundle sha256.
  // This token is what Android stamps per-entity after applying the bundle.
  // All entities in a bundle get the same token (the bundle hash), which is
  // deterministic: re-publishing identical content produces the same hash →
  // same token → Android skips the bundle.
const entityVersions = buildEntityVersionsMap(patch, sha256, entityIndex);

  return {
    bundleId,
    entityType,
    entityIds:      getAllEntityIds(patch),
    downloadUrl,
    sha256,
    size,
    entityVersions,
  };
}

/**
 * Extract all entity ids from a patch payload regardless of type.
 * Used to populate PatchBundleEntry.entityIds for dirty-set intersection on Android.
 */
function getAllEntityIds(patch) {
  const ids = [];
  if (patch.subject)    ids.push(patch.subjectId);
  if (patch.tags)       patch.tags.forEach((e)      => ids.push(e.id));
  if (patch.concepts)   patch.concepts.forEach((e)   => ids.push(e.id));
  if (patch.units)      patch.units.forEach((e)      => ids.push(e.id));
  if (patch.lessons)    patch.lessons.forEach((e)    => ids.push(e.id));
  if (patch.sections)   patch.sections.forEach((e)   => ids.push(e.id));
  if (patch.blocks)     patch.blocks.forEach((e)     => ids.push(e.id));
  if (patch.questions)  patch.questions.forEach((e)  => ids.push(e.id));
  if (patch.exams)      patch.exams.forEach((e)      => ids.push(e.id));
  if (patch.feedItems)  patch.feedItems.forEach((e)  => ids.push(e.id));
  return ids;
}

/**
 * Build the entityVersions map for a bundle — used by Android to stamp
 * per-entity version tokens after applying the bundle.
 *
 * Tokens are read directly from the already-computed entityIndex (same source
 * written to Firestore) so Android stamps the EXACT same token the manifest
 * carries. This is critical — using any other token (e.g. bundle hash) causes
 * getDirtyEntities() to always see mismatches and re-download every bundle.
 */
function buildEntityVersionsMap(patch, _bundleSha256, entityIndex) {
  const ids    = getAllEntityIds(patch);
  const result = {};
  for (const id of ids) {
    // Walk all type maps in the index to find this entity's token.
    // Each bundle contains only one entity type, so this loop exits quickly.
    for (const typeMap of Object.values(entityIndex)) {
      if (id in typeMap) { result[id] = typeMap[id]; break; }
    }
  }
  return result;
}

/**
 * @typedef {object} DeltaPublishResult
 * @property {object} entityIndex   - Updated entityIndex for Firestore manifest
 * @property {Array}  patches       - PatchBundleEntry descriptors for manifest
 * @property {object} deletedByType - entityType → deleted id arrays (for logging)
 * @property {object} stats         - Summary counts
 */