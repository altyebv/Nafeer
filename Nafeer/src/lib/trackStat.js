// ─── trackStat.js ─────────────────────────────────────────────────────────────
// Fire-and-forget contributor stat increment.
// Never awaited — never blocks a content creation response.
//
// Usage:
//   trackStat(user.id, 'lessonsCreated');
//
// Available stat keys mirror the stats subdoc on Contributor:
//   lessonsCreated | questionsAdded | feedItemsCreated | blocksAdded
//   reviewsSubmitted | publishedLessons

import { Contributor } from '@/lib/models/Contributor';

export function trackStat(contributorId, field) {
  if (!contributorId) return;

  Contributor
    .findByIdAndUpdate(contributorId, {
      $inc:  { [`stats.${field}`]: 1 },
      $set:  { 'stats.lastActiveAt': new Date() },
    })
    .catch((err) => {
      // Silently swallow — stats are non-critical
      console.warn(`[trackStat] failed to increment ${field} for ${contributorId}:`, err.message);
    });
}
