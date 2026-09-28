'use client';
import { useSyncExternalStore } from 'react';

/**
 * useBreakpoint
 * ─────────────────────────────────────────────────────────────────────────────
 * Three tiers, not two. The editor previously classified everything as either
 * `mobile` or `desktop` at a single 768px cut, so the whole 768–1200px band —
 * tablets, split-screen laptops — got the desktop sidebar rail next to
 * full-bleed page content with nothing designed for it.
 *
 * Tiers match the Tailwind screens used across the editor:
 *   mobile  < 768   bottom nav, single column, full-width cards
 *   tablet  768–1199 sidebar rail, two columns, denser chrome
 *   desktop >= 1200  expandable sidebar, full layouts
 *
 * Implemented with useSyncExternalStore so the server snapshot is stable and
 * hydration doesn't warn. The server always renders `desktop`; the first
 * client commit corrects it. Components that must not flash should branch on
 * CSS rather than this hook.
 */

export const BREAKPOINTS = { tablet: 768, desktop: 1200 };

const QUERIES = {
  tablet:  `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
};

function subscribe(onChange) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const lists = Object.values(QUERIES).map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener('change', onChange));
  return () => lists.forEach((l) => l.removeEventListener('change', onChange));
}

function getSnapshot() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  if (window.matchMedia(QUERIES.desktop).matches) return 'desktop';
  if (window.matchMedia(QUERIES.tablet).matches)  return 'tablet';
  return 'mobile';
}

const getServerSnapshot = () => 'desktop';

export function useBreakpoint() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Convenience flags. `isCompact` covers "no room for the expanded sidebar". */
export function useLayout() {
  const breakpoint = useBreakpoint();
  return {
    breakpoint,
    isMobile:  breakpoint === 'mobile',
    isTablet:  breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isCompact: breakpoint !== 'desktop',
  };
}
