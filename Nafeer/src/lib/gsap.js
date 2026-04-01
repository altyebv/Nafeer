'use client';
/**
 * Single GSAP + plugin registration point.
 * Import { gsap, ScrollTrigger } from '@/lib/gsap' everywhere.
 * Never call gsap.registerPlugin() in individual components.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };