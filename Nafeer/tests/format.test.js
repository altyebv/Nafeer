import { describe, it, expect } from 'vitest';
import { formatNumber, formatDate } from '@/lib/format';

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
