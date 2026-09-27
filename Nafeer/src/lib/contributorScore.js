// ─── contributorScore.js ───────────────────────────────────────────────────────
// Single scoring formula shared by the public directory sort
// (src/app/api/contributors/public/route.js) and a single profile's rank
// (src/app/api/contributors/activity/route.js) — kept in one place so the two
// never drift into disagreeing about who's "ahead".
//
// Weights favor shipped, reviewed, community work over raw creation volume:
// creating a draft is worth something, but getting it published, helping
// review others' work, and staying engaged is worth more per unit of effort.

export function computeContributorScore(stats = {}) {
  const hours = (stats.totalTimeMs || 0) / 3_600_000;

  return (
    (stats.lessonsCreated   || 0) * 3 +
    (stats.questionsAdded   || 0) * 1 +
    (stats.feedItemsCreated || 0) * 2 +
    (stats.blocksAdded      || 0) * 0.5 +
    (stats.examsCreated     || 0) * 3 +
    (stats.publishedLessons || 0) * 2 +
    (stats.reviewsSubmitted || 0) * 1.5 +
    (stats.commentsPosted   || 0) * 0.5 +
    (stats.editsMade        || 0) * 0.3 +
    hours * 0.2
  );
}
