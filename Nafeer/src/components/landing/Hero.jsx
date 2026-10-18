'use client';
import { useEffect, useRef, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { gsap, useMotion, prefersReducedMotion } from '@/lib/gsap';
import { Button } from '@/components/ui';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

// ─── Magnetic button hook ────────────────────────────────────────────────────
// Pointer-only flourish; off under reduced motion.
function useMagnetic(strength = 0.35) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) return undefined;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      gsap.to(el, { x: (e.clientX - cx) * strength, y: (e.clientY - cy) * strength, duration: 0.4, ease: 'power2.out' });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [strength]);
  return ref;
}

const MASK_OFFSCREEN = 'radial-gradient(circle 260px at -9999px -9999px, black 0%, transparent 72%)';

// The subject count comes from the catalog, so the landing can't drift from it.
const STATS = [
  { value: String(SUBJECTS_CATALOG.length), label: 'مادة في متناولك' },
  { value: '0',    label: 'اتصال مطلوب' },
  { value: '100%', label: 'مجاني — للأبد' },
];

export default function Hero() {
  const heroRef      = useRef(null);
  const watermarkRef = useRef(null);
  const glowRef      = useRef(null);
  const cta1Ref      = useMagnetic(0.28);
  const cta2Ref      = useMagnetic(0.28);

  // ── Cursor glow — zero re-renders ─────────────────────────────────────────
  const handleWatermarkMove = useCallback((e) => {
    if (!glowRef.current || !watermarkRef.current) return;
    const rect = watermarkRef.current.getBoundingClientRect();
    const mask = `radial-gradient(circle 280px at ${e.clientX - rect.left}px ${e.clientY - rect.top}px, black 0%, transparent 68%)`;
    glowRef.current.style.webkitMaskImage = mask;
    glowRef.current.style.maskImage       = mask;
  }, []);

  const handleWatermarkLeave = useCallback(() => {
    if (!glowRef.current) return;
    glowRef.current.style.webkitMaskImage = MASK_OFFSCREEN;
    glowRef.current.style.maskImage       = MASK_OFFSCREEN;
  }, []);

  useMotion(heroRef, (hero) => {
    // Ambient orbs
    gsap.to('.gsap-orb-1', { x: 45, y: -35, scale: 1.12, duration: 9,  ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.gsap-orb-2', { x: -35, y: 45, scale: 0.88, duration: 12, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3 });
    gsap.to('.gsap-orb-3', { x: 28, y: 22,  scale: 1.08, duration: 7,  ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5 });

    // Entrance — every step animates FROM hidden; the HTML is already visible.
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .from('.gsap-hero-badge',    { opacity: 0, y: 16, scale: 0.94, duration: 0.7 }, 0.15)
      .from('.gsap-hero-eyebrow',  { opacity: 0, y: 12, duration: 0.55 }, '-=0.3')
      .from('.gsap-hero-title',    { opacity: 0, y: 55, clipPath: 'inset(0% 0% 100% 0%)', duration: 1.15, ease: 'expo.out' }, '-=0.2')
      .from('.gsap-hero-line',     { scaleX: 0, transformOrigin: 'left center', duration: 0.9, ease: 'expo.out' }, '-=0.6')
      .from('.gsap-hero-subtitle', { opacity: 0, y: 26, duration: 0.85 }, '-=0.5')
      .from('.gsap-hero-desc',     { opacity: 0, y: 18, duration: 0.75 }, '-=0.45')
      .from('.gsap-hero-cta',      { opacity: 0, y: 16, scale: 0.96, duration: 0.65, stagger: 0.14 }, '-=0.4')
      .from('.gsap-hero-stat',     { opacity: 0, y: 12, duration: 0.5, stagger: 0.1 }, '-=0.25')
      .from('.gsap-hero-scroll',   { opacity: 0, duration: 0.8 }, '-=0.1');

    // Scroll parallax
    const scrub = (target, vars, end = 'bottom top', s = 1.4) =>
      gsap.to(target, { ...vars, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end, scrub: s } });
    scrub('.gsap-watermark', { y: 140 }, 'bottom top', 1.8);
    scrub('.gsap-watermark-base', { opacity: 0 }, '60% top', 1.2);
    scrub('.gsap-hero-content', { y: -55 });

    gsap.to('.gsap-scroll-dot', { y: 10, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  });

  return (
    <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-page">
      <div aria-hidden="true" className="absolute inset-0 mesh-bg" />

      {/* ── Watermark: a dim base and a glow layer revealed under the pointer ── */}
      <div
        ref={watermarkRef}
        aria-hidden="true"
        className="gsap-watermark absolute left-0 top-1/2 -translate-y-1/2 select-none cursor-default"
        onMouseMove={handleWatermarkMove}
        onMouseLeave={handleWatermarkLeave}
      >
        <span className="gsap-watermark-base l-watermark l-mark-24 font-arabic font-bold leading-none block pointer-events-none">بشير</span>
        <span ref={glowRef} className="l-glow-text absolute top-0 left-0 l-mark-24 font-arabic font-bold leading-none block pointer-events-none">بشير</span>
      </div>

      {/* Floating orbs */}
      <div aria-hidden="true" className="gsap-orb-1 l-orb-1 absolute top-1/4 left-1/4 w-80 sm:w-[30rem] h-80 sm:h-[30rem] rounded-full blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="gsap-orb-2 l-orb-2 absolute bottom-1/3 right-1/4 w-60 sm:w-80 h-60 sm:h-80 rounded-full blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="gsap-orb-3 l-orb-3 absolute top-3/4 left-1/2 w-44 h-44 rounded-full blur-3xl pointer-events-none" />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="gsap-hero-content relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-36">

        <p className="gsap-hero-badge mb-5 sm:mb-6 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-line-strong bg-raised t-label text-fg-muted">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-success motion-safe:animate-pulse" />
          قيد البناء — نبحث عن مساهمين
        </p>

        {/* One <h1> spanning the eyebrow and the wordmark, so the page's only
            top-level heading reads "رفيق الشهادة السودانية بَشير" — the head
            term plus the brand. Each line is a block span sized on its own. */}
        <div className="mb-5 sm:mb-7">
          <h1 className="m-0 p-0 font-normal text-base">
            <span className="gsap-hero-eyebrow block t-eyebrow text-base sm:text-lg mb-3 sm:mb-4">رفيق الشهادة السودانية</span>
            {/* Explicit space so the h1's text isn't one glued token. */}
            {' '}
            <span className="gsap-hero-title block pt-1.5 l-wordmark font-arabic font-bold leading-none text-fg-strong">بَشير</span>
          </h1>

          <div aria-hidden="true" className="gsap-hero-line ember-line w-24 sm:w-36 my-4 sm:my-5" />

          <p className="gsap-hero-subtitle text-xl sm:text-2xl md:text-3xl font-arabic leading-relaxed max-w-2xl text-fg-muted">
            ما بين القراءة و الفهم —{' '}
            <span className="text-fg-accent">لأول مرة، المنهج كما يجب أن يكون</span>
          </p>
        </div>

        <p className="gsap-hero-desc t-body sm:text-lg max-w-lg leading-loose mb-9 sm:mb-11 text-fg-muted">
          الشهادة السودانية ليست مشكلة — طريقة دراستها هي المشكلة.
          بشير يأخذ المنهج نفسه ويجعله أوضح، أقرب، وأكثر معنىً.
          في جيبك. بدون إنترنت. مجاناً.
        </p>

        <div className="flex flex-wrap gap-3 sm:gap-4 mb-10 sm:mb-12">
          <span ref={cta1Ref} className="gsap-hero-cta inline-block">
            <Button as="a" href="#features" variant="primary" size="lg" iconEnd={ArrowLeft}>اكتشف بشير</Button>
          </span>
          <span ref={cta2Ref} className="gsap-hero-cta inline-block">
            <Button as="a" href="/join" variant="secondary" size="lg" iconEnd={ArrowLeft}>ساهم في بنائه</Button>
          </span>
        </div>

        <dl className="flex flex-wrap gap-7 sm:gap-12 pt-6 sm:pt-8 border-t border-line">
          {STATS.map((s) => (
            <div key={s.label} className="gsap-hero-stat flex flex-col-reverse">
              <dt className="t-caption text-fg-muted mt-0.5">{s.label}</dt>
              <dd className="t-num text-xl sm:text-2xl font-bold font-ui text-fg-accent">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Scroll indicator */}
      <div aria-hidden="true" className="gsap-hero-scroll absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-fg-subtle">
        <span dir="ltr" className="t-caption hidden sm:block">scroll</span>
        <div className="relative h-12 sm:h-16 flex flex-col items-center gap-1.5">
          <div className="gsap-scroll-dot w-1.5 h-1.5 rounded-full bg-accent" />
          <div className="w-px flex-1 l-fade-down" />
        </div>
      </div>
    </section>
  );
}
