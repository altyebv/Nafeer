import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── conceptStore ─────────────────────────────────────────────────────────────
// Owns: concepts, tags

export const useConceptStore = create(
  persist(
    (set) => ({
      concepts: [],
      tags:     [],

      // ── Concepts ──────────────────────────────────────────────────────────
      addConcept: (concept) =>
        set((state) => ({
          concepts: [
            ...state.concepts,
            {
              ...concept,
              id:         concept.id || generateId('concept'),
              tagIds:     concept.tagIds     || [],
              difficulty: concept.difficulty || 1,
            },
          ],
        })),

      updateConcept: (id, updates) =>
        set((state) => ({
          concepts: state.concepts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteConcept: (id) =>
        set((state) => ({
          concepts: state.concepts.filter((c) => c.id !== id),
        })),

      // Concept ↔ Tag linking
      linkTagToConcept: (conceptId, tagId) =>
        set((state) => ({
          concepts: state.concepts.map((c) => {
            if (c.id !== conceptId) return c;
            const tagIds = c.tagIds || [];
            if (tagIds.includes(tagId)) return c;
            return { ...c, tagIds: [...tagIds, tagId] };
          }),
        })),

      unlinkTagFromConcept: (conceptId, tagId) =>
        set((state) => ({
          concepts: state.concepts.map((c) => {
            if (c.id !== conceptId) return c;
            return { ...c, tagIds: (c.tagIds || []).filter((id) => id !== tagId) };
          }),
        })),

      // ── Tags ──────────────────────────────────────────────────────────────
      addTag: (tag) =>
        set((state) => ({
          tags: [...state.tags, { ...tag, id: tag.id || generateId('tag') }],
        })),

      updateTag: (id, updates) =>
        set((state) => ({
          tags: state.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTag: (id) =>
        set((state) => ({
          tags:     state.tags.filter((t) => t.id !== id),
          concepts: state.concepts.map((c) => ({
            ...c,
            tagIds: (c.tagIds || []).filter((tId) => tId !== id),
          })),
        })),

      // ── Reset ─────────────────────────────────────────────────────────────
      resetConcepts: () => set({ concepts: [], tags: [] }),
    }),
    { name: 'basheer-concepts' }
  )
);
