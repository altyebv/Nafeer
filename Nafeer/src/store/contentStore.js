import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistConfig } from './persistConfig';
import { BLOCK_TYPE_CONFIG } from '@/shared/constants';
import { mergeLessonContent, applySaved, fromServerSection, fromServerBlock } from '@/lib/editorSync';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── contentStore ─────────────────────────────────────────────────────────────
// Owns: sections, blocks
//
// Every edit marks the item `_dirty`; saves send only dirty items, each with
// the server version it was based on (`_v`). See lib/editorSync.js.

export const useContentStore = create(
  persist(
    (set, get) => ({
      sections: [],
      blocks:   [],

      // ── Sections ──────────────────────────────────────────────────────────
      addSection: (section) =>
        set((state) => {
          const lessonSections = state.sections.filter((s) => s.lessonId === section.lessonId);
          return {
            sections: [
              ...state.sections,
              {
                ...section,
                id:           section.id || generateId('sec'),
                order:        lessonSections.length + 1,
                conceptIds:   section.conceptIds   || [],
                learningType: section.learningType || 'UNDERSTANDING', kind: section.kind || 'GENERAL',
                partIndex:    section.partIndex    ?? 0,
                _dirty:       true,
              },
            ],
          };
        }),

      updateSection: (id, updates) =>
        set((state) => ({
          sections: state.sections.map((s) => (s.id === id ? { ...s, ...updates, _dirty: true } : s)),
        })),

      deleteSection: (id) =>
        set((state) => ({
          sections: state.sections.filter((s) => s.id !== id),
          blocks:   state.blocks.filter((b) => b.sectionId !== id),
        })),

      // Concept ↔ Section linking
      linkConceptToSection: (sectionId, conceptId) =>
        set((state) => ({
          sections: state.sections.map((s) => {
            if (s.id !== sectionId) return s;
            const conceptIds = s.conceptIds || [];
            if (conceptIds.includes(conceptId)) return s;
            return { ...s, conceptIds: [...conceptIds, conceptId], _dirty: true };
          }),
        })),

      unlinkConceptFromSection: (sectionId, conceptId) =>
        set((state) => ({
          sections: state.sections.map((s) => {
            if (s.id !== sectionId) return s;
            if (!(s.conceptIds || []).includes(conceptId)) return s;
            return { ...s, conceptIds: s.conceptIds.filter((id) => id !== conceptId), _dirty: true };
          }),
        })),

      // ── Blocks ────────────────────────────────────────────────────────────
      addBlock: (block) =>
        set((state) => {
          const sectionBlocks = state.blocks.filter((b) => b.sectionId === block.sectionId);
          const defaultMeta   = BLOCK_TYPE_CONFIG[block.type]?.defaultMeta ?? null;
          return {
            blocks: [
              ...state.blocks,
              {
                ...block,
                id:       block.id || generateId('block'),
                order:    sectionBlocks.length + 1,
                metadata: block.metadata ?? defaultMeta,
                _dirty:   true,
              },
            ],
          };
        }),

      updateBlock: (id, updates) =>
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates, _dirty: true } : b)),
        })),

      deleteBlock: (id) =>
        set((state) => ({ blocks: state.blocks.filter((b) => b.id !== id) })),

      // ── reorderBlocks ──────────────────────────────────────────────────────
      // Accepts the final ordered array of block IDs for a section and writes
      // new `order` values in one atomic set() call — avoids N re-renders.
      reorderBlocks: (sectionId, orderedIds) =>
        set((state) => ({
          blocks: state.blocks.map((b) => {
            if (b.sectionId !== sectionId) return b;
            const idx = orderedIds.indexOf(b.id);
            // Only blocks that actually moved need saving.
            return idx >= 0 && b.order !== idx + 1 ? { ...b, order: idx + 1, _dirty: true } : b;
          }),
        })),

      // ── Bulk operations (for lesson load/cascade delete) ──────────────────
      loadLessonContent: ({ sections, blocks }) => {
        set((state) => {
          const existingSectionIds      = new Set(sections.map((s) => s.id));
          const existingBlockSectionIds = new Set(sections.map((s) => s.id));

          return {
            sections: [
              ...state.sections.filter((s) => !existingSectionIds.has(s.id)),
              ...sections,
            ],
            blocks: [
              ...state.blocks.filter((b) => !existingBlockSectionIds.has(b.sectionId)),
              ...blocks,
            ],
          };
        });
      },

      // ── Server sync ───────────────────────────────────────────────────────
      // Folds the lesson GET's sections (with their blocks) into the cache
      // without dropping unsaved local work.
      mergeServerLesson: (lessonId, serverSections) =>
        set((state) => mergeLessonContent(state, lessonId, serverSections)),

      // After a save — `sent` are the store items posted, `saved` the docs
      // the server wrote.
      markSaved: (kind, sent, saved) =>
        set((state) => ({ [kind]: applySaved(state[kind], sent, saved) })),

      // Conflict resolution. `current` is the server's copy, null if deleted.
      // Keep mine: re-base the local edit on the server's version (or drop
      // the base so a deleted item is created again); the next save writes it.
      keepMine: (kind, id, current) =>
        set((state) => ({
          [kind]: state[kind].map((item) => {
            if (item.id !== id) return item;
            const { _v, ...rest } = item;
            return current ? { ...rest, _v: current.version ?? 1, _dirty: true } : { ...rest, _dirty: true };
          }),
        })),

      // Take theirs: replace the local copy with the server's, or drop it
      // (with a section's blocks) when the server deleted it.
      takeTheirs: (kind, id, current) =>
        set((state) => {
          if (current) {
            const incoming = kind === 'sections' ? fromServerSection(current) : fromServerBlock(current);
            return { [kind]: state[kind].map((item) => (item.id === id ? incoming : item)) };
          }
          if (kind === 'sections') {
            return {
              sections: state.sections.filter((s) => s.id !== id),
              blocks:   state.blocks.filter((b) => b.sectionId !== id),
            };
          }
          return { blocks: state.blocks.filter((b) => b.id !== id) };
        }),

      deleteLessonContent: (lessonId, sectionIds) =>
        set((state) => ({
          sections: state.sections.filter((s) => s.lessonId !== lessonId),
          blocks:   state.blocks.filter((b) => !sectionIds.includes(b.sectionId)),
        })),

      // ── Reset ─────────────────────────────────────────────────────────────
      resetContent: () => set({ sections: [], blocks: [] }),
    }),
    persistConfig('basheer-content', { sections: [], blocks: [] })
  )
);