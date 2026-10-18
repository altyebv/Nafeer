import { describe, it, expect } from 'vitest';
import { dayKey, shiftKey, weekdayRow, bucketActivity, summarizeActivity, heatLevel } from '@/lib/activity';

describe('dayKey', () => {
  it('buckets by Sudan time, not UTC', () => {
    // 23:30 UTC on the 14th is 01:30 on the 15th in Khartoum (UTC+2).
    expect(dayKey(new Date('2026-10-14T23:30:00Z'))).toBe('2026-10-15');
    expect(dayKey(new Date('2026-10-14T21:59:00Z'))).toBe('2026-10-14');
  });
});

describe('calendar helpers', () => {
  it('shifts keys across month boundaries', () => {
    expect(shiftKey('2026-10-01', -1)).toBe('2026-09-30');
    expect(shiftKey('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('starts the week on Saturday', () => {
    expect(weekdayRow('2026-10-17')).toBe(0); // Saturday
    expect(weekdayRow('2026-10-15')).toBe(5); // Thursday
    expect(weekdayRow('2026-10-16')).toBe(6); // Friday
  });
});

describe('bucketActivity', () => {
  it('counts per day and per type', () => {
    const days = bucketActivity([
      { createdAt: new Date('2026-10-15T08:00:00Z'), type: 'blocksAdded' },
      { createdAt: new Date('2026-10-15T09:00:00Z'), type: 'blocksAdded' },
      { createdAt: new Date('2026-10-15T10:00:00Z'), type: 'questionsAdded' },
      { createdAt: new Date('2026-10-13T10:00:00Z'), type: 'editsMade' },
    ]);
    expect(days['2026-10-15']).toEqual({ n: 3, by: { blocksAdded: 2, questionsAdded: 1 } });
    expect(days['2026-10-13'].n).toBe(1);
  });
});

describe('summarizeActivity', () => {
  const mk = (keys) => Object.fromEntries(keys.map((k) => [k, { n: 2, by: {} }]));

  it('counts a streak ending today', () => {
    const s = summarizeActivity(mk(['2026-10-13', '2026-10-14', '2026-10-15']), '2026-10-15', 112);
    expect(s).toMatchObject({ streak: 3, longest: 3, activeDays: 3, total: 6 });
  });

  it('keeps yesterday\'s streak alive before anything is logged today', () => {
    expect(summarizeActivity(mk(['2026-10-13', '2026-10-14']), '2026-10-15', 112).streak).toBe(2);
  });

  it('breaks the streak after a missed day, but remembers the longest', () => {
    const s = summarizeActivity(mk(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05']), '2026-10-15', 112);
    expect(s.streak).toBe(0);
    expect(s.longest).toBe(3);
  });

  it('ignores days outside the window', () => {
    expect(summarizeActivity(mk(['2026-01-01']), '2026-10-15', 112).activeDays).toBe(0);
  });
});

describe('heatLevel', () => {
  it('uses fixed steps', () => {
    expect([0, 1, 2, 4, 5, 9, 10, 50].map(heatLevel)).toEqual([0, 1, 2, 2, 3, 3, 4, 4]);
  });
});
