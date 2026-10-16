// ─── authoredStats.js ─────────────────────────────────────────────────────────
// The "created" counters on Contributor.stats are counted from the content
// itself, by `createdBy`, instead of being incremented and forgotten.
//
// The old $inc counters drifted in two ways: every block re-save was credited
// as a new block, and nothing was taken back when content was deleted. So a
// contributor could show 7 blocks with none left in the database.
//
// Edits (`editsMade`), comments, reviews and time stay as effort counters in
// trackStat — they record work done, which is still true after a delete.
//
// Models are imported at call time: versioning.js imports trackStat, and every
// content model spreads versioningFields while it loads, so a static import
// here would be a cycle. A dynamic import also registers a model the current
// route never loaded.

import { after } from 'next/server';
import { Contributor } from '@/lib/models/Contributor';
import { ContributorActivity } from '@/lib/models/ContributorActivity';

// stats field → [model name, extra filter]
export const AUTHORED = {
  lessonsCreated:   ['Lesson',   {}],
  // Checkpoint questions mirror a block; the block already counts once.
  questionsAdded:   ['Question', { isCheckpoint: { $ne: true } }],
  feedItemsCreated: ['FeedItem', {}],
  blocksAdded:      ['Block',    {}],
  examsCreated:     ['Exam',     {}],
};

export const isAuthoredField = (field) => Object.hasOwn(AUTHORED, field);

const LOADERS = {
  Lesson:   () => import('@/lib/models/Lesson').then((m) => m.Lesson),
  Question: () => import('@/lib/models/Question').then((m) => m.Question),
  FeedItem: () => import('@/lib/models/FeedItem').then((m) => m.FeedItem),
  Block:    () => import('@/lib/models/Block').then((m) => m.Block),
  Exam:     () => import('@/lib/models/Exam').then((m) => m.Exam),
};
const model = (name) => LOADERS[name]();
const uniqueIds = (ids) => [...new Set(ids.filter(Boolean).map(String))];

async function countField(contributorId, field) {
  const [name, extra] = AUTHORED[field];
  return (await model(name)).countDocuments({ createdBy: contributorId, ...extra });
}

// What a contributor has authored right now, every field.
export async function countAuthored(contributorId) {
  const fields = Object.keys(AUTHORED);
  const counts = await Promise.all(fields.map((f) => countField(contributorId, f)));
  return Object.fromEntries(fields.map((f, i) => [f, counts[i]]));
}

const statsSet = (counts) =>
  Object.fromEntries(Object.entries(counts).map(([f, n]) => [`stats.${f}`, n]));

// A contributor just created content of this kind. Recount it, and log one
// activity entry only if the count actually went up — re-saving an existing
// block no longer reads as new work.
export async function creditCreation(contributorId, field) {
  const n = await countField(contributorId, field);
  const before = await Contributor.findByIdAndUpdate(
    contributorId,
    { $set: { [`stats.${field}`]: n, 'stats.lastActiveAt': new Date() } },
    { projection: { [`stats.${field}`]: 1 } },
  ).lean();
  if (before && n > (before.stats?.[field] || 0)) {
    await ContributorActivity.create({ contributorId, type: field });
  }
  return n;
}

// Recount every authored field for these contributors (after a delete).
// Does not touch lastActiveAt: the person deleting may not be the author.
export async function recountAuthored(contributorIds) {
  const ids = uniqueIds(contributorIds);
  await Promise.all(ids.map(async (id) => {
    const counts = await countAuthored(id);
    await Contributor.updateOne({ _id: id }, { $set: statsSet(counts) });
  }));
  return ids.length;
}

// Run after the response is sent. Inside a request, `after` keeps the work
// alive on Vercel; outside one (scripts, tests) it throws, so run it directly.
function later(label, task) {
  const run = () => task().catch((e) => console.warn(`[authoredStats] ${label} failed:`, e.message));
  try { after(run); } catch { run(); }
}

// For delete paths: the response does not wait for the recount.
export function recountAuthoredLater(contributorIds) {
  later('recount', () => recountAuthored(contributorIds));
}

// Who authored the documents a delete is about to remove.
export async function authorsOf(modelName, filter) {
  return (await model(modelName)).distinct('createdBy', filter);
}

// Every contributor at once: one aggregate per content type. Used by the
// one-off reconcile script and after admin bulk wipes (reseed, import).
// Returns the contributors whose stored numbers were wrong.
export async function reconcileAuthoredStats({ dryRun = false } = {}) {
  const truth = new Map(); // id → counts
  for (const [field, [name, extra]] of Object.entries(AUTHORED)) {
    const rows = await (await model(name)).aggregate([
      { $match: { createdBy: { $ne: null }, ...extra } },
      { $group: { _id: '$createdBy', n: { $sum: 1 } } },
    ]);
    for (const { _id, n } of rows) {
      const key = String(_id);
      if (!truth.has(key)) truth.set(key, {});
      truth.get(key)[field] = n;
    }
  }

  const contributors = await Contributor.find({}, 'username stats').lean();
  const changes = [];
  for (const c of contributors) {
    const want = Object.fromEntries(Object.keys(AUTHORED).map((f) => [f, truth.get(String(c._id))?.[f] || 0]));
    const diff = Object.fromEntries(Object.entries(want)
      .filter(([f, n]) => (c.stats?.[f] || 0) !== n)
      .map(([f, n]) => [f, { from: c.stats?.[f] || 0, to: n }]));
    if (Object.keys(diff).length) changes.push({ id: String(c._id), username: c.username, diff, want });
  }

  if (!dryRun && changes.length) {
    await Contributor.bulkWrite(changes.map(({ id, want }) => ({
      updateOne: { filter: { _id: id }, update: { $set: statsSet(want) } },
    })));
  }
  return changes.map(({ want, ...rest }) => rest);
}

export function reconcileAuthoredStatsLater() {
  later('reconcile', () => reconcileAuthoredStats());
}
