'use client';
import { create } from 'zustand';

/**
 * THEME STORE
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for light/dark. Replaces three independent copies of
 * a local `useTheme` hook (DesktopSidebar, MobileBottomNav, landing Navbar),
 * each holding its own useState and writing the DOM attribute differently.
 *
 * Two bugs that came out of the old arrangement:
 *
 *   1. The editor's toggle wrote `dataset.theme = ''` for dark while
 *      layout.jsx and the pre-paint script write `'dark'`. The CSS only keys
 *      off [data-theme="light"] so it happened to look right, but the
 *      attribute was inconsistent and unreadable by anything else.
 *
 *   2. layout.jsx hard-coded data-theme="dark" in JSX while the pre-paint
 *      script set it from localStorage — so loading the editor in light mode
 *      produced a React hydration mismatch on every page view.
 *
 * `theme` starts as 'dark' so server and first client render agree; `syncTheme`
 * reconciles with what the pre-paint script already put on <html>. Nothing
 * reads localStorage during render.
 */

export const STORAGE_KEY = 'nafeer-theme';

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export const useThemeStore = create((set, get) => ({
  theme:   'dark',
  hydrated: false,

  /** Adopt whatever the pre-paint script resolved. Safe to call repeatedly. */
  syncTheme: () => {
    if (typeof document === 'undefined') return;
    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
    const attr  = document.documentElement.getAttribute('data-theme');
    const theme = stored === 'light' || stored === 'dark'
      ? stored
      : (attr === 'light' ? 'light' : 'dark');

    applyTheme(theme);
    set({ theme, hydrated: true });
  },

  setTheme: (theme) => {
    const next = theme === 'light' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private mode */ }
    applyTheme(next);
    set({ theme: next });
  },

  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));
