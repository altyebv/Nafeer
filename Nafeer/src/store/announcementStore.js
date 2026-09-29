'use client';
import { create } from 'zustand';

/**
 * ANNOUNCEMENT STORE
 * ─────────────────────────────────────────────────────────────────────────────
 * One fetch of /api/contributors/announcement per session, shared by the
 * sidebar's nav badge and the dashboard's list. Both used to run their own
 * useEffect fetch, so the endpoint was hit twice on every load of the
 * dashboard — and the sidebar, being in the persistent layout, refetched
 * nothing on navigation while the dashboard refetched on every visit.
 *
 * Not persisted: announcements are short-lived and cheap to refetch, and a
 * stale cached list is worse than a brief empty one.
 */
export const useAnnouncementStore = create((set, get) => ({
  announcements: [],
  loading:       false,
  loaded:        false,
  error:         null,

  /** Fetch once per session. Pass { force: true } after posting one. */
  fetchAnnouncements: async ({ force = false } = {}) => {
    const { loaded, loading } = get();
    if (loading || (loaded && !force)) return;

    set({ loading: true, error: null });
    try {
      const res  = await fetch('/api/contributors/announcement');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'failed');
      set({ announcements: json.data, loading: false, loaded: true });
    } catch (err) {
      set({ loading: false, loaded: true, error: err.message || 'failed' });
    }
  },

  reset: () => set({ announcements: [], loading: false, loaded: false, error: null }),
}));
