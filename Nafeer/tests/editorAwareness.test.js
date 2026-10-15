import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Editor awareness ─────────────────────────────────────────────────────────
// "Someone opened this lesson", the name on a conflict, and the conflict view's
// word highlighting. The open stamp rides on the lesson GET the editor already
// makes; these tests pin that it never costs a write it doesn't need.

const { session } = vi.hoisted(() => ({ session: { user: null } }));

vi.mock('next/server', async () => ({
  ...(await vi.importActual('next/server')),
  after: (fn) => fn(),
}));
vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/api/guard', async () => ({
  ...(await vi.importActual('@/lib/api/guard')),
  requireContentAccess: vi.fn(async () => ({ user: session.user })),
}));
vi.mock('@/lib/api/lessons', () => ({ getLessonWithContent: vi.fn() }));
vi.mock('@/lib/models/Lesson', () => ({ Lesson: { updateOne: vi.fn(() => Promise.resolve({})) } }));
vi.mock('@/lib/models/Contributor', () => ({
  Contributor: {
    find: vi.fn(() => ({
      select: () => ({
        lean: async () => [
          { _id: 'c_fatima', name: 'فاطمة', username: 'fatima' },
          { _id: 'c_seed',   name: 'System Seed', username: 'system_seed' },
        ],
      }),
    })),
  },
}));
vi.mock('@/lib/SeedActor', () => ({ SYSTEM_SEED_USERNAME: 'system_seed', ensureSystemSeedContributor: vi.fn() }));

const { Lesson } = await import('@/lib/models/Lesson');
const { getLessonWithContent } = await import('@/lib/api/lessons');
const lessonRoute = await import('@/app/api/content/lessons/[id]/route.js');
const { withEditorNames } = await import('@/lib/api/versionCheck');
const { wordDiff } = await import('@/lib/wordDiff');
const { arCount } = await import('@/components/editor/lesson/SyncMarks');

const minutesAgo = (m) => new Date(Date.now() - m * 60_000);
const open = async (openedBy, openedAt) => {
  getLessonWithContent.mockResolvedValueOnce({ contentId: 'les_1', title: 'درس', openedBy, openedAt, sections: [] });
  const res = await lessonRoute.GET(new Request('http://test/api'), { params: Promise.resolve({ id: 'les_1' }) });
  return (await res.json()).data;
};

beforeEach(() => {
  vi.clearAllMocks();
  session.user = { id: 'c_me', name: 'أنا', role: 'contributor', subject: 'GEOGRAPHY' };
});

describe('opening a lesson', () => {
  it('reports someone else who opened it recently, and stamps this open', async () => {
    const data = await open({ id: 'c_fatima', name: 'فاطمة' }, minutesAgo(10));
    expect(data.recentlyOpenedBy).toMatchObject({ name: 'فاطمة' });
    expect(Lesson.updateOne).toHaveBeenCalledWith(
      { contentId: 'les_1' },
      { $set: { openedBy: { id: 'c_me', name: 'أنا' }, openedAt: expect.any(Date) } },
      { timestamps: false },
    );
  });

  it('stays quiet about an open from more than half an hour ago', async () => {
    const data = await open({ id: 'c_fatima', name: 'فاطمة' }, minutesAgo(45));
    expect(data.recentlyOpenedBy).toBeNull();
  });

  it('does not write again when the same person reopens within minutes', async () => {
    const data = await open({ id: 'c_me', name: 'أنا' }, minutesAgo(2));
    expect(data.recentlyOpenedBy).toBeNull();
    expect(Lesson.updateOne).not.toHaveBeenCalled();
  });

  it('keeps the raw stamp out of the response', async () => {
    const data = await open({ id: 'c_fatima', name: 'فاطمة' }, minutesAgo(10));
    expect(data).not.toHaveProperty('openedBy');
    expect(data).not.toHaveProperty('openedAt');
  });
});

describe('conflict names', () => {
  it('names the contributor whose change won, and shows admin edits as مشرف', async () => {
    const named = await withEditorNames([
      { contentId: 'a', current: { updatedBy: 'c_fatima' } },
      { contentId: 'b', current: { updatedBy: 'c_seed' } },
      { contentId: 'c', current: null },
    ]);
    expect(named.map((c) => c.byName)).toEqual(['فاطمة', 'مشرف', null]);
  });
});

describe('word diff', () => {
  it('marks only the words that differ', () => {
    const { a, b } = wordDiff('النيل أطول نهر في العالم', 'النيل أطول نهر في أفريقيا');
    expect(a.filter((t) => t.changed).map((t) => t.text.trim())).toEqual(['العالم']);
    expect(b.filter((t) => t.changed).map((t) => t.text.trim())).toEqual(['أفريقيا']);
    expect(a.map((t) => t.text).join('')).toBe('النيل أطول نهر في العالم');
  });

  it('gives up rather than stall on very long texts', () => {
    const long = 'كلمة '.repeat(500);
    expect(wordDiff(long, `${long} أخرى`)).toBeNull();
  });
});

describe('Arabic counts', () => {
  const forms = { one: 'تغيير واحد', two: 'تغييران', few: 'تغييرات', many: 'تغييراً' };
  it('uses the dual, the plural for 3–10 and the singular from 11', () => {
    expect(arCount(1, forms)).toBe('تغيير واحد');
    expect(arCount(2, forms)).toBe('تغييران');
    // Western digits — the site's numeral policy (docs/design-system.md §3.3).
    expect(arCount(3, forms)).toBe('3 تغييرات');
    expect(arCount(11, forms)).toBe('11 تغييراً');
  });
});
