// ─── Lesson ownership and credit ──────────────────────────────────────────────
// docs/team-leads.md. `createdBy` is the author and never changes; `ownerId`
// is who is responsible now (null → the author); `credits` lists everyone who
// edited or reviewed the lesson, one entry per (contributor, kind).
//
// The rules are pure; `creditLesson` is the one write, a single update that
// refreshes an existing entry or adds a new one — never a duplicate.

import { Lesson } from '@/lib/models/Lesson';

export const CREDIT_KINDS = ['author', 'editor', 'reviewer'];

const idOf = (v) => (v == null ? null : String(v));

/** Who is responsible for the lesson now. */
export function lessonOwnerId(lesson) {
  return idOf(lesson?.ownerId) || idOf(lesson?.createdBy);
}

/**
 * Whether `userId` wrote or now owns the lesson — the four-eyes rule refuses
 * a review by this person.
 */
export function isOwnWork(lesson, userId) {
  const id = idOf(userId);
  if (!id) return false;
  return idOf(lesson?.createdBy) === id || lessonOwnerId(lesson) === id;
}

/**
 * The credits list with one (contributor, kind) entry added or refreshed.
 * Pure: returns a new array. Used by the tests and by callers that already
 * hold the lesson; `creditLesson` does the same in the database.
 */
export function withCredit(credits = [], { contributorId, name = '', kind }, at = new Date()) {
  if (!CREDIT_KINDS.includes(kind)) throw new Error(`Unknown credit kind: ${kind}`);
  const id = idOf(contributorId);
  if (!id) return [...credits];

  const rest = credits.filter((c) => !(idOf(c.contributorId) === id && c.kind === kind));
  return [...rest, { contributorId, name, kind, at }];
}

/**
 * Adds or refreshes one credit on a lesson. Two updates at most: refresh the
 * entry if it exists, otherwise push it. Never throws into the caller — the
 * work it credits already happened.
 */
export async function creditLesson(contentId, { contributorId, name = '', kind }) {
  if (!CREDIT_KINDS.includes(kind) || !contributorId) return;
  const at = new Date();
  try {
    const refreshed = await Lesson.updateOne(
      { contentId, credits: { $elemMatch: { contributorId, kind } } },
      { $set: { 'credits.$.at': at, 'credits.$.name': name } },
    );
    if (refreshed.matchedCount) return;
    await Lesson.updateOne(
      { contentId, credits: { $not: { $elemMatch: { contributorId, kind } } } },
      { $push: { credits: { contributorId, name, kind, at } } },
    );
  } catch (e) {
    console.warn('[lesson credit failed]', contentId, kind, e.message);
  }
}
