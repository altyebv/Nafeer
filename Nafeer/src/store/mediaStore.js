import { create } from 'zustand';

// ─── useMediaStore ────────────────────────────────────────────────────────────
// Holds the media library for the current session.
// Media is loaded once per session when the MediaPage mounts.
// No optimistic updates — the source of truth is always Supabase + MongoDB.

export const useMediaStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  media:        [],
  mediaLoading: false,
  mediaError:   null,

  // ── Setters ────────────────────────────────────────────────────────────────
  setMedia: (media) => set({ media, mediaLoading: false, mediaError: null }),

  setMediaLoading: (loading) => set({ mediaLoading: loading }),

  setMediaError: (error) => set({ mediaError: error, mediaLoading: false }),

  // Prepend a newly uploaded item to the top of the list
  addMediaItem: (item) => set((s) => ({ media: [item, ...s.media] })),

  // Remove by contentId
  removeMediaItem: (contentId) =>
    set((s) => ({ media: s.media.filter((m) => m.contentId !== contentId) })),

  resetMedia: () => set({ media: [], mediaLoading: false, mediaError: null }),
}));