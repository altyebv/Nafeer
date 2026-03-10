import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── contentStore ─────────────────────────────────────────────────────────────
// Owns: sections, blocks

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
                learningType: section.learningType || 'UNDERSTANDING',
              },
            ],
          };
        }),

      updateSection: (id, updates) =>
        set((state) => ({
          sections: state.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
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
            return { ...s, conceptIds: [...conceptIds, conceptId] };
          }),
        })),

      unlinkConceptFromSection: (sectionId, conceptId) =>
        set((state) => ({
          sections: state.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return { ...s, conceptIds: (s.conceptIds || []).filter((id) => id !== conceptId) };
          }),
        })),

      // ── Blocks ────────────────────────────────────────────────────────────
      addBlock: (block) =>
        set((state) => {
          const sectionBlocks = state.blocks.filter((b) => b.sectionId === block.sectionId);
          return {
            blocks: [
              ...state.blocks,
              { ...block, id: block.id || generateId('block'), order: sectionBlocks.length + 1 },
            ],
          };
        }),

      updateBlock: (id, updates) =>
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      deleteBlock: (id) =>
        set((state) => ({ blocks: state.blocks.filter((b) => b.id !== id) })),

      // ── Bulk operations (for lesson load/cascade delete) ──────────────────
      loadLessonContent: ({ sections, blocks }) => {
        set((state) => {
          // Remove existing sections/blocks for these lessons, add new
          const existingSectionIds = new Set(sections.map((s) => s.id));
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

      deleteLessonContent: (lessonId, sectionIds) =>
        set((state) => ({
          sections: state.sections.filter((s) => s.lessonId !== lessonId),
          blocks:   state.blocks.filter((b) => !sectionIds.includes(b.sectionId)),
        })),

      // ── Reset ─────────────────────────────────────────────────────────────
      resetContent: () => set({ sections: [], blocks: [] }),
    }),
    { name: 'basheer-content' }
  )
);
