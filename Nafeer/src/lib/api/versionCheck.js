import { Contributor } from '@/lib/models/Contributor';
import { SYSTEM_SEED_USERNAME } from '@/lib/SeedActor';

// ─── Version-checked writes ───────────────────────────────────────────────────
// Optimistic concurrency for editor saves. A client that loaded a document at
// version N sends `baseVersion: N` with its edit; the write only lands if the
// stored document is still at N. Otherwise someone else saved in between and
// the caller gets a VersionConflict carrying the stored copy — or null when the
// document was deleted — so the editor can show both sides.
//
// No baseVersion means a legacy, unconditional write. The check costs nothing
// extra: it rides in the filter of the update the save already makes.

export class VersionConflict extends Error {
  constructor(contentId, current) {
    super('version conflict');
    this.contentId = contentId;
    this.current   = current ?? null;
    this.reason    = current ? 'changed' : 'deleted';
  }

  toJSON() {
    return { contentId: this.contentId, reason: this.reason, current: this.current };
  }
}

export const hasBaseVersion = (v) => Number.isInteger(v) && v > 0;

// Docs written before versioning have no `version`; applyVersionBump treats
// that as 1, so a client holding 1 must match them too.
export const atVersion = (baseVersion) =>
  baseVersion === 1 ? { version: { $in: [1, null] } } : { version: baseVersion };

const plain = (doc) => (doc?.toObject ? doc.toObject() : doc);

// Throws before writing when `existing` (already fetched by the caller) shows
// the base is stale; the filter catches a save that lands in between.
export async function updateAtVersion(Model, contentId, baseVersion, existing, update, options = {}) {
  const checked = hasBaseVersion(baseVersion);
  if (checked) {
    if (!existing) throw new VersionConflict(contentId, null);
    if ((existing.version ?? 1) !== baseVersion) throw new VersionConflict(contentId, plain(existing));
  }

  const filter = checked ? { contentId, ...atVersion(baseVersion) } : { contentId };
  const doc = await Model.findOneAndUpdate(filter, update, { new: true, ...options }).lean();

  if (!doc && checked) {
    throw new VersionConflict(contentId, await Model.findOne({ contentId }).lean());
  }
  return doc;
}

// Adds `byName` — who made the change that won — to each conflict. One
// lookup for the whole batch, and only when there are conflicts, which is rare.
// Admin edits are attributed to the system seed account; shown as "مشرف".
export async function withEditorNames(conflicts) {
  const ids = [...new Set(conflicts.map((c) => c.current?.updatedBy).filter(Boolean).map(String))];
  if (ids.length === 0) return conflicts;

  const people = await Contributor.find({ _id: { $in: ids } }).select('_id name username').lean();
  const names = new Map(people.map((p) => [
    String(p._id),
    p.username === SYSTEM_SEED_USERNAME ? 'مشرف' : p.name,
  ]));

  return conflicts.map((c) => ({ ...c, byName: names.get(String(c.current?.updatedBy)) ?? null }));
}

// Runs a batch item by item; conflicts are collected, anything else rethrows.
export async function settleBatch(items, write) {
  const outcomes = await Promise.all(items.map(async (item) => {
    try {
      return { saved: await write(item) };
    } catch (e) {
      if (e instanceof VersionConflict) return { conflict: e.toJSON() };
      throw e;
    }
  }));
  return {
    saved:     outcomes.filter((o) => o.saved).map((o) => o.saved),
    conflicts: outcomes.filter((o) => o.conflict).map((o) => o.conflict),
  };
}
