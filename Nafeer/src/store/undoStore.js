'use client';
import { create } from 'zustand';
import { useContentStore } from '@/store/contentStore';
import { useQuizStore } from '@/store/quizStore';

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

  // Remove a block now; send the delete later unless undone. A checkpoint
  // block takes its question with it (the server deletes both, lib/api/content.js).
  deleteBlock(block, label) {
    const before = useContentStore.getState().blocks;
    useContentStore.setState({ blocks: before.filter((b) => b.id !== block.id) });
    const questionId = block.type === 'QUESTION' ? String(block.content ?? '').trim() : '';
    get().schedule({
      key: `block:${block.id}`,
      label,
      questionId: questionId || null,   // hidden from its section meanwhile (pendingQuestionIds)
      restore: () => useContentStore.setState((s) => ({ blocks: [...s.blocks, block] })),
      // Both go out at once (keepalive), so leaving the page sends both.
      commit: () => {
        remove(`/api/content/blocks/${encodeURIComponent(block.id)}`);
        if (!questionId) return;
        useQuizStore.getState().deleteQuestion(questionId);
        // The question saves on its own, so it can be on the server while its
        // block never was; then only this delete removes it. A 404 is fine.
        remove(`/api/content/questions/${encodeURIComponent(questionId)}`);
      },
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

  /** Questions whose checkpoint block is being deleted: not shown as unplaced while it can be undone. */
  pendingQuestionIds() {
    return get().pending.map((p) => p.questionId).filter(Boolean);
  },

  flush() {
    for (const p of get().pending) { clearTimeout(p.timer); p.commit(); }
    set({ pending: [] });
  },
}));
