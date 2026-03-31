'use client';
import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef      = useRef(null);
  const watermarkRef = useRef(null);   // container — receives pointer events
  const glowRef      = useRef(null);   // glow layer — mask updated directly

  // ── Cursor-glow: direct DOM mutation, zero re-renders ─────────────────────
  const handleWatermarkMove = useCallback((e) => {
    if (!glowRef.current || !watermarkRef.current) return;
    const rect = watermarkRef.current.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const mask = `radial-gradient(circle 260px at ${x}px ${y}px, black 0%, transparent 72%)`;
    glowRef.current.style.webkitMaskImage = mask;
    glowRef.current.style.maskImage       = mask;
  }, []);

  const handleWatermarkLeave = useCallback(() => {
    if (!glowRef.current) return;
    const offscreen = 'radial-gradient(circle 260px at -9999px -9999px, black 0%, transparent 72%)';
    glowRef.current.style.webkitMaskImage = offscreen;
    glowRef.current.style.maskImage       = offscreen;
  }, []);

  useEffect(() => {
    // Initialise glow mask to offscreen so nothing shows until hover
    if (glowRef.current) {
      const offscreen = 'radial-gradient(circle 260px at -9999px -9999px, black 0%, transparent 72%)';
      glowRef.current.style.webkitMaskImage = offscreen;
      glowRef.current.style.maskImage       = offscreen;
    }

    const ctx = gsap.context(() => {
      // ── Orbs — continuous drift ─────────────────────────────────────────
      gsap.to('.gsap-orb-1', { x: 40, y: -30, duration: 9,  ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.gsap-orb-2', { x: -30, y: 40, duration: 12, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3 });
      gsap.to('.gsap-orb-3', { x: 25, y: 20,  duration: 7,  ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5 });

      // ── Entrance timeline ───────────────────────────────────────────────
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl
        .fromTo('.gsap-hero-badge',
          { opacity: 0, y: 16, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.65 })
        .fromTo('.gsap-hero-eyebrow',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5 }, '-=0.15')
        .fromTo('.gsap-hero-title',
          { opacity: 0, y: 55, skewY: 2 },
          { opacity: 1, y: 0, skewY: 0, duration: 1.05 }, '-=0.2')
        .fromTo('.gsap-hero-line',
          { scaleX: 0 },
          { scaleX: 1, transformOrigin: 'right center', duration: 0.75, ease: 'expo.out' }, '-=0.55')
        .fromTo('.gsap-hero-subtitle',
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 0.8 }, '-=0.45')
        .fromTo('.gsap-hero-desc',
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
        .fromTo('.gsap-hero-cta',
          { opacity: 0, y: 16, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.13 }, '-=0.35')
        .fromTo('.gsap-hero-stat',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.09 }, '-=0.25')
        .fromTo('.gsap-hero-scroll',
          { opacity: 0 },
          { opacity: 1, duration: 0.6 }, '-=0.1');

      // ── Watermark scroll: y-parallax on outer wrapper ───────────────────
      //    opacity fade on the base span only, so the glow layer can be
      //    full-opacity and controlled purely by the mask.
      gsap.fromTo('.gsap-watermark',
        { y: 0 },
        {
          y: 130,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        }
      );
      gsap.fromTo('.gsap-watermark-base',
        { opacity: 0.03 },
        {
          opacity: 0,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        }
      );

      // ── Hero content gentle parallax ────────────────────────────────────
      gsap.fromTo('.gsap-hero-content',
        { y: 0 },
        {
          y: -50,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
          },
        }
      );
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

      {/* ── Watermark ───────────────────────────────────────────────────────
          Two stacked layers:
          1. Base (dim) — GSAP fades from 0.03 → 0 on scroll
          2. Glow (accent) — full opacity, revealed only under cursor via
             a radial-gradient mask that moves with the mouse.
          The outer wrapper is the GSAP scroll target for the y-parallax.
      ── */}
      <div
        ref={watermarkRef}
        className="gsap-watermark absolute left-0 top-1/2 -translate-y-1/2 select-none"
        style={{ position: 'absolute', cursor: 'default' }}
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

        {/* Glow layer — mask-controlled, full opacity, sits on top */}
        <span
          ref={glowRef}
          aria-hidden="true"
          className="text-[24vw] font-arabic font-bold leading-none block pointer-events-none"
          style={{
            position:   'absolute',
            top:        0,
            left:       0,
            color:      'var(--accent)',
            textShadow: [
              '0 0 40px rgba(212,137,30,1)',
              '0 0 80px rgba(212,137,30,0.7)',
              '0 0 140px rgba(212,137,30,0.4)',
              '0 0 220px rgba(212,137,30,0.2)',
            ].join(', '),
          }}
        >
          بشير
        </span>
      </div>

      {/* Floating orbs */}
      <div
        className="gsap-orb-1 absolute top-1/4 left-1/4 w-80 sm:w-[30rem] h-80 sm:h-[30rem] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--mesh-1) 0%, transparent 70%)' }}
      />
      <div
        className="gsap-orb-2 absolute bottom-1/3 right-1/4 w-60 sm:w-80 h-60 sm:h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--mesh-2) 0%, transparent 70%)' }}
      />
      <div
        className="gsap-orb-3 absolute top-3/4 left-1/2 w-44 h-44 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,137,30,0.06) 0%, transparent 70%)' }}
      />

      {/* Main content */}
      <div className="gsap-hero-content relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-28 sm:py-36">

        {/* Live status badge */}
        <div
          className="gsap-hero-badge mb-5 sm:mb-6 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-mono"
          style={{
            border:     '1px solid var(--border-mid)',
            background: 'var(--bg-card)',
            color:      'var(--text-muted)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
          قيد البناء — نبحث عن مساهمين
        </div>

        {/* Eyebrow */}
        <p
          className="gsap-hero-eyebrow text-xs sm:text-sm font-mono mb-3 sm:mb-4 tracking-widest uppercase"
          style={{ color: 'var(--accent)' }}
        >
          تطبيق الشهادة السودانية
        </p>

        {/* Headline block */}
        <div className="mb-5 sm:mb-7">
          <h1
            className="gsap-hero-title text-6xl sm:text-7xl md:text-[9rem] font-arabic font-bold leading-none"
            style={{ color: 'var(--text-primary)' }}
          >
            بَشير
          </h1>
          <div className="gsap-hero-line ember-line w-24 sm:w-36 my-4 sm:my-5" />
          <h2
            className="gsap-hero-subtitle text-xl sm:text-2xl md:text-3xl font-arabic leading-relaxed max-w-2xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            من الحفظ إلى الفهم —{' '}
            <span style={{ color: 'var(--accent)' }}>لأول مرة، المنهج كما يجب أن يكون</span>
          </h2>
        </div>

        {/* Description */}
        <p
          className="gsap-hero-desc text-base sm:text-lg max-w-lg leading-loose mb-9 sm:mb-11 font-arabic"
          style={{ color: 'var(--text-muted)' }}
        >
          الشهادة السودانية ليست مشكلة — طريقة دراستها هي المشكلة.
          بشير يأخذ المنهج نفسه ويجعله أوضح، أقرب، وأكثر معنىً.
          في جيبك. بدون إنترنت. مجاناً.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-10 sm:mb-12">
          <a
            href="#features"
            className="gsap-hero-cta group inline-flex items-center gap-2 sm:gap-3 px-7 sm:px-9 py-3.5 sm:py-4 font-bold rounded-xl transition-all duration-300 text-sm sm:text-base"
            style={{ background: 'var(--accent)', color: '#0e0c09' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.boxShadow  = '0 0 50px var(--glow)';
              e.currentTarget.style.transform  = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.boxShadow  = 'none';
              e.currentTarget.style.transform  = 'translateY(0)';
            }}
          >
            <span>اكتشف بشير</span>
            <span
              className="text-lg group-hover:-translate-x-1 transition-transform duration-300"
              style={{ display: 'inline-block', transform: 'scaleX(-1)' }}
            >←</span>
          </a>

          <a
            href="/prejoin"
            className="gsap-hero-cta group inline-flex items-center gap-2 sm:gap-3 px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base font-bold"
            style={{ border: '1px solid var(--border-mid)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color       = 'var(--accent)';
              e.currentTarget.style.background  = 'var(--accent-dim)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-mid)';
              e.currentTarget.style.color       = 'var(--text-secondary)';
              e.currentTarget.style.background  = 'transparent';
            }}
          >
            <span>ساهم في بنائه</span>
            <span
              className="text-sm group-hover:-translate-x-1 transition-transform duration-300"
              style={{ display: 'inline-block', transform: 'scaleX(-1)', opacity: 0.7 }}
            >←</span>
          </a>
        </div>

        {/* Stats row */}
        <div
          className="flex flex-wrap gap-7 sm:gap-12 pt-6 sm:pt-8"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {[
            { value: '١٢',   label: 'مادة في متناولك' },
            { value: '٠',    label: 'اتصال مطلوب'     },
            { value: '١٠٠٪', label: 'مجاني — للأبد'   },
          ].map((s, i) => (
            <div key={i} className="gsap-hero-stat">
              <div
                className="text-xl sm:text-2xl font-bold font-mono stat-number"
                style={{ color: 'var(--accent)' }}
              >{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="gsap-hero-scroll absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: 'var(--text-muted)' }}
      >
        <span className="text-xs tracking-widest uppercase hidden sm:block font-mono">scroll</span>
        <div
          className="w-px h-12 sm:h-16 animate-pulse"
          style={{ background: 'linear-gradient(to bottom, var(--text-muted), transparent)' }}
        />
      </div>
    </section>
  );
}