import { describe, it, expect } from 'vitest';
import { lessonReadiness, countsInWords, isAutoTitle } from '@/lib/lessonReadiness';

const stores = {
  sections:  [{ id: 's1', lessonId: 'L1' }, { id: 's2', lessonId: 'L2' }],
  blocks:    [{ id: 'b1', sectionId: 's1' }, { id: 'b2', sectionId: 's1' }],
  questions: [{ id: 'q1', lessonId: 'L1' }],
  feedItems: [],
};

describe('lessonReadiness', () => {
  it('runs the same six checks as the editor', () => {
    const r = lessonReadiness({ id: 'L1', title: 'قراءة الصور الجوية', summary: 'ملخص' }, stores);
    expect(r.done).toBe(5);
    expect(r.missing).toEqual(['بطاقة تغذية']);
    expect(r.counts).toEqual({ sections: 1, blocks: 2, questions: 1, feed: 0 });
  });

  it('treats seeded titles as not done', () => {
    const r = lessonReadiness({ id: 'L2', title: 'الدرس 3' }, stores);
    expect(r.checks.find((c) => c.id === 'title').done).toBe(false);
    expect(isAutoTitle('الدرس 12')).toBe(true);
    expect(isAutoTitle('الدرس الأول من الكتاب')).toBe(false);
  });
});

describe('countsInWords', () => {
  it('says only what is there', () => {
    expect(countsInWords({ sections: 1, blocks: 7, questions: 0, feed: 3 })).toBe('1 قسم · 7 عناصر · 3 بطاقات');
    expect(countsInWords({ sections: 0, blocks: 0, questions: 0, feed: 0 })).toBe('فارغ');
  });
});
