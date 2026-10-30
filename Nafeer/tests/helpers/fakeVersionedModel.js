import { vi } from 'vitest';

// ─── In-memory model for version-checked writes ───────────────────────────────
// Supports what lib/api/content.js, lib/api/lessons.js and versionCheck.js call:
// findOne (awaitable or .lean()/.select()), findOneAndUpdate with a $set and a
// filter on contentId plus `version` (number or { $in }), and create.
// `beforeUpdate` runs between the read and the write, to stage a race.

const versionMatches = (doc, cond) => {
  if (cond === undefined) return true;
  if (cond && typeof cond === 'object' && '$in' in cond) {
    return cond.$in.some((v) => (v === null ? doc.version == null : doc.version === v));
  }
  return doc.version === cond;
};

const withToObject = (doc) => ({ ...doc, toObject: () => ({ ...doc }) });

const query = (result) => {
  const q = {
    select: () => q,
    lean:   () => Promise.resolve(result ? { ...result } : null),
    then:   (res, rej) => Promise.resolve(result ? withToObject(result) : null).then(res, rej),
  };
  return q;
};

export function fakeVersionedModel() {
  const docs = new Map();
  const listQuery = (result) => {
    const q = {
      select: () => q,
      lean:   () => Promise.resolve(result.map((doc) => ({ ...doc }))),
      then:   (res, rej) => Promise.resolve(result.map(withToObject)).then(res, rej),
    };
    return q;
  };
  const model = {
    docs,
    beforeUpdate: null,
    findOne: vi.fn((filter) => query(docs.get(filter.contentId) ?? null)),
    find: vi.fn((filter) => {
      const ids = filter.contentId?.$in || [];
      return listQuery([...docs.values()].filter((doc) => ids.includes(doc.contentId)));
    }),
    findOneAndUpdate: vi.fn((filter, update) => ({
      lean: async () => {
        if (model.beforeUpdate) { const f = model.beforeUpdate; model.beforeUpdate = null; f(); }
        const doc = docs.get(filter.contentId);
        if (!doc || !versionMatches(doc, filter.version)) return null;
        Object.assign(doc, update.$set);
        return { ...doc };
      },
    })),
    create: vi.fn(async (data) => {
      const doc = { version: 1, ...data };
      docs.set(data.contentId, doc);
      return withToObject(doc);
    }),
    seed(list) {
      docs.clear();
      for (const d of list) docs.set(d.contentId, { ...d });
    },
  };
  return model;
}
