// ─── trackStat.js ─────────────────────────────────────────────────────────────
// Fire-and-forget contributor stat increment + activity log entry.
// Never awaited — never blocks a content creation response.
//
// Usage:
//   trackStat(user.id, 'lessonsCreated');
//   trackStat(user.id, 'blocksAdded', { amount: 5 });   // batch credit
//   trackStat(user.id, 'lessonsCreated', { log: false }); // stat only, no heatmap entry
//
// Available stat keys mirror the stats subdoc on Contributor:
//   lessonsCreated | questionsAdded | feedItemsCreated | blocksAdded | examsCreated
//   publishedLessons | reviewsSubmitted | commentsPosted | editsMade
//
// The "created" fields (lessonsCreated, questionsAdded, feedItemsCreated,
// blocksAdded, examsCreated) are not incremented: they are recounted from the
// content itself, see authoredStats.js. `amount` is ignored for them.

import { Contributor } from '@/lib/models/Contributor';
import { ContributorActivity } from '@/lib/models/ContributorActivity';
import { creditCreation, isAuthoredField } from '@/lib/authoredStats';

export function trackStat(contributorId, field, opts = {}) {
  if (!contributorId) return;
  const { amount = 1, log = true } = opts;

  if (isAuthoredField(field)) {
    creditCreation(contributorId, field).catch((err) => {
      console.warn(`[trackStat] failed to recount ${field} for ${contributorId}:`, err.message);
    });
    return;
  }

  Contributor
    .findByIdAndUpdate(contributorId, {
      $inc:  { [`stats.${field}`]: amount },
      $set:  { 'stats.lastActiveAt': new Date() },
    })
    .catch((err) => {
      // Silently swallow — stats are non-critical
      console.warn(`[trackStat] failed to increment ${field} for ${contributorId}:`, err.message);
    });

  if (log) {
    ContributorActivity
      .create({ contributorId, type: field })
      .catch((err) => {
        console.warn(`[trackStat] failed to log activity ${field} for ${contributorId}:`, err.message);
      });
  }
}
