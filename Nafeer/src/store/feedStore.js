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

      addFeedItem: (feedItem) =>
        set((state) => {
          const conceptFeedItems = state.feedItems.filter((f) => f.conceptId === feedItem.conceptId);
          return {
            feedItems: [
              ...state.feedItems,
              {
                ...feedItem,
                id:         feedItem.id || generateId('feed'),
                order:      conceptFeedItems.length,
                priority:   feedItem.priority  || 1,
                back:       feedItem.back      || null,
                questionId: feedItem.questionId || null,
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

      resetFeed: () => set({ feedItems: [] }),
    }),
    { name: 'basheer-feed' }
  )
);
