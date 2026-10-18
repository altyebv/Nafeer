// ─── Number and date formatting ───────────────────────────────────────────────
// The one place the site turns numbers and dates into text
// (docs/design-system.md §3.3). Calling toLocaleString / toLocaleDateString
// anywhere else is a lint:design violation.
//
// Policy: Arabic words, Western digits. `ar-SD` gives Sudanese Arabic month
// and weekday names; `nu-latn` keeps the digits 0–9; `ca-gregory` pins the
// Gregorian calendar.
//
// Before this module the site formatted four different ways. Two of them were
// bugs that nobody saw:
//   • `ar-SA` defaults to the Islamic calendar, so admin dates such as
//     "published on" rendered as Hijri dates.
//   • `ar-EG` / `ar-SD` without `nu-latn` switch to Arabic-Indic digits, so the
//     editor showed ١٢ in one card and 12 in the next.

const LOCALE = 'ar-SD-u-nu-latn-ca-gregory';

const DATE_PRESETS = {
  short:         { day: 'numeric', month: 'short' },                    // 15 أكتوبر
  medium:        { day: 'numeric', month: 'short', year: 'numeric' },   // 15 أكتوبر 2026
  full:          { day: 'numeric', month: 'long',  year: 'numeric' },
  long:          { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  month:         { month: 'long', year: 'numeric' },                    // أكتوبر 2026
  monthShort:    { month: 'short' },
  time:          { hour: '2-digit', minute: '2-digit' },
  shortDateTime: { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' },
  dateTime:      { dateStyle: 'medium', timeStyle: 'short' },
};

// Intl formatters are expensive to build and these run inside list renders,
// so each (preset, timeZone) pair is built once.
const cache = new Map();
function formatter(key, options) {
  let f = cache.get(key);
  if (!f) {
    f = key === 'number'
      ? new Intl.NumberFormat(LOCALE)
      : new Intl.DateTimeFormat(LOCALE, options);
    cache.set(key, f);
  }
  return f;
}

/** 12345 → "12,345". Null and non-numbers render as an em dash. */
export function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return formatter('number').format(Number(n));
}

/**
 * Arabic counted noun: 1 and 2 have their own forms, 3–10 take the plural,
 * 11 and up the singular accusative.
 *   arCount(3, { one: 'تغيير واحد', two: 'تغييران', few: 'تغييرات', many: 'تغييراً' }) → "3 تغييرات"
 */
export const arCount = (n, { one, two, few, many }) =>
  n === 1 ? one : n === 2 ? two : n <= 10 ? `${formatNumber(n)} ${few}` : `${formatNumber(n)} ${many}`;

export const changesLabel = (n) =>
  arCount(n, { one: 'تغيير واحد', two: 'تغييران', few: 'تغييرات', many: 'تغييراً' });

/**
 * "منذ ساعتين" — how long ago, in words, with Arabic counting. Past 30 days it
 * falls back to the date itself, which reads better than "منذ 94 يوماً".
 */
export function formatRelative(value, now = Date.now()) {
  if (value === null || value === undefined || value === '') return '—';
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return '—';
  const mins = Math.floor((now - t) / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${arCount(mins, { one: 'دقيقة', two: 'دقيقتين', few: 'دقائق', many: 'دقيقة' })}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${arCount(hours, { one: 'ساعة', two: 'ساعتين', few: 'ساعات', many: 'ساعة' })}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${arCount(days, { one: 'يوم', two: 'يومين', few: 'أيام', many: 'يوماً' })}`;
  return formatDate(value, 'medium');
}

/**
 * Format a date with one of the named presets above.
 * Accepts a Date, an ISO string or a timestamp; anything unparseable gives "—".
 * `timeZone` is for values that are calendar dates rather than instants
 * (a "2026-10" month key is midnight UTC and must not slide into the previous
 * month for a viewer west of Greenwich).
 */
export function formatDate(value, preset = 'medium', { timeZone } = {}) {
  if (value === null || value === undefined || value === '') return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const options = DATE_PRESETS[preset];
  if (!options) throw new Error(`formatDate: unknown preset "${preset}"`);
  const key = `${preset}|${timeZone || ''}`;
  return formatter(key, timeZone ? { ...options, timeZone } : options).format(d);
}
