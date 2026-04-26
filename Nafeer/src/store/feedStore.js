import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── feedStore ────────────────────────────────────────────────────────────────
// Owns: feedItems

export const useFeedStore = create(
  persist(
    (set) => ({
      feedItems: [],

      // ── Add a single new feed item (created locally in the editor) ─────────
      addFeedItem: (feedItem) =>
        set((state) => {
          // Skip if this id already exists (idempotent load-from-atlas calls)
          if (feedItem.id && state.feedItems.some((f) => f.id === feedItem.id)) {
            return state;
          }
          const conceptFeedItems = state.feedItems.filter((f) => f.conceptId === feedItem.conceptId);
          return {
            feedItems: [
              ...state.feedItems,
              {
                ...feedItem,
                id:         feedItem.id || generateId('feed'),
                order:      feedItem.order      ?? conceptFeedItems.length,
                priority:   feedItem.priority   || 1,
                back:       feedItem.back        || null,
                questionId: feedItem.questionId  || null,
                lessonId:   feedItem.lessonId    || null,
                unitId:     feedItem.unitId      || null,
              },
            ],
          };
        }),

      updateFeedItem: (id, updates) =>
        set((state) => ({
          feedItems: state.feedItems.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),

      deleteFeedItem: (id) =>
        set((state) => ({ feedItems: state.feedItems.filter((f) => f.id !== id) })),

      // ── Bulk replace feed items for a subject (called after Atlas load) ────
      // Replaces ALL feed items — used by AdminEditorWorkspace on workspace load.
      loadFeedItems: (items) =>
        set({ feedItems: items }),

      resetFeed: () => set({ feedItems: [] }),
    }),
    { name: 'basheer-feed' }
  )
);