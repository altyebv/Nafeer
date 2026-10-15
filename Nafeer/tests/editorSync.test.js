import { describe, it, expect } from 'vitest';
import { mergeLessonContent, mergeLesson, applySaved, fromServerLesson } from '@/lib/editorSync';

// ─── Concurrent edits: client side ────────────────────────────────────────────
// Opening a lesson folds Atlas's copy into the local cache. It must never drop
// unsaved local work, and must stop stale cached items from being saved over
// someone else's newer ones.

const srvBlock = (id, over = {}) => ({
  contentId: id, sectionContentId: 'sec_1', type: 'TEXT', content: `server ${id}`, order: 1, version: 2, ...over,
});
const srvSection = (blocks, over = {}) => ({
  contentId: 'sec_1', lessonContentId: 'les_1', title: 'قسم', order: 1, version: 1, blocks, ...over,
});
const local = (id, over = {}) => ({
  id, sectionId: 'sec_1', type: 'TEXT', content: `local ${id}`, order: 1, ...over,
});
const sec = (over = {}) => ({
  id: 'sec_1', lessonId: 'les_1', title: 'قسم', order: 1, learningType: 'UNDERSTANDING',
  kind: 'GENERAL', conceptIds: [], partIndex: 0, _v: 1, ...over,
});
const merge = (blocks, serverBlocks, sections = [sec()]) =>
  mergeLessonContent({ sections, blocks }, 'les_1', [srvSection(serverBlocks)]);
const byId = (state, id) => state.blocks.find((b) => b.id === id);

describe('opening a lesson', () => {
  it('loads blocks this browser has never seen', () => {
    const state = merge([], [srvBlock('b1')]);
    expect(byId(state, 'b1')).toMatchObject({ content: 'server b1', _v: 2 });
  });

  it('replaces clean local blocks with the server copy', () => {
    const state = merge([local('b1', { _v: 1 })], [srvBlock('b1')]);
    expect(byId(state, 'b1')).toMatchObject({ content: 'server b1', _v: 2 });
  });

  it('keeps unsaved local edits, still based on the version they started from', () => {
    const state = merge([local('b1', { _v: 1, _dirty: true })], [srvBlock('b1')]);
    expect(byId(state, 'b1')).toMatchObject({ content: 'local b1', _v: 1, _dirty: true });
  });

  it('drops blocks deleted on the server, unless they hold unsaved work', () => {
    const state = merge([local('gone', { _v: 1 }), local('edited', { _v: 1, _dirty: true })], []);
    expect(byId(state, 'gone')).toBeUndefined();
    expect(byId(state, 'edited')).toMatchObject({ _dirty: true, _v: 1 });
  });

  it('keeps never-saved local blocks and marks them for the next save', () => {
    const state = merge([local('new')], []);
    expect(byId(state, 'new')).toMatchObject({ _dirty: true });
    expect(byId(state, 'new')._v).toBeUndefined();
  });

  it('treats a differing block from an old cache as a local edit on the current version', () => {
    const state = merge([local('b1')], [srvBlock('b1')]);
    expect(byId(state, 'b1')).toMatchObject({ content: 'local b1', _v: 2, _dirty: true });
  });

  it('adopts the server copy of an old-cache block that matches it', () => {
    const state = merge([local('b1', { content: 'server b1' })], [srvBlock('b1')]);
    expect(byId(state, 'b1')).toMatchObject({ _v: 2 });
    expect(byId(state, 'b1')._dirty).toBeUndefined();
  });

  it('drops a section deleted on the server together with its clean blocks', () => {
    const state = mergeLessonContent(
      { sections: [sec()], blocks: [local('b1', { _v: 1 })] }, 'les_1', []
    );
    expect(state.sections).toEqual([]);
    expect(state.blocks).toEqual([]);
  });

  it('keeps a deleted section while one of its blocks holds unsaved work', () => {
    const state = mergeLessonContent(
      { sections: [sec()], blocks: [local('b1', { _v: 1, _dirty: true })] }, 'les_1', []
    );
    expect(state.sections.map((s) => s.id)).toEqual(['sec_1']);
    expect(state.blocks.map((b) => b.id)).toEqual(['b1']);
  });

  it('leaves other lessons alone', () => {
    const other = { id: 'sec_9', lessonId: 'les_9', _v: 1 };
    const otherBlock = { id: 'b9', sectionId: 'sec_9', _v: 1 };
    const state = mergeLessonContent({ sections: [sec(), other], blocks: [otherBlock] }, 'les_1', []);
    expect(state.sections).toContain(other);
    expect(state.blocks).toContain(otherBlock);
  });
});

describe('lesson meta', () => {
  const doc = { contentId: 'les_1', title: 'من الخادم', version: 4, status: 'review' };

  it('takes the server copy when the local one is clean', () => {
    expect(mergeLesson({ id: 'les_1', title: 'قديم', _v: 3 }, fromServerLesson(doc)))
      .toMatchObject({ title: 'من الخادم', _v: 4, atlasStatus: 'review' });
  });

  it('keeps unsaved local meta but refreshes the status', () => {
    expect(mergeLesson({ id: 'les_1', title: 'محلي', _v: 3, _dirty: true }, fromServerLesson(doc)))
      .toMatchObject({ title: 'محلي', _v: 3, atlasStatus: 'review' });
  });
});

describe('after a save', () => {
  it('marks sent items clean at the new version', () => {
    const b = local('b1', { _v: 1, _dirty: true });
    const [saved] = applySaved([b], [b], [{ contentId: 'b1', version: 2 }]);
    expect(saved).toMatchObject({ _v: 2, _dirty: false });
  });

  it('keeps an item dirty if it was edited while the save was in flight', () => {
    const sent  = local('b1', { _v: 1, _dirty: true });
    const later = { ...sent, content: 'typed during save' };
    const [saved] = applySaved([later], [sent], [{ contentId: 'b1', version: 2 }]);
    expect(saved).toMatchObject({ content: 'typed during save', _v: 2, _dirty: true });
  });
});
