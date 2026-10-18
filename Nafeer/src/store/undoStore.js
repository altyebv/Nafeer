'use client';
import { create } from 'zustand';
import { useContentStore } from '@/store/contentStore';

// ─── undoStore — deletes you can take back ────────────────────────────────────
// Deleting a block or a section removes it from the editor at once and keeps
// it here for UNDO_MS. «تراجع» puts it back exactly as it was; otherwise the
// server delete goes out when the time is up. Leaving the page sends pending
// deletes straight away (keepalive), so nothing is left half-done.
//
// The server is only told after the window closes, so an undone delete costs
// no request at all.

export const UNDO_MS = 8000;

const remove = (url) => fetch(url, { method: 'DELETE', keepalive: true }).catch(() => {});

export const useUndoStore = create((set, get) => ({
  pending: [], // [{ key, label, restore, commit, timer }]

  // Remove a block now; send the delete later unless undone.
  deleteBlock(block, label) {
    const before = useContentStore.getState().blocks;
    useContentStore.setState({ blocks: before.filter((b) => b.id !== block.id) });
    get().schedule({
      key: `block:${block.id}`,
      label,
      restore: () => useContentStore.setState((s) => ({ blocks: [...s.blocks, block] })),
      commit: () => remove(`/api/content/blocks/${encodeURIComponent(block.id)}`),
    });
  },

  // Remove a section with its blocks now; same window.
  deleteSection(section, label) {
    const { sections, blocks } = useContentStore.getState();
    const own = blocks.filter((b) => b.sectionId === section.id);
    useContentStore.setState({
      sections: sections.filter((s) => s.id !== section.id),
      blocks: blocks.filter((b) => b.sectionId !== section.id),
    });
    get().schedule({
      key: `section:${section.id}`,
      label,
      restore: () => useContentStore.setState((s) => ({ sections: [...s.sections, section], blocks: [...s.blocks, ...own] })),
      commit: () => remove(`/api/content/sections/${encodeURIComponent(section.id)}`),
    });
  },

  schedule(item) {
    const timer = setTimeout(() => get().commit(item.key), UNDO_MS);
    set((s) => ({ pending: [...s.pending.filter((p) => p.key !== item.key), { ...item, timer }] }));
  },

  undo(key) {
    const item = get().pending.find((p) => p.key === key);
    if (!item) return;
    clearTimeout(item.timer);
    item.restore();
    set((s) => ({ pending: s.pending.filter((p) => p.key !== key) }));
  },

  commit(key) {
    const item = get().pending.find((p) => p.key === key);
    if (!item) return;
    clearTimeout(item.timer);
    item.commit();
    set((s) => ({ pending: s.pending.filter((p) => p.key !== key) }));
  },

  flush() {
    for (const p of get().pending) { clearTimeout(p.timer); p.commit(); }
    set({ pending: [] });
  },
}));
