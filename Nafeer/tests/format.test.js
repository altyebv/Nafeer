import { describe, it, expect } from 'vitest';
import { formatNumber, formatDate, formatRelative } from '@/lib/format';

describe('formatRelative', () => {
  const now = Date.parse('2026-10-16T12:00:00Z');
  const ago = (ms) => new Date(now - ms).toISOString();
  it('uses Arabic counting at each scale', () => {
    expect(formatRelative(ago(20_000), now)).toBe('الآن');
    expect(formatRelative(ago(1 * 60_000), now)).toBe('منذ دقيقة');
    expect(formatRelative(ago(2 * 3_600_000), now)).toBe('منذ ساعتين');
    expect(formatRelative(ago(5 * 86_400_000), now)).toBe('منذ 5 أيام');
    expect(formatRelative(ago(12 * 86_400_000), now)).toBe('منذ 12 يوماً');
  });
  it('falls back to the date after a month', () => {
    expect(formatRelative(ago(40 * 86_400_000), now)).toMatch(/2026/);
  });
});

const ARABIC_INDIC = /[٠-٩]/;

describe('formatNumber', () => {
  it('uses Western digits', () => {
    expect(formatNumber(12345)).toMatch(/^12.345$/);
    expect(formatNumber(7)).toBe('7');
  });

  it('renders missing values as a dash', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
    expect(formatNumber('abc')).toBe('—');
  });
});

describe('formatDate', () => {
  const d = new Date('2026-10-15T09:05:00Z');

  it('keeps Arabic month names with Western digits', () => {
    const out = formatDate(d, 'medium', { timeZone: 'UTC' });
    expect(out).toContain('2026');
    expect(out).toContain('15');
    expect(out).toMatch(/أكتوبر/);
    expect(out).not.toMatch(ARABIC_INDIC);
  });

  it('uses the Gregorian calendar, not Hijri', () => {
    expect(formatDate(d, 'month', { timeZone: 'UTC' })).toContain('2026');
  });

  it('respects timeZone for calendar-date values', () => {
    expect(formatDate('2026-10-01T00:00:00Z', 'month', { timeZone: 'UTC' })).toMatch(/أكتوبر/);
  });

  it('never emits Arabic-Indic digits in any preset', () => {
    for (const p of ['short', 'medium', 'full', 'long', 'month', 'time', 'shortDateTime', 'dateTime']) {
      expect(formatDate(d, p, { timeZone: 'UTC' })).not.toMatch(ARABIC_INDIC);
    }
  });

  it('renders unparseable input as a dash', () => {
    expect(formatDate('not a date')).toBe('—');
    expect(formatDate(null)).toBe('—');
  });

  it('rejects unknown presets loudly', () => {
    expect(() => formatDate(d, 'nope')).toThrow(/unknown preset/);
  });
});
