import { describe, it, expect } from 'vitest';
import { sanitiseMarkers, clampNorm } from '@/lib/markerUtils';

describe('sanitiseMarkers', () => {
  it('keeps fields it does not know', () => {
    const [m] = sanitiseMarkers([{ id: 'mk_1', x: 0.2, y: 0.4, label: 'النواة', answer: 'a', kind: 'question' }]);
    expect(m).toEqual({ id: 'mk_1', x: 0.2, y: 0.4, label: 'النواة', description: '', answer: 'a', kind: 'question' });
  });

  it('clamps positions and drops malformed markers', () => {
    const out = sanitiseMarkers([
      { id: 'a', x: -0.5, y: 1.7 },
      { id: 'b', x: NaN, y: 0.5 },
      { x: 0.1, y: 0.1 },
      null,
    ]);
    expect(out).toEqual([{ id: 'a', x: 0, y: 1, label: '', description: '' }]);
  });

  it('is empty for anything but an array', () => {
    expect(sanitiseMarkers(undefined)).toEqual([]);
    expect(sanitiseMarkers('[]')).toEqual([]);
  });
});

describe('clampNorm', () => {
  it('holds a value inside [0, 1]', () => {
    expect(clampNorm(-1)).toBe(0);
    expect(clampNorm(0.3)).toBe(0.3);
    expect(clampNorm(2)).toBe(1);
  });
});
