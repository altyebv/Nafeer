'use client';
import { useEffect, useRef, useCallback } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

// ─── Magnetic button hook ────────────────────────────────────────────────────
function useMagnetic(strength = 0.35) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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

// ────────────────────────────────────────────────────────────────────────────

const MASK_OFFSCREEN = 'radial-gradient(circle 260px at -9999px -9999px, black 0%, transparent 72%)';

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
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const mask = `radial-gradient(circle 280px at ${x}px ${y}px, black 0%, transparent 68%)`;
    glowRef.current.style.webkitMaskImage = mask;
    glowRef.current.style.maskImage       = mask;
  }, []);

  const handleWatermarkLeave = useCallback(() => {
    if (!glowRef.current) return;
    glowRef.current.style.webkitMaskImage = MASK_OFFSCREEN;
    glowRef.current.style.maskImage       = MASK_OFFSCREEN;
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── 1. Orbs — continuous drift with scale oscillation ─────────────────
      gsap.to('.gsap-orb-1', { x: 45, y: -35, scale: 1.12, duration: 9,  ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.gsap-orb-2', { x: -35, y: 45, scale: 0.88, duration: 12, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3 });
      gsap.to('.gsap-orb-3', { x: 28, y: 22,  scale: 1.08, duration: 7,  ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5 });

      // ── 2. Entrance timeline ───────────────────────────────────────────────
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl
        .to('.gsap-hero-badge', { opacity: 1, y: 0, scale: 1, duration: 0.7 }, 0.15)
        .to('.gsap-hero-eyebrow', { opacity: 1, y: 0, duration: 0.55 }, '-=0.3')
        // Clip-path reveal — premium title entrance
        .to('.gsap-hero-title', {
          opacity: 1, y: 0,
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.15,
          ease: 'expo.out',
        }, '-=0.2')
        // Ember line draws from left
        .to('.gsap-hero-line', { scaleX: 1, duration: 0.9, ease: 'expo.out' }, '-=0.6')
        .to('.gsap-hero-subtitle', { opacity: 1, y: 0, duration: 0.85 }, '-=0.5')
        .to('.gsap-hero-desc',     { opacity: 1, y: 0, duration: 0.75 }, '-=0.45')
        .to('.gsap-hero-cta',      { opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.14 }, '-=0.4')
        .to('.gsap-hero-stat',     { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, '-=0.25')
        .to('.gsap-hero-scroll',   { opacity: 1, duration: 0.8 }, '-=0.1');

      // ── 3. Watermark parallax on scroll ────────────────────────────────────
      gsap.to('.gsap-watermark', {
        y: 140,
        ease: 'none',
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1.8 },
      });
      gsap.to('.gsap-watermark-base', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: '60% top', scrub: 1.2 },
      });

      // ── 4. Content gentle parallax ─────────────────────────────────────────
      gsap.to('.gsap-hero-content', {
        y: -55,
        ease: 'none',
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1.4 },
      });

      // ── 5. Scroll dot bobbing ──────────────────────────────────────────────
      gsap.to('.gsap-scroll-dot', {
        y: 10,
        duration: 1.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="absolute inset-0 mesh-bg" />

      {/* ── Watermark: two stacked layers ──────────────────────────────────── */}
      <div
        ref={watermarkRef}
        className="gsap-watermark absolute left-0 top-1/2 -translate-y-1/2 select-none"
        style={{ cursor: 'default', zIndex: 1 }}
        onMouseMove={handleWatermarkMove}
        onMouseLeave={handleWatermarkLeave}
      >
        {/* Base dim layer */}
        <span
          className="gsap-watermark-base text-[24vw] font-arabic font-bold leading-none block"
          style={{ color: 'var(--text-primary)', opacity: 0.03, pointerEvents: 'none' }}
        >
          بشير
        </span>

        {/* Glow layer — mask set inline so it's offscreen before JS runs */}
        <span
          ref={glowRef}
          aria-hidden="true"
          className="text-[24vw] font-arabic font-bold leading-none block pointer-events-none"
          style={{
            position:        'absolute',
            top:             0,
            left:            0,
            color:           'var(--accent)',
            maskImage:       MASK_OFFSCREEN,
            WebkitMaskImage: MASK_OFFSCREEN,
            textShadow: [
              '0 0 40px rgba(212,137,30,1)',
              '0 0 90px rgba(212,137,30,0.7)',
              '0 0 160px rgba(212,137,30,0.4)',
              '0 0 240px rgba(212,137,30,0.2)',
            ].join(', '),
          }}
        >
          بشير
        </span>
      </div>

      {/* Floating orbs */}
      <div className="gsap-orb-1 absolute top-1/4 left-1/4 w-80 sm:w-[30rem] h-80 sm:h-[30rem] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--mesh-1) 0%, transparent 70%)' }} />
      <div className="gsap-orb-2 absolute bottom-1/3 right-1/4 w-60 sm:w-80 h-60 sm:h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--mesh-2) 0%, transparent 70%)' }} />
      <div className="gsap-orb-3 absolute top-3/4 left-1/2 w-44 h-44 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,137,30,0.06) 0%, transparent 70%)' }} />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="gsap-hero-content relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-28 sm:py-36">

        {/* Badge — pre-hidden via inline style */}
        <div
          className="gsap-hero-badge mb-5 sm:mb-6 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-sm font-mono"
          style={{
            border: '1px solid var(--border-mid)', background: 'var(--bg-card)', color: 'var(--text-muted)',
            opacity: 0, transform: 'translateY(16px) scale(0.94)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
          قيد البناء — نبحث عن مساهمين
        </div>

        {/* Eyebrow */}
        <p
          className="gsap-hero-eyebrow text-lg sm:text-sm font-mono mb-3 sm:mb-4 tracking-widest uppercase"
          style={{ color: 'var(--accent)', opacity: 0, transform: 'translateY(12px)' }}
        >
          رفيق الشهادة السودانية
        </p>

        {/* Headline block */}
        <div className="mb-5 sm:mb-7">
          <h1
            className="gsap-hero-title pt-1.5 text-6xl sm:text-7xl md:text-[9rem] font-arabic font-bold leading-none"
            style={{
              color:    'var(--text-primary)',
              opacity:  0,
              transform: 'translateY(55px)',
              clipPath: 'inset(0% 0% 100% 0%)',
            }}
          >
            بَشير
          </h1>

          {/* Ember line — pre-collapsed, GSAP expands */}
          <div
            className="gsap-hero-line ember-line w-24 sm:w-36 my-4 sm:my-5"
            style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
          />

          <h2
            className="gsap-hero-subtitle text-xl sm:text-2xl md:text-3xl font-arabic leading-relaxed max-w-2xl"
            style={{ color: 'var(--text-secondary)', opacity: 0, transform: 'translateY(26px)' }}
          >
            من الحفظ إلى الفهم —{' '}
            <span style={{ color: 'var(--accent)' }}>لأول مرة، المنهج كما يجب أن يكون</span>
          </h2>
        </div>

        {/* Description */}
        <p
          className="gsap-hero-desc text-base sm:text-lg max-w-lg leading-loose mb-9 sm:mb-11 font-arabic"
          style={{ color: 'var(--text-muted)', opacity: 0, transform: 'translateY(18px)' }}
        >
          الشهادة السودانية ليست مشكلة — طريقة دراستها هي المشكلة.
          بشير يأخذ المنهج نفسه ويجعله أوضح، أقرب، وأكثر معنىً.
          في جيبك. بدون إنترنت. مجاناً.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-10 sm:mb-12">
          <a
            ref={cta1Ref}
            href="#features"
            className="gsap-hero-cta group inline-flex items-center gap-2 sm:gap-3 px-7 sm:px-9 py-3.5 sm:py-4 font-bold rounded-xl transition-colors duration-200 text-sm sm:text-base"
            style={{ background: 'var(--accent)', color: '#0e0c09', opacity: 0, transform: 'translateY(16px) scale(0.96)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 0 50px var(--glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span>اكتشف بشير</span>
            <span className="text-lg group-hover:-translate-x-1 transition-transform duration-300" style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>←</span>
          </a>

          <a
            ref={cta2Ref}
            href="/prejoin"
            className="gsap-hero-cta group inline-flex items-center gap-2 sm:gap-3 px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl transition-colors duration-200 text-sm sm:text-base font-bold"
            style={{ border: '1px solid var(--border-mid)', color: 'var(--text-secondary)', opacity: 0, transform: 'translateY(16px) scale(0.96)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <span>ساهم في بنائه</span>
            <span className="text-sm group-hover:-translate-x-1 transition-transform duration-300" style={{ display: 'inline-block', transform: 'scaleX(-1)', opacity: 0.7 }}>←</span>
          </a>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-7 sm:gap-12 pt-6 sm:pt-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {[
            { value: '١٢',   label: 'مادة في متناولك' },
            { value: '٠',    label: 'اتصال مطلوب'     },
            { value: '١٠٠٪', label: 'مجاني — للأبد'   },
          ].map((s, i) => (
            <div key={i} className="gsap-hero-stat" style={{ opacity: 0, transform: 'translateY(12px)' }}>
              <div className="text-xl sm:text-2xl font-bold font-mono stat-number" style={{ color: 'var(--accent)' }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="gsap-hero-scroll absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: 'var(--text-muted)', opacity: 0, zIndex: 10 }}
      >
        <span className="text-xs tracking-widest uppercase hidden sm:block font-mono">scroll</span>
        <div className="relative h-12 sm:h-16 flex flex-col items-center gap-1.5">
          <div className="gsap-scroll-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
          <div className="w-px flex-1" style={{ background: 'linear-gradient(to bottom, var(--text-muted), transparent)' }} />
        </div>
      </div>
    </section>
  );
}