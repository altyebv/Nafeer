import { vi } from 'vitest';

// ─── In-memory stand-in for the RateLimit model ───────────────────────────────
// Implements the one call the limiter makes: findOneAndUpdate on _id with
// $inc + $setOnInsert and upsert. `failNext` makes the next call throw, to
// exercise the duplicate-key retry and the fail-open path.

export function fakeRateLimit() {
  const rows = new Map();
  const model = {
    rows,
    failNext: null,
    findOneAndUpdate: vi.fn(({ _id }, update) => {
      const run = async () => {
        if (model.failNext) {
          const err = model.failNext;
          model.failNext = null;
          throw err;
        }
        let row = rows.get(_id);
        if (!row) {
          row = { _id, count: 0, ...update.$setOnInsert };
          rows.set(_id, row);
        }
        row.count += update.$inc.count;
        return { ...row };
      };
      return { lean: run, then: (res, rej) => run().then(res, rej) };
    }),
    reset() {
      rows.clear();
      model.failNext = null;
    },
  };
  return model;
}
