import { vi } from 'vitest';

// ─── In-memory stand-in for a Mongoose model ──────────────────────────────────
// Covers only what the guard and the routes under test call: findOne / findById
// with .select().lean() chains, exists, and spy-able writes. Filters support
// plain equality, $in and $ne — enough to tell whether a query would match a
// document, which is all these tests need.

function matches(doc, filter) {
  return Object.entries(filter).every(([key, cond]) => {
    const value = doc[key];
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      if ('$in' in cond) return cond.$in.includes(value);
      if ('$ne' in cond) return value !== cond.$ne;
      // Any other operator object is treated as "no match" — a real driver
      // would interpret it, which is exactly what the routes must prevent.
      return false;
    }
    return value === cond;
  });
}

function query(result) {
  const q = {
    select: () => q,
    lean: () => q,
    populate: () => q,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return q;
}

export function fakeModel(docs = []) {
  const model = {
    docs,
    findOne:  vi.fn((filter) => query(docs.find((d) => matches(d, filter)) ?? null)),
    findById: vi.fn((id) => query(docs.find((d) => d._id === id) ?? null)),
    exists:   vi.fn(async (filter) => (docs.some((d) => matches(d, filter)) ? { _id: 'x' } : null)),
    find:           vi.fn(() => query([])),
    deleteOne:      vi.fn(async () => ({ deletedCount: 1 })),
    deleteMany:     vi.fn(async () => ({ deletedCount: 0 })),
    findOneAndUpdate: vi.fn(() => query(null)),
    // Replaces the stored documents in place, so a model handed to vi.mock
    // once can be reseeded per test.
    seed(list) {
      docs.length = 0;
      docs.push(...list);
    },
  };
  return model;
}
