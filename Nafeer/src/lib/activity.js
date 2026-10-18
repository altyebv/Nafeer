// ─── Contributor activity: days, streaks, labels ──────────────────────────────
// Shared by GET /api/contributors/activity and ui/ActivityGraph, so the server
// and the browser agree on what "a day" is.
//
// They used to disagree: the server bucketed events by UTC date
// (`toISOString().slice(0, 10)`) while the graph built its keys from the
// viewer's local midnight. For a contributor in Sudan (UTC+2) anything saved
// between midnight and 02:00 landed on the previous day. Every key is now a
// calendar date in Sudan time, wherever the code runs.

export const ACTIVITY_TZ = 'Africa/Khartoum';
const DAY_MS = 86_400_000;

// en-CA formats as YYYY-MM-DD.
const keyFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: ACTIVITY_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
});

/** The Sudan-time calendar date of an instant, as 'YYYY-MM-DD'. */
export const dayKey = (date) => keyFmt.format(date instanceof Date ? date : new Date(date));

/** Calendar arithmetic on a key — no time zone involved. */
export function shiftKey(key, days) {
  const t = Date.parse(`${key}T00:00:00Z`) + days * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

/** 0 = Saturday … 6 = Friday — the week as it is lived in Sudan. */
export const weekdayRow = (key) => (new Date(`${key}T00:00:00Z`).getUTCDay() + 1) % 7;

/**
 * Raw ContributorActivity docs → { 'YYYY-MM-DD': { n, by: { type: count } } }.
 * `type` is the Contributor.stats field the event credited (trackStat).
 */
export function bucketActivity(docs) {
  const days = {};
  for (const doc of docs) {
    const key = dayKey(doc.createdAt);
    const day = (days[key] ??= { n: 0, by: {} });
    day.n += 1;
    if (doc.type) day.by[doc.type] = (day.by[doc.type] || 0) + 1;
  }
  return days;
}

/**
 * Summary of a day map over the `windowDays` ending today.
 * The current streak ends today, or yesterday when nothing is logged yet
 * today — a streak should not read as broken at breakfast.
 */
export function summarizeActivity(days, todayKey, windowDays) {
  let activeDays = 0, total = 0, longest = 0, run = 0;
  for (let i = windowDays - 1; i >= 0; i--) {
    const n = days[shiftKey(todayKey, -i)]?.n || 0;
    if (n) { activeDays += 1; total += n; run += 1; longest = Math.max(longest, run); }
    else run = 0;
  }
  let cursor = days[todayKey]?.n ? todayKey : shiftKey(todayKey, -1);
  let streak = 0;
  while (days[cursor]?.n) { streak += 1; cursor = shiftKey(cursor, -1); }
  return { activeDays, total, streak, longest, windowDays };
}

/** Arabic names for the event types, as the day panel lists them. */
export const ACTIVITY_LABELS = {
  blocksAdded:      'عناصر محتوى',
  editsMade:        'تعديلات',
  questionsAdded:   'أسئلة',
  feedItemsCreated: 'بطاقات تغذية',
  lessonsCreated:   'دروس',
  examsCreated:     'امتحانات',
  publishedLessons: 'دروس منشورة',
  reviewsSubmitted: 'مراجعات',
  commentsPosted:   'تعليقات',
};

/** Fixed intensity steps — a shade means the same thing every week. */
export const heatLevel = (n) => (!n ? 0 : n === 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : 4);
