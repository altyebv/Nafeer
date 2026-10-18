'use client';
/**
 * Single GSAP + plugin registration point.
 * Import { gsap, ScrollTrigger } from '@/lib/gsap' everywhere.
 * Never call gsap.registerPlugin() in individual components.
 */
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The one way the landing animates (docs/design-system.md §6).
 *
 * Content ships visible: `setup` uses gsap.from(), so a reveal animates FROM
 * hidden and the server HTML never holds opacity 0. Under
 * prefers-reduced-motion: reduce, setup never runs — no reveals, parallax or
 * ambient loops. Everything is scoped to `ref` and reverted on unmount.
 *
 *   useMotion(ref, (q) => {
 *     reveal('.card', { trigger: ref.current, stagger: 0.1 });
 *   });
 */
export function useMotion(ref, setup, deps = []) {
  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => setup(ref.current), ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Fade-and-rise from hidden when `trigger` scrolls into view (once).
 * Pass `trigger: null` for an entrance that plays immediately.
 */
export function reveal(targets, { trigger, y = 24, x = 0, start = 'top 85%', ...rest } = {}) {
  return gsap.from(targets, {
    opacity: 0, y, x,
    duration: 0.7, ease: 'power3.out',
    ...rest,
    ...(trigger === null ? {} : { scrollTrigger: { trigger: trigger ?? targets, start, once: true } }),
  });
}
