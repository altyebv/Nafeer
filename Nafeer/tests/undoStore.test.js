import { describe, it, expect, beforeEach, vi } from 'vitest';

// Deletes you can take back: nothing reaches the server until the window
// closes, and «تراجع» restores the item exactly as it was.

const content = vi.hoisted(() => {
  let state = { sections: [], blocks: [] };
  return {
    useContentStore: {
      getState: () => state,
      setState: (patch) => { state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }; },
      reset: (s) => { state = s; },
    },
  };
});
vi.mock('@/store/contentStore', () => content);

const { useUndoStore, UNDO_MS } = await import('@/store/undoStore');
const store = content.useContentStore;

beforeEach(() => {
  vi.useFakeTimers();
  globalThis.fetch = vi.fn(async () => ({ ok: true }));
  store.reset({
    sections: [{ id: 's1', title: 'الفكرة' }],
    blocks: [{ id: 'b1', sectionId: 's1', content: 'نص', _dirty: false }, { id: 'b2', sectionId: 's1' }],
  });
  useUndoStore.setState({ pending: [] });
});

describe('undoStore', () => {
  it('removes a block at once and deletes it on the server only after the window', () => {
    useUndoStore.getState().deleteBlock(store.getState().blocks[0], '«نص»');
    expect(store.getState().blocks.map((b) => b.id)).toEqual(['b2']);
    expect(fetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(UNDO_MS);
    expect(fetch).toHaveBeenCalledWith('/api/content/blocks/b1', expect.objectContaining({ method: 'DELETE', keepalive: true }));
    expect(useUndoStore.getState().pending).toHaveLength(0);
  });

  it('undo restores the block as it was and never calls the server', () => {
    const b1 = store.getState().blocks[0];
    useUndoStore.getState().deleteBlock(b1, '«نص»');
    useUndoStore.getState().undo('block:b1');
    vi.advanceTimersByTime(UNDO_MS * 2);
    expect(store.getState().blocks).toContainEqual(b1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('a section takes its blocks with it, and brings them back', () => {
    useUndoStore.getState().deleteSection(store.getState().sections[0], 'القسم');
    expect(store.getState().sections).toHaveLength(0);
    expect(store.getState().blocks).toHaveLength(0);
    useUndoStore.getState().undo('section:s1');
    expect(store.getState().sections).toHaveLength(1);
    expect(store.getState().blocks).toHaveLength(2);
  });

  it('leaving the page sends what is pending straight away', () => {
    useUndoStore.getState().deleteBlock(store.getState().blocks[0], 'a');
    useUndoStore.getState().deleteSection(store.getState().sections[0], 'b');
    useUndoStore.getState().flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(useUndoStore.getState().pending).toHaveLength(0);
  });
});
