'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Orbs — continuous drift ───────────────────────────────────────────
      gsap.to('.gsap-orb-1', {
        x: 40, y: -30, duration: 9,
        ease: 'sine.inOut', yoyo: true, repeat: -1,
      });
      gsap.to('.gsap-orb-2', {
        x: -30, y: 40, duration: 12,
        ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3,
      });
      gsap.to('.gsap-orb-3', {
        x: 25, y: 20, duration: 7,
        ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5,
      });

      // ── Entrance timeline ─────────────────────────────────────────────────
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

      // ── Watermark parallax on scroll ──────────────────────────────────────
      gsap.fromTo('.gsap-watermark',
        { y: 0, opacity: 0.03 },
        {
          y: 130, opacity: 0,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        }
      );

      // ── Hero content gentle parallax ──────────────────────────────────────
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

      {/* Arabic calligraphy watermark */}
      <div
        className="gsap-watermark absolute left-0 top-1/2 -translate-y-1/2 select-none pointer-events-none"
        style={{ opacity: 0.03 }}
      >
        <span
          className="text-[24vw] font-arabic font-bold leading-none"
          style={{ color: 'var(--text-primary)' }}
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
            border: '1px solid var(--border-mid)',
            background: 'var(--bg-card)',
            color: 'var(--text-muted)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
          قيد البناء — نبحث عن مساهمين
        </div>

        {/* Eyebrow line */}
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
            بشير
          </h1>
          <div className="gsap-hero-line ember-line w-24 sm:w-36 my-4 sm:my-5" />
          <h2
            className="gsap-hero-subtitle text-xl sm:text-2xl md:text-3xl font-arabic leading-relaxed max-w-2xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            من الحفظ إلى الفهم —{' '}
            <span style={{ color: 'var(--accent)' }}>لأول مرة في السودان</span>
          </h2>
        </div>

        {/* Description */}
        <p
          className="gsap-hero-desc text-base sm:text-lg max-w-lg leading-loose mb-9 sm:mb-11"
          style={{ color: 'var(--text-muted)' }}
        >
          دروس محسّنة، محتوى يومي قصير، ومحاكاة تفاعلية — كل المنهج في جيبك،
          حتى بدون إنترنت. الشهادة السودانية كما تستحق.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-10 sm:mb-12">
          <a
            href="/join"
            className="gsap-hero-cta group inline-flex items-center gap-2 sm:gap-3 px-7 sm:px-9 py-3.5 sm:py-4 font-bold rounded-xl transition-all duration-300 text-sm sm:text-base"
            style={{ background: 'var(--accent)', color: '#0e0c09' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.boxShadow = '0 0 50px var(--glow)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>انضم للنفير</span>
            <span
              className="text-lg group-hover:-translate-x-1 transition-transform duration-300"
              style={{ display: 'inline-block', transform: 'scaleX(-1)' }}
            >←</span>
          </a>
          <a
            href="#vision"
            className="gsap-hero-cta inline-flex items-center gap-2 sm:gap-3 px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base"
            style={{ border: '1px solid var(--border-mid)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-mid)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            اعرف أكثر
          </a>
        </div>

        {/* Stats row */}
        <div
          className="flex flex-wrap gap-7 sm:gap-12 pt-6 sm:pt-8"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {[
            { value: '١٢', label: 'مادة دراسية' },
            { value: '٠', label: 'إنترنت مطلوب' },
            { value: '١٠٠٪', label: 'مجاني دائماً' },
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