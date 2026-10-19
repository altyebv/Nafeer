import { describe, it, expect } from 'vitest';
import {
  POOL_NAMES, checkEntry, parsePoolsDoc, placeholdersIn, serializePools, validatePools,
} from '@/shared/stringPools';

describe('parsePoolsDoc', () => {
  it('fills every known pool and keeps unknown pools apart', () => {
    const { pools, unknown } = parsePoolsDoc({
      pools: {
        greetings_morning: { strings: [{ text: 'صباح الخير', weight: 2, tags: ['morning'] }] },
        legacy_pool: { strings: [{ text: 'x' }] },
      },
    });
    expect(Object.keys(pools)).toEqual(POOL_NAMES);
    expect(pools.greetings_morning).toEqual([
      { text: 'صباح الخير', text_male: '', text_female: '', weight: 2, tags: ['morning'] },
    ]);
    expect(pools.exam_crunch).toEqual([]);
    expect(unknown).toEqual({ legacy_pool: { strings: [{ text: 'x' }] } });
  });

  it('handles a missing doc', () => {
    const { pools, unknown } = parsePoolsDoc(null);
    expect(pools.cta_idle_prompt).toEqual([]);
    expect(unknown).toEqual({});
  });
});

describe('checkEntry', () => {
  const ok = { text: 'ابدأ', text_male: '', text_female: 'ابدئي', weight: 1, tags: [] };

  it('passes a well-formed entry', () => {
    expect(checkEntry(ok)).toEqual({ errors: [], warnings: [] });
  });

  it('blocks what the app would drop', () => {
    expect(checkEntry({ ...ok, text: '  ' }).errors).toHaveLength(1);
    expect(checkEntry({ ...ok, weight: 0 }).errors).toHaveLength(1);
    expect(checkEntry({ ...ok, weight: '' }).errors).toHaveLength(1);
    expect(checkEntry({ ...ok, tags: ['night'] }).errors).toHaveLength(1);
  });

  it('warns on placeholders no call site supplies, in any form', () => {
    expect(checkEntry({ ...ok, text_female: 'اليوم {streak} 🔥' }).warnings).toHaveLength(1);
    expect(placeholdersIn('{a} و {b} و {a}')).toEqual(['a', 'b']);
  });
});

describe('serializePools', () => {
  it('writes the shape the app reads, dropping blank gendered forms', () => {
    const { pools } = parsePoolsDoc({});
    pools.cta_idle_prompt = [{ text: ' لم تبدأ بعد؟ ', text_male: ' ', text_female: 'لم تبدئي بعد؟', weight: 1.5, tags: ['at_risk'] }];
    const out = serializePools(pools, { legacy_pool: { strings: [] } });
    expect(out.cta_idle_prompt).toEqual({
      strings: [{ text: 'لم تبدأ بعد؟', text_female: 'لم تبدئي بعد؟', weight: 1.5, tags: ['at_risk'] }],
    });
    expect(out.greetings_evening).toEqual({ strings: [] });
    expect(out.legacy_pool).toEqual({ strings: [] });
  });

  it('counts errors across pools', () => {
    const { pools } = parsePoolsDoc({});
    pools.exam_crunch = [{ text: '', text_male: '', text_female: '', weight: -1, tags: [] }];
    const r = validatePools(pools);
    expect(r.errors).toBe(2);
    expect(Object.keys(r.byEntry)).toEqual(['exam_crunch:0']);
  });
});
