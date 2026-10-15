import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Concurrent edits: server side ────────────────────────────────────────────
// Two contributors saving the same lesson used to be last-write-wins, and a
// save from a stale cache recreated blocks someone else had deleted. A write
// that carries `baseVersion` must now land only on the version it was based on.

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/trackStat', () => ({ trackStat: vi.fn() }));

const { model } = vi.hoisted(() => ({
  model: (name) => async () => ({ [name]: (await import('./helpers/fakeVersionedModel.js')).fakeVersionedModel() }),
}));
vi.mock('@/lib/models/Block',         model('Block'));
vi.mock('@/lib/models/Section',       model('Section'));
vi.mock('@/lib/models/Lesson',        model('Lesson'));
vi.mock('@/lib/models/Question',      model('Question'));
vi.mock('@/lib/models/LessonHistory', () => ({ LessonHistory: { create: vi.fn(async () => {}) } }));
vi.mock('@/lib/models/Contributor',   () => ({ Contributor: {} }));

const { Block }   = await import('@/lib/models/Block');
const { Section } = await import('@/lib/models/Section');
const { Lesson }  = await import('@/lib/models/Lesson');
const { batchUpsertBlocks, batchUpsertSections, upsertBlock } = await import('@/lib/api/content');
const { updateLesson } = await import('@/lib/api/lessons');
const { VersionConflict } = await import('@/lib/api/versionCheck');

const ACTOR = '65f000000000000000000001';
const block = (over = {}) => ({
  contentId: 'blk_1', subjectId: 'GEOGRAPHY', sectionContentId: 'sec_1',
  type: 'TEXT', content: 'نص', order: 1, ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  Block.seed([{ ...block(), version: 3, status: 'draft' }]);
  Section.seed([{ contentId: 'sec_1', subjectId: 'GEOGRAPHY', lessonContentId: 'les_1', title: 'قسم', order: 1, version: 2 }]);
  Lesson.seed([{ contentId: 'les_1', subjectId: 'GEOGRAPHY', title: 'درس', version: 5, status: 'draft' }]);
});

describe('block saves', () => {
  it('write when the base version is current, and bump it', async () => {
    const { saved, conflicts } = await batchUpsertBlocks([block({ content: 'جديد', baseVersion: 3 })], ACTOR);
    expect(conflicts).toEqual([]);
    expect(saved[0]).toMatchObject({ content: 'جديد', version: 4 });
  });

  it('refuse a stale base and return the stored copy instead', async () => {
    const { saved, conflicts } = await batchUpsertBlocks([block({ content: 'قديم', baseVersion: 2 })], ACTOR);
    expect(saved).toEqual([]);
    expect(conflicts).toEqual([
      { contentId: 'blk_1', reason: 'changed', current: expect.objectContaining({ content: 'نص', version: 3 }) },
    ]);
    expect(Block.docs.get('blk_1').content).toBe('نص');
  });

  it('do not recreate a block that was deleted after the editor loaded it', async () => {
    Block.seed([]);
    const { saved, conflicts } = await batchUpsertBlocks([block({ baseVersion: 3 })], ACTOR);
    expect(saved).toEqual([]);
    expect(conflicts).toEqual([{ contentId: 'blk_1', reason: 'deleted', current: null }]);
    expect(Block.create).not.toHaveBeenCalled();
  });

  it('create new blocks, which carry no base version', async () => {
    const { saved } = await batchUpsertBlocks([block({ contentId: 'blk_new' })], ACTOR);
    expect(saved[0]).toMatchObject({ contentId: 'blk_new', version: 1 });
  });

  it('write the rest of a batch when one item conflicts', async () => {
    const { saved, conflicts } = await batchUpsertBlocks([
      block({ content: 'قديم', baseVersion: 1 }),
      block({ contentId: 'blk_new' }),
    ], ACTOR);
    expect(saved.map((d) => d.contentId)).toEqual(['blk_new']);
    expect(conflicts.map((c) => c.contentId)).toEqual(['blk_1']);
  });

  it('treat a document written before versioning as version 1', async () => {
    Block.seed([{ ...block() }]);
    const { saved, conflicts } = await batchUpsertBlocks([block({ content: 'جديد', baseVersion: 1 })], ACTOR);
    expect(conflicts).toEqual([]);
    expect(saved[0]).toMatchObject({ content: 'جديد', version: 2 });
  });

  it('catch a save that lands between the check and the write', async () => {
    Block.beforeUpdate = () => { Block.docs.get('blk_1').version = 4; };
    await expect(upsertBlock(block({ baseVersion: 3 }), ACTOR)).rejects.toBeInstanceOf(VersionConflict);
  });

  it('still write unconditionally without a base version (older callers)', async () => {
    const { saved } = await batchUpsertBlocks([block({ content: 'بدون نسخة' })], ACTOR);
    expect(saved[0]).toMatchObject({ content: 'بدون نسخة', version: 4 });
  });
});

describe('section saves', () => {
  it('refuse a stale base', async () => {
    const { conflicts } = await batchUpsertSections([
      { contentId: 'sec_1', title: 'قديم', order: 1, baseVersion: 1 },
    ], ACTOR);
    expect(conflicts[0]).toMatchObject({ contentId: 'sec_1', reason: 'changed' });
  });

  it('persist partIndex, which used to be dropped', async () => {
    const { saved } = await batchUpsertSections([
      { contentId: 'sec_1', title: 'قسم', order: 1, partIndex: 2, baseVersion: 2 },
      { contentId: 'sec_2', subjectId: 'GEOGRAPHY', lessonContentId: 'les_1', title: 'ثانٍ', order: 2, partIndex: 1 },
    ], ACTOR);
    expect(saved.map((s) => s.partIndex)).toEqual([2, 1]);
  });
});

describe('lesson meta saves', () => {
  it('refuse a stale base', async () => {
    await expect(updateLesson('les_1', { title: 'قديم' }, ACTOR, '', '', '', false, 4))
      .rejects.toMatchObject({ reason: 'changed', current: expect.objectContaining({ version: 5 }) });
  });

  it('write at the current base', async () => {
    const lesson = await updateLesson('les_1', { title: 'جديد' }, ACTOR, '', '', '', false, 5);
    expect(lesson).toMatchObject({ title: 'جديد', version: 6 });
  });
});
