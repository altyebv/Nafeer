import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// In-memory stand-ins for every content model, keyed by model name.
const db = vi.hoisted(() => ({ docs: {}, aggregates: {}, people: new Set() }));

const fake = vi.hoisted(() => (name) => {
  const rows = () => db.docs[name] || [];
  const where = (filter = {}) => rows().filter((d) =>
    Object.entries(filter).every(([k, v]) =>
      v && typeof v === 'object' && '$in' in v ? v.$in.includes(d[k]) : d[k] === v));
  // A query that resolves to `result` whatever is chained on it.
  const chain = (result) => {
    const q = { select: () => q, sort: () => q, session: () => q, lean: () => q,
      then: (ok, no) => Promise.resolve(typeof result === 'function' ? result() : result).then(ok, no) };
    return q;
  };
  const sortedByOrder = (list) => [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return {
    deleteMany: vi.fn(async (filter) => ({ deletedCount: where(filter).length })),
    find: (filter) => chain(() => sortedByOrder(where(filter))),
    findOne: (filter) => chain(() => where(filter)[0] ?? null),
    findById: (id) => chain(() => rows().find((d) => d._id === id) ?? null),
    distinct: async (field, filter) => [...new Set(where(filter).map((d) => d[field]))],
    countDocuments: async (filter) => where(filter).length,
    exists: async (filter) => (where(filter).length ? { _id: 'x' } : null),
    aggregate: async () => db.aggregates[name] || [],
    create: vi.fn(async (doc) => doc),
    insertMany: vi.fn(async (docs) => docs),
    updateOne: vi.fn(async ({ _id }, { $set }) => {
      Object.assign(rows().find((d) => d._id === _id) || {}, $set);
      return { matchedCount: 1 };
    }),
    updateMany: vi.fn(async (filter, { $set }) => {
      const hit = where(filter);
      hit.forEach((d) => Object.assign(d, $set));
      return { matchedCount: hit.length };
    }),
    bulkWrite: vi.fn(async (ops) => {
      for (const { updateOne: { filter, update } } of ops) Object.assign(rows().find((d) => d._id === filter._id) || {}, update.$set);
    }),
  };
});

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/authoredStats', () => ({ reconcileAuthoredStatsLater: vi.fn() }));
vi.mock('@/lib/SeedActor', () => ({ ensureSystemSeedContributor: vi.fn(async () => 'system-seed-id') }));
vi.mock('@/lib/lessonAccess', () => ({
  unclaimedOwners: async (ids) => new Set(ids.filter((id) => id && !db.people.has(id))),
}));
for (const name of ['Subject', 'Unit', 'Lesson', 'Section', 'Block', 'Concept', 'Tag',
  'FeedItem', 'Question', 'Exam', 'LessonHistory']) {
  vi.doMock(`@/lib/models/${name}`, () => ({ [name]: fake(name) }));
}

const {
  SUBJECT_CONTENT_MODELS, SUBJECT_KEPT_MODELS,
  deleteSubjectContent, hasWrittenContent, writtenContent, isEmptyOfWork,
} = await import('@/lib/subjectContent');
const { LessonHistory } = await import('@/lib/models/LessonHistory');
const {
  openSubject, createUnit, getAllSubjectsProgress, unitTarget, setUnitBook, renameBook,
} = await import('@/lib/api/subject');
const { parseTarget } = await import('@/lib/unitTarget');

beforeEach(() => {
  db.docs = {};
  db.aggregates = {};
  db.people = new Set(['alice']);
  vi.clearAllMocks();
});

describe('which models a subject delete covers', () => {
  it('lists every model keyed by subjectId as content or as kept on purpose', () => {
    const dir = fileURLToPath(new URL('../src/lib/models/', import.meta.url));
    const keyed = readdirSync(dir)
      .filter((f) => f.endsWith('.js') && f !== 'versioning.js')
      .filter((f) => /\bsubjectId\s*:/.test(readFileSync(dir + f, 'utf8')))
      .map((f) => f.replace(/\.js$/, ''));

    const known = new Set([...Object.keys(SUBJECT_CONTENT_MODELS), ...Object.keys(SUBJECT_KEPT_MODELS)]);
    expect(keyed.filter((name) => !known.has(name))).toEqual([]);
  });
});

describe('deleteSubjectContent', () => {
  beforeEach(() => {
    db.docs.Lesson = [{ subjectId: 'PHYSICS', contentId: 'P_L1' }, { subjectId: 'CHEM', contentId: 'C_L1' }];
  });

  it('deletes by subjectId in every content collection, and the lessons\' history', async () => {
    await deleteSubjectContent('PHYSICS');

    for (const model of Object.values(SUBJECT_CONTENT_MODELS)) {
      expect(model.deleteMany).toHaveBeenCalledWith({ subjectId: 'PHYSICS' }, { session: null });
    }
    expect(LessonHistory.deleteMany).toHaveBeenCalledWith({ lessonContentId: { $in: ['P_L1'] } }, { session: null });
  });

  it('keeps history when asked, for a restore', async () => {
    await deleteSubjectContent('PHYSICS', { keepHistory: true });
    expect(LessonHistory.deleteMany).not.toHaveBeenCalled();
  });

  it('refuses without a subject id rather than deleting everything', async () => {
    await expect(deleteSubjectContent(undefined)).rejects.toThrow();
    expect(SUBJECT_CONTENT_MODELS.Lesson.deleteMany).not.toHaveBeenCalled();
  });
});

describe('written content', () => {
  const ctx = { sectionLessonIds: new Set(['with_sections']), unclaimed: new Set(['system-seed-id']) };

  it('counts sections, a real owner, or a saved version as work', () => {
    expect(hasWrittenContent({ contentId: 'with_sections', createdBy: 'system-seed-id' }, ctx)).toBe(true);
    expect(hasWrittenContent({ contentId: 'x', createdBy: 'alice' }, ctx)).toBe(true);
    expect(hasWrittenContent({ contentId: 'x', createdBy: 'system-seed-id', ownerId: 'alice' }, ctx)).toBe(true);
    expect(hasWrittenContent({ contentId: 'x', createdBy: 'system-seed-id', version: 2 }, ctx)).toBe(true);
  });

  it('treats bare scaffold as nobody\'s work', () => {
    expect(hasWrittenContent({ contentId: 'x', createdBy: 'system-seed-id', version: 1 }, ctx)).toBe(false);
  });

  it('finds written lessons and anything else people made in a subject', async () => {
    db.docs.Lesson = [
      { subjectId: 'PHYSICS', contentId: 'P_L1', createdBy: 'system-seed-id', version: 1 },
      { subjectId: 'PHYSICS', contentId: 'P_L2', createdBy: 'system-seed-id', version: 1 },
      { subjectId: 'PHYSICS', contentId: 'P_L3', createdBy: 'alice', version: 1 },
    ];
    db.docs.Section = [{ subjectId: 'PHYSICS', lessonContentId: 'P_L2' }];
    db.docs.Question = [{ subjectId: 'PHYSICS' }];

    const written = await writtenContent('PHYSICS');
    expect([...written.lessons].sort()).toEqual(['P_L2', 'P_L3']);
    expect(written.other).toBe(1);
    expect(isEmptyOfWork(written)).toBe(false);
  });

  it('calls a subject of bare scaffold empty', async () => {
    db.docs.Lesson = [{ subjectId: 'PHYSICS', contentId: 'P_L1', createdBy: 'system-seed-id', version: 1 }];
    expect(isEmptyOfWork(await writtenContent('PHYSICS'))).toBe(true);
  });
});

describe('opening a subject', () => {
  it('creates the subject for system_seed, with no units or lessons', async () => {
    const { Subject } = await import('@/lib/models/Subject');
    const { Unit } = await import('@/lib/models/Unit');
    const { Lesson } = await import('@/lib/models/Lesson');

    expect(await openSubject('QURAN')).toEqual({ subjectId: 'QURAN', opened: true });
    expect(Subject.create.mock.calls[0][0]).toMatchObject({ subjectId: 'QURAN', createdBy: 'system-seed-id' });
    expect(Unit.insertMany).not.toHaveBeenCalled();
    expect(Lesson.insertMany).not.toHaveBeenCalled();
  });

  it('leaves an opened subject alone', async () => {
    const { Subject } = await import('@/lib/models/Subject');
    db.docs.Subject = [{ subjectId: 'QURAN' }];
    expect(await openSubject('QURAN')).toEqual({ subjectId: 'QURAN', opened: false });
    expect(Subject.create).not.toHaveBeenCalled();
  });

  it('refuses a subject that is not in the list', async () => {
    await expect(openSubject('ASTROLOGY')).rejects.toThrow();
  });
});

describe('units and their lesson targets', () => {
  it('numbers a new unit after the last one, never reusing a deleted number', async () => {
    const { Unit } = await import('@/lib/models/Unit');
    db.docs.Unit = [
      { subjectId: 'PHYSICS', contentId: 'PHYSICS_U1' },
      { subjectId: 'PHYSICS', contentId: 'PHYSICS_U3' },
    ];
    await createUnit('PHYSICS', { title: ' الحركة ', targetLessons: 5 });
    expect(Unit.create.mock.calls[0][0]).toMatchObject({
      contentId: 'PHYSICS_U4', order: 4, title: 'الحركة', targetLessons: 5, createdBy: 'system-seed-id',
    });
  });

  it('falls back to the current lesson count until a target is set', () => {
    expect(unitTarget({ targetLessons: null }, 3)).toBe(3);
    expect(unitTarget({ targetLessons: 7 }, 3)).toBe(7);
    expect(unitTarget({ targetLessons: 0 }, 3)).toBe(0);
  });

  it('accepts whole numbers in range and empty, nothing else', () => {
    expect(parseTarget('12')).toBe(12);
    expect(parseTarget(0)).toBe(0);
    expect(parseTarget('')).toBe(null);
    expect(parseTarget(null)).toBe(null);
    for (const bad of ['-1', '2.5', 'ستة', '201', 3.5]) expect(parseTarget(bad)).toBeUndefined();
  });

  it('adds up subject progress from the units in the database', async () => {
    db.aggregates.Lesson = [
      { _id: { subjectId: 'PHYSICS', unit: 'PHYSICS_U1' }, total: 4, approved: 2 },
      { _id: { subjectId: 'PHYSICS', unit: 'PHYSICS_U2' }, total: 2, approved: 0 },
    ];
    db.docs.Unit = [
      { subjectId: 'PHYSICS', contentId: 'PHYSICS_U1', targetLessons: 6 },
      { subjectId: 'PHYSICS', contentId: 'PHYSICS_U2', targetLessons: null },
    ];
    const rows = await getAllSubjectsProgress();
    expect(rows.find((r) => r.subjectId === 'PHYSICS')).toMatchObject({
      unitCount: 2, totalLessons: 6, approvedLessons: 2, targetLessons: 8,
    });
    expect(rows.find((r) => r.subjectId === 'QURAN')).toMatchObject({ unitCount: 0, targetLessons: 0 });
  });
});

describe('books', () => {
  const unit = (n, bookId = null, bookTitle = null) => ({
    _id: `u${n}`, subjectId: 'ARABIC', contentId: `ARABIC_U${n}`, order: n, bookId, bookTitle, bookOrder: null,
  });

  it('starts a new book with the next free id and numbers its units by order', async () => {
    db.docs.Unit = [unit(1, 'ARABIC_BOOK_1', 'المطالعة'), unit(2), unit(3)];
    const r = await setUnitBook('u3', { title: ' النحو ' });
    expect(r).toEqual({ bookId: 'ARABIC_BOOK_2', bookTitle: 'النحو', bookOrder: 1 });
  });

  it('joins an existing book, takes its title, and renumbers it', async () => {
    db.docs.Unit = [unit(1, 'B', 'المطالعة'), unit(2), unit(3, 'B', 'المطالعة')];
    await setUnitBook('u2', { id: 'B' });
    expect(db.docs.Unit.map((u) => [u.bookId, u.bookTitle, u.bookOrder])).toEqual([
      ['B', 'المطالعة', 1], ['B', 'المطالعة', 2], ['B', 'المطالعة', 3],
    ]);
  });

  it('renumbers the book a unit leaves', async () => {
    db.docs.Unit = [unit(1, 'B', 'x'), unit(2, 'B', 'x'), unit(3, 'B', 'x')];
    await setUnitBook('u1', null);
    expect(db.docs.Unit.map((u) => [u.bookId, u.bookOrder])).toEqual([[null, null], ['B', 1], ['B', 2]]);
  });

  it('refuses a book the subject does not have', async () => {
    db.docs.Unit = [unit(1)];
    expect(await setUnitBook('u1', { id: 'NOPE' })).toMatchObject({ status: 400 });
  });

  it('renames a book on every unit in it', async () => {
    db.docs.Unit = [unit(1, 'B', 'قديم'), unit(2, 'B', 'قديم'), unit(3, 'C', 'آخر')];
    expect(await renameBook('ARABIC', 'B', 'جديد')).toBe(2);
    expect(db.docs.Unit.map((u) => u.bookTitle)).toEqual(['جديد', 'جديد', 'آخر']);
  });
});
