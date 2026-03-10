'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Floating orbs — continuous drift
      gsap.to('.gsap-orb-1', {
        x: 30, y: -20, duration: 8,
        ease: 'sine.inOut', yoyo: true, repeat: -1,
      });
      gsap.to('.gsap-orb-2', {
        x: -20, y: 25, duration: 10,
        ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2,
      });

      // Hero entrance — staggered timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.gsap-hero-badge',    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 })
        .fromTo('.gsap-hero-title',    { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.3')
        .fromTo('.gsap-hero-line',     { scaleX: 0 },         { scaleX: 1, transformOrigin: 'right center', duration: 0.6 }, '-=0.4')
        .fromTo('.gsap-hero-subtitle', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.3')
        .fromTo('.gsap-hero-desc',     { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
        .fromTo('.gsap-hero-cta',      { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 }, '-=0.3')
        .fromTo('.gsap-hero-scroll',   { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.1');

      // Watermark parallax on scroll
      gsap.to('.gsap-watermark', {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
        y: 80,
        opacity: 0,
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

      {/* Arabic calligraphy watermark */}
      <div className="gsap-watermark absolute left-0 top-1/2 -translate-y-1/2 select-none pointer-events-none" style={{ opacity: 0.03 }}>
        <span className="text-[22vw] font-arabic font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
          بشير
        </span>
      </div>

      {/* Floating orbs */}
      <div
        className="gsap-orb-1 absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--mesh-1) 0%, transparent 70%)' }}
      />
      <div
        className="gsap-orb-2 absolute bottom-1/3 right-1/4 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--mesh-2) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        {/* Badge */}
        <div
          className="gsap-hero-badge mb-6 sm:mb-8 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm"
          style={{ border: '1px solid var(--border-mid)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
          قيد الإنشاء — نبحث عن مساهمين
        </div>

        {/* Headline */}
        <div className="mb-5 sm:mb-6">
          <h1 className="gsap-hero-title text-5xl sm:text-6xl md:text-8xl font-arabic font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            بشير
          </h1>
          <div className="gsap-hero-line ember-line w-24 sm:w-32 my-3 sm:my-4" />
          <h2 className="gsap-hero-subtitle text-xl sm:text-2xl md:text-3xl font-arabic leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            تجربة تعليمية جديدة للطالب السوداني —{' '}
            <span style={{ color: 'var(--accent)' }}>قبل القبول الجامعي</span>
          </h2>
        </div>

        {/* Description */}
        <p className="gsap-hero-desc text-base sm:text-lg max-w-xl leading-loose mb-10 sm:mb-12" style={{ color: 'var(--text-muted)' }}>
          تطبيق يحوّل المنهج الدراسي إلى تجربة تفاعلية، بدروس محسّنة، ومحتوى يومي قصير،
          ومحاكاة مرئية، وبنك ضخم من الأسئلة.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <a
            href="/join"
            className="gsap-hero-cta group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 font-bold rounded-xl transition-all duration-300 text-sm sm:text-base"
            style={{ background: 'var(--accent)', color: '#0e0c09' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.boxShadow = '0 0 40px var(--glow)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>انضم للنفير</span>
            <span className="text-xl group-hover:-translate-x-1 transition-transform duration-300" style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>←</span>
          </a>
          <a
            href="#vision"
            className="gsap-hero-cta inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base"
            style={{ border: '1px solid var(--border-mid)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            اعرف أكثر
          </a>
        </div>

        {/* Scroll hint */}
        <div className="gsap-hero-scroll absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <span className="text-xs tracking-widest uppercase hidden sm:block">scroll</span>
          <div className="w-px h-12 sm:h-16 animate-pulse" style={{ background: 'linear-gradient(to bottom, var(--text-muted), transparent)' }} />
        </div>
      </div>
    </section>
  );
}