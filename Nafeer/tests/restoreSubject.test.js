import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stand-ins: each model reads from db.docs[name]; written content is set per test.
const db = vi.hoisted(() => ({ docs: {}, written: new Set() }));
const fake = vi.hoisted(() => (name) => ({
  find: ({ subjectId }) => {
    const q = {
      select: () => q, session: () => q, lean: () => q,
      then: (ok) => Promise.resolve((db.docs[name] || []).filter((d) => d.subjectId === subjectId)).then(ok),
    };
    return q;
  },
}));

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/FirebaseAdmin', () => ({ getManifest: vi.fn() }));
vi.mock('@/lib/SeedActor', () => ({ ensureSystemSeedContributor: vi.fn(async () => 'seed') }));
vi.mock('@/lib/subjectContent', () => ({
  deleteSubjectContent: vi.fn(),
  writtenContent: async () => ({ lessons: db.written, other: 0 }),
}));
for (const name of ['Subject', 'Unit', 'Lesson', 'Section', 'Block', 'Concept', 'Tag', 'FeedItem', 'Question', 'Exam']) {
  vi.doMock(`@/lib/models/${name}`, () => ({ [name]: fake(name) }));
}

const { publishedIds, buildRestoreDocs, carryAuthorship, unpublishedWork } = await import('@/lib/restoreSubject');

// A published file with one unit, two lessons, one section with one block.
const FILE = {
  subject: { id: 'PHYSICS', nameAr: 'فيزياء' },
  units: [{
    id: 'PHYSICS_U1', title: 'الحركة', order: 1,
    lessons: [
      {
        id: 'PHYSICS_U1_L1', title: 'السرعة', order: 1,
        sections: [{ id: 'S1', title: 'مقدمة', order: 1, blocks: [{ id: 'B1', type: 'TEXT', order: 1 }] }],
      },
      { id: 'PHYSICS_U1_L2', title: 'التسارع', order: 2 },
    ],
  }],
  questions: [{ id: 'Q1', type: 'MCQ', textAr: 'سؤال' }],
};
const PUBLISHED = new Date('2026-10-10T00:00:00Z');
const BEFORE = new Date('2026-10-09T00:00:00Z');
const AFTER = new Date('2026-10-12T00:00:00Z');

beforeEach(() => {
  db.docs = {};
  db.written = new Set();
});

describe('the published file', () => {
  it('lists the ids it contains per model', () => {
    const ids = publishedIds(FILE);
    expect([...ids.Lesson]).toEqual(['PHYSICS_U1_L1', 'PHYSICS_U1_L2']);
    expect([...ids.Block]).toEqual(['B1']);
    expect([...ids.Question]).toEqual(['Q1']);
  });

  it('builds new documents for system_seed, with the admin as reviewer', () => {
    const docs = buildRestoreDocs(FILE, { seedActor: 'seed', actorId: 'admin' });
    expect(docs.Lesson).toHaveLength(2);
    expect(docs.Block[0]).toMatchObject({ contentId: 'B1', sectionContentId: 'S1', subjectId: 'PHYSICS' });
    for (const d of Object.values(docs).flat()) expect(d).toMatchObject({ createdBy: 'seed', reviewedBy: 'admin' });
  });
});

describe('carrying authorship over', () => {
  it("keeps each document's author, a lesson's owner and credits, a unit's target", () => {
    const docs = buildRestoreDocs(FILE, { seedActor: 'seed', actorId: 'admin' });
    carryAuthorship(docs, {
      Subject: new Map([['PHYSICS', { createdBy: 'owner' }]]),
      Unit: new Map([['PHYSICS_U1', { createdBy: 'seed', targetLessons: 6 }]]),
      Lesson: new Map([['PHYSICS_U1_L1', { createdBy: 'alice', ownerId: 'bob', credits: [{ kind: 'author' }] }]]),
      Block: new Map([['B1', { createdBy: 'alice' }]]),
    });
    expect(docs.Subject[0].createdBy).toBe('owner');
    expect(docs.Unit[0]).toMatchObject({ createdBy: 'seed', targetLessons: 6 });
    expect(docs.Lesson[0]).toMatchObject({ createdBy: 'alice', ownerId: 'bob', credits: [{ kind: 'author' }] });
    expect(docs.Lesson[1].createdBy).toBe('seed');
    expect(docs.Block[0].createdBy).toBe('alice');
  });
});

describe('what a restore would lose', () => {
  it('lists written lessons missing from the file and lessons edited after the publish', async () => {
    db.docs.Lesson = [
      { subjectId: 'PHYSICS', contentId: 'PHYSICS_U1_L1', title: 'السرعة', updatedAt: BEFORE },
      { subjectId: 'PHYSICS', contentId: 'PHYSICS_U1_L2', title: 'التسارع', updatedAt: AFTER },
      { subjectId: 'PHYSICS', contentId: 'PHYSICS_U1_L3', title: 'مسودة', updatedAt: AFTER },
      { subjectId: 'PHYSICS', contentId: 'PHYSICS_U1_L4', title: 'الدرس 4', updatedAt: BEFORE },
    ];
    db.written = new Set(['PHYSICS_U1_L3']);
    const loss = await unpublishedWork('PHYSICS', FILE, PUBLISHED);
    expect(loss.lessons).toEqual([
      { id: 'PHYSICS_U1_L2', title: 'التسارع', why: 'edited' },
      { id: 'PHYSICS_U1_L3', title: 'مسودة', why: 'unpublished' },
    ]);
    expect(loss.emptyLessons).toBe(1);
    expect(loss.total).toBe(2);
  });

  it('counts a block edited after the publish against its lesson', async () => {
    db.docs.Lesson = [{ subjectId: 'PHYSICS', contentId: 'PHYSICS_U1_L1', title: 'السرعة', updatedAt: BEFORE }];
    db.docs.Section = [{ subjectId: 'PHYSICS', contentId: 'S1', lessonContentId: 'PHYSICS_U1_L1', updatedAt: BEFORE }];
    db.docs.Block = [{ subjectId: 'PHYSICS', contentId: 'B1', sectionContentId: 'S1', updatedAt: AFTER }];
    const loss = await unpublishedWork('PHYSICS', FILE, PUBLISHED);
    expect(loss.lessons).toEqual([{ id: 'PHYSICS_U1_L1', title: 'السرعة', why: 'edited' }]);
  });

  it('counts other content missing from the file', async () => {
    db.docs.Question = [
      { subjectId: 'PHYSICS', contentId: 'Q1', updatedAt: BEFORE },
      { subjectId: 'PHYSICS', contentId: 'Q2', updatedAt: BEFORE },
    ];
    const loss = await unpublishedWork('PHYSICS', FILE, PUBLISHED);
    expect(loss.other).toEqual({ Question: 1 });
    expect(loss.total).toBe(1);
  });

  it('reports nothing for a subject that matches the file', async () => {
    db.docs.Lesson = [{ subjectId: 'PHYSICS', contentId: 'PHYSICS_U1_L1', title: 'السرعة', updatedAt: BEFORE }];
    expect((await unpublishedWork('PHYSICS', FILE, PUBLISHED)).total).toBe(0);
  });
});
