'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

// ─── Data ─────────────────────────────────────────────────────────────────────

const CONTENT_FEATURES = [
  {
    id: 'lessons',
    num: '٠١',
    layer: 'content',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
        <rect x="3" y="4" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 9h8M7 13h8M7 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="21" cy="21" r="5" fill="var(--accent)" opacity="0.2" stroke="var(--accent)" strokeWidth="1.2"/>
        <path d="M19 21l1.5 1.5L23 19" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'دروس محسّنة',
    subtitle: 'Enhanced Lessons',
    tagline: 'المنهج نفسه — بوضوح مختلف تماماً',
    desc: 'كل درس يُعاد تشكيله بيد مساهم متخصص في مادته — نصوص مهيكلة، صور توضيحية، ومفاهيم تتراكم فوق بعضها. ليس إعادة كتابة، بل إعادة بناء.',
    accent: 'rgba(212,137,30,0.13)',
    accentSolid: 'rgba(212,137,30,0.7)',
    border: 'rgba(212,137,30,0.25)',
  },
  {
    id: 'feed',
    num: '٠٢',
    layer: 'content',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
        <rect x="8" y="2" width="12" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="8" width="8" height="5" rx="1.5" fill="var(--accent)" opacity="0.25"/>
        <rect x="10" y="15" width="8" height="2" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="10" y="19" width="5" height="2" rx="1" fill="currentColor" opacity="0.2"/>
        <path d="M22 10l3-2M22 14l3 1" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
    title: 'تغذية المعرفة',
    subtitle: 'Knowledge Feed',
    tagline: 'تعلّم يومي لا يحتاج وقتاً إضافياً',
    desc: 'تمرير عمودي من مفاهيم صغيرة وبطاقات تذكيرية وأسئلة خاطفة — كل بطاقة تحمل فكرة واحدة كاملة. ثلاث دقائق في انتظار الباص تساوي فكرة جديدة راسخة.',
    accent: 'rgba(234,108,10,0.12)',
    accentSolid: 'rgba(234,108,10,0.7)',
    border: 'rgba(234,108,10,0.25)',
  },
  {
    id: 'quizbank',
    num: '٠٣',
    layer: 'content',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
        <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="15" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
        <rect x="3" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
        <rect x="15" y="15" width="10" height="10" rx="2" fill="var(--accent)" opacity="0.15" stroke="var(--accent)" strokeWidth="1.5"/>
        <path d="M18 20h4M18 22.5h2.5" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'بنك الأسئلة',
    subtitle: 'Question Bank',
    tagline: 'آلاف الأسئلة — من الموضوعي للتحليلي',
    desc: 'كل الامتحانات السابقة في مكان واحد، مُصنّفة حسب المادة والوحدة والصعوبة. بنك الأسئلة هو القاعدة التي يقوم عليها كل شيء آخر في بشير.',
    accent: 'rgba(168,85,247,0.11)',
    accentSolid: 'rgba(168,85,247,0.65)',
    border: 'rgba(168,85,247,0.22)',
  },
];

const INTELLIGENCE_FEATURES = [
  {
    id: 'spaced',
    num: '٠٤',
    layer: 'intelligence',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <path d="M4 20C4 20 6 8 14 8C22 8 24 20 24 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="14" r="2" fill="var(--accent)" opacity="0.7"/>
        <circle cx="14" cy="10" r="2" fill="var(--accent)" opacity="0.5"/>
        <circle cx="19" cy="14" r="2" fill="var(--accent)" opacity="0.3"/>
        <path d="M9 14v4M14 10v8M19 14v4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    title: 'التكرار المتباعد',
    subtitle: 'Spaced Repetition',
    desc: 'خوارزمية SM-2 تحرّك بطاقات التغذية — تُظهر المفهوم في اللحظة التي يكاد عقلك أن ينساه. ليس عشوائياً. يعلم متى تحتاج أن ترى الفكرة مجدداً.',
  },
  {
    id: 'weakareas',
    num: '٠٥',
    layer: 'intelligence',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
        <circle cx="14" cy="14" r="5" stroke="var(--accent)" strokeWidth="1.5"/>
        <circle cx="14" cy="14" r="2" fill="var(--accent)" opacity="0.6"/>
        <path d="M14 4v3M14 21v3M4 14h3M21 14h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3"/>
      </svg>
    ),
    title: 'كشف نقاط الضعف',
    subtitle: 'Weak Area Detection',
    desc: 'يرصد بشير أين تتعثر — أي مفاهيم تراجعت، أي وحدات تحتاج تعزيزاً — ويُحرّك محتوى يستهدف هذه الفجوات تحديداً قبل أن تتسع.',
  },
  {
    id: 'practice',
    num: '٠٦',
    layer: 'intelligence',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <path d="M5 14C5 9 9 5 14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M23 14C23 19 19 23 14 23" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 5l3-3M14 5l-3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        <path d="M14 23l3 3M14 23l-3 3" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        <circle cx="14" cy="14" r="3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    title: 'التدريب المُخصَّص',
    subtitle: 'Adaptive Practice',
    desc: 'جلسات تدريب تُبنى من بنك الأسئلة وتُوجَّه بخوارزمية الكشف — يختار بشير ما تحتاجه أنت، لا ما تختاره بالهروب منه.',
  },
  {
    id: 'streaks',
    num: '٠٧',
    layer: 'intelligence',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <path d="M14 3C14 3 8 8 8 14C8 17.3 10.7 20 14 20C17.3 20 20 17.3 20 14C20 12 19 10.5 18 9.5C18 9.5 17 13 14 13C14 13 11 11 13 7C13 7 10 9 10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 20v5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <circle cx="14" cy="14" r="2" fill="var(--accent)" opacity="0.5"/>
      </svg>
    ),
    title: 'السلاسل والشارات',
    subtitle: 'Streaks & Badges',
    desc: 'نظام يُحوّل الانضباط من إجبار إلى عادة — سلاسل يومية وشارات تُبنى بالاستمرار. الالتزام الذي يكافئ نفسه.',
  },
];

// ─── Layer Divider ─────────────────────────────────────────────────────────────

function LayerDivider() {
  return (
    <div className="features-divider relative flex items-center gap-4 my-16 sm:my-20" style={{ opacity: 0 }}>
      {/* Left line */}
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, var(--border-subtle), transparent)' }} />

      {/* Center badge */}
      <div
        className="relative flex items-center gap-3 px-5 py-2.5 rounded-full text-xs font-mono tracking-widest uppercase"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          boxShadow: '0 0 24px rgba(212,137,30,0.06)',
        }}
      >
        {/* Pulse dot */}
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-50"
            style={{ background: 'var(--accent)' }}
          />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent)' }} />
        </span>
        <span>طبقة الذكاء</span>
        <span className="opacity-40">·</span>
        <span className="opacity-50" style={{ fontFamily: 'monospace' }}>Intelligence Layer</span>
      </div>

      {/* Right line */}
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--border-subtle), transparent)' }} />
    </div>
  );
}

// ─── Content Feature Card ──────────────────────────────────────────────────────

function ContentCard({ f, index }) {
  const cardRef = useRef(null);

  const onEnter = useCallback(() => {
    gsap.to(cardRef.current, {
      y: -6,
      boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px ' + f.border,
      duration: 0.35,
      ease: 'power2.out',
    });
  }, [f.border]);

  const onLeave = useCallback(() => {
    gsap.to(cardRef.current, {
      y: 0,
      boxShadow: 'none',
      duration: 0.45,
      ease: 'power2.inOut',
    });
  }, []);

  return (
    <div
      ref={cardRef}
      className="content-card relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${f.border}`,
        opacity: 0,
        cursor: 'default',
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Accent bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${f.accent}, transparent 60%)` }}
      />

      {/* Top strip — accent color */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${f.accentSolid}, transparent 70%)` }} />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ background: f.accent, color: 'var(--text-primary)', border: `1px solid ${f.border}` }}
            >
              {f.icon}
            </div>
          </div>
          <span className="text-xs font-mono opacity-25 mt-1" style={{ color: 'var(--text-primary)' }}>
            {f.num}
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold mb-1 font-arabic" style={{ color: 'var(--text-primary)' }}>
          {f.title}
        </h3>
        <p className="text-xs font-mono mb-3 tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {f.subtitle}
        </p>

        {/* Tagline */}
        <p
          className="text-xs font-mono mb-4 pb-4 font-arabic"
          style={{ color: f.accentSolid, borderBottom: `1px solid ${f.border}` }}
        >
          {f.tagline}
        </p>

        <p className="text-sm leading-loose flex-1 font-arabic" style={{ color: 'var(--text-secondary)', lineHeight: '1.9' }}>
          {f.desc}
        </p>
      </div>
    </div>
  );
}

// ─── Intelligence Feature Row ──────────────────────────────────────────────────

function IntelligenceRow({ f, index }) {
  return (
    <div
      className="intel-card relative flex items-start gap-5 p-5 sm:p-6 rounded-xl"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        opacity: 0,
      }}
    >
      {/* Subtle left accent */}
      <div
        className="absolute top-0 right-0 h-full w-0.5 rounded-full"
        style={{ background: 'linear-gradient(to bottom, var(--accent), transparent)' }}
      />

      {/* Icon */}
      <div
        className="flex-shrink-0 p-2.5 rounded-xl mt-0.5"
        style={{
          background: 'rgba(212,137,30,0.08)',
          border: '1px solid rgba(212,137,30,0.15)',
          color: 'var(--accent)',
        }}
      >
        {f.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
          <h4 className="text-base font-bold font-arabic" style={{ color: 'var(--text-primary)' }}>
            {f.title}
          </h4>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {f.subtitle}
          </span>
        </div>
        <p className="text-sm leading-loose font-arabic" style={{ color: 'var(--text-secondary)', lineHeight: '1.85' }}>
          {f.desc}
        </p>
      </div>

      {/* Index */}
      <span className="flex-shrink-0 text-xs font-mono opacity-20 mt-1" style={{ color: 'var(--text-primary)' }}>
        {f.num}
      </span>
    </div>
  );
}

// ─── Mobile sticky scroll ──────────────────────────────────────────────────────

const ALL_FEATURES = [
  ...CONTENT_FEATURES.map(f => ({ ...f, _type: 'content' })),
  ...INTELLIGENCE_FEATURES.map(f => ({ ...f, _type: 'intel' })),
];

function FeaturesMobile() {
  const trackRef    = useRef(null);
  const cardRef     = useRef(null);
  const innerRef    = useRef(null);
  const activeRef   = useRef(0);
  const pendingRef  = useRef(null);
  const animRef     = useRef(false);
  const [active, setActive] = useState(0);

  const innerCallbackRef = useCallback((node) => {
    innerRef.current = node;
    if (!node) return;
    const children = node.querySelectorAll('.anim-child');
    gsap.fromTo(children,
      { opacity: 0, y: 18, filter: 'blur(3px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 0.45, stagger: 0.065, ease: 'power3.out',
        onComplete: () => {
          animRef.current = false;
          if (pendingRef.current !== null) {
            const next = pendingRef.current;
            pendingRef.current = null;
            transitionTo(next);
          }
        },
      }
    );
  }, []);

  function transitionTo(index) {
    if (animRef.current) { pendingRef.current = index; return; }
    if (activeRef.current === index) return;
    animRef.current = true;
    activeRef.current = index;

    const inner = innerRef.current;
    if (inner) {
      const children = inner.querySelectorAll('.anim-child');
      gsap.to(children, {
        opacity: 0, y: -14, filter: 'blur(2px)',
        duration: 0.25, stagger: { each: 0.04, from: 'end' }, ease: 'power2.in',
        onComplete: () => setActive(index),
      });
    } else {
      setActive(index);
    }

    const f = ALL_FEATURES[index];
    if (cardRef.current) {
      const borderColor = f._type === 'content' ? (f.border || 'rgba(212,137,30,0.25)') : 'rgba(212,137,30,0.2)';
      gsap.to(cardRef.current, { borderColor, duration: 0.5, ease: 'power2.inOut' });
      gsap.fromTo(cardRef.current, { scale: 1 }, { scale: 1.015, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1 });
    }
  }

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(max-width: 639px)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(cardRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: trackRef.current, start: 'top 85%', once: true } }
        );
        ALL_FEATURES.forEach((_, i) => {
          ScrollTrigger.create({
            trigger: trackRef.current,
            start: () => `top+=${i * (window.innerHeight * 0.78)} top`,
            end:   () => `top+=${(i + 1) * (window.innerHeight * 0.78)} top`,
            onEnter: () => transitionTo(i),
            onEnterBack: () => transitionTo(i),
          });
        });
      }, trackRef);
      return () => ctx.revert();
    });
    return () => mm.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const f = ALL_FEATURES[active];
  const isIntel = f._type === 'intel';

  return (
    <div ref={trackRef} className="relative sm:hidden" style={{ height: `${ALL_FEATURES.length * 78}vh` }}>
      <div className="sticky top-0 h-screen flex flex-col justify-center px-4 pointer-events-none">
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden pointer-events-auto"
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${f.border || 'rgba(212,137,30,0.25)'}`,
            opacity: 0,
            minHeight: '370px',
            transition: 'background 0.5s ease',
          }}
        >
          {/* Top accent strip */}
          <div
            className="h-0.5 w-full"
            style={{ background: isIntel
              ? 'linear-gradient(to right, rgba(212,137,30,0.6), transparent)'
              : `linear-gradient(to right, ${f.accentSolid || 'rgba(212,137,30,0.6)'}, transparent 70%)` }}
          />

          {/* Accent bg glow */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-500"
            style={{ background: `radial-gradient(ellipse at top left, ${f.accent || 'rgba(212,137,30,0.1)'}, transparent 65%)` }}
          />

          {/* Counter pills */}
          <div className="absolute top-4 left-4 flex gap-1.5 z-10">
            {ALL_FEATURES.map((feat, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '18px' : '5px',
                  height: '5px',
                  background: i === active ? 'var(--accent)' : 'var(--border-subtle)',
                }}
              />
            ))}
          </div>

          <div
            key={active}
            ref={innerCallbackRef}
            className="relative z-10 flex flex-col p-6 pt-10"
            style={{ minHeight: '370px' }}
          >
            {/* Layer label */}
            <div className="anim-child mb-4">
              <span
                className="text-xs font-mono tracking-widest uppercase px-2.5 py-1 rounded-full"
                style={{
                  background: isIntel ? 'rgba(212,137,30,0.1)' : (f.accent || 'rgba(212,137,30,0.1)'),
                  color: isIntel ? 'var(--accent)' : (f.accentSolid || 'var(--accent)'),
                  border: `1px solid ${isIntel ? 'rgba(212,137,30,0.2)' : (f.border || 'rgba(212,137,30,0.2)')}`,
                }}
              >
                {isIntel ? 'طبقة الذكاء' : 'طبقة المحتوى'}
              </span>
            </div>

            {/* Icon + num */}
            <div className="anim-child flex items-center gap-3 mb-4">
              <div
                className="p-2.5 rounded-xl"
                style={{
                  background: f.accent || 'rgba(212,137,30,0.1)',
                  border: `1px solid ${f.border || 'rgba(212,137,30,0.2)'}`,
                  color: isIntel ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                {f.icon}
              </div>
            </div>

            <h3 className="anim-child text-xl font-bold mb-1 font-arabic" style={{ color: 'var(--text-primary)' }}>
              {f.title}
            </h3>
            <p className="anim-child text-xs font-mono mb-4 tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {f.subtitle}
            </p>

            {f.tagline && (
              <p className="anim-child text-xs font-mono mb-4 pb-4 font-arabic"
                style={{ color: f.accentSolid || 'var(--accent)', borderBottom: `1px solid ${f.border || 'rgba(212,137,30,0.15)'}` }}>
                {f.tagline}
              </p>
            )}

            <p className="anim-child text-sm leading-loose flex-1 font-arabic" style={{ color: 'var(--text-secondary)', lineHeight: '1.9' }}>
              {f.desc}
            </p>
          </div>
        </div>

        {active === 0 && (
          <p className="text-center text-xs font-mono mt-4 opacity-35 animate-pulse" style={{ color: 'var(--text-muted)' }}>
            مرّر للأسفل
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Desktop layout ────────────────────────────────────────────────────────────

function FeaturesDesktop() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 640px)', () => {
      const ctx = gsap.context(() => {

        // Content cards stagger
        gsap.fromTo('.content-card',
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.8, stagger: 0.12, ease: 'power3.out',
            scrollTrigger: { trigger: '.content-cards-grid', start: 'top 85%', once: true },
          }
        );

        // Divider fade in
        gsap.fromTo('.features-divider',
          { opacity: 0, y: 20 },
          {
            opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: '.features-divider', start: 'top 90%', once: true },
          }
        );

        // Intelligence rows stagger
        gsap.fromTo('.intel-card',
          { opacity: 0, x: 30 },
          {
            opacity: 1, x: 0,
            duration: 0.65, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: '.intel-grid', start: 'top 88%', once: true },
          }
        );

      }, wrapRef);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={wrapRef} className="hidden sm:block">
      {/* Content layer grid */}
      <div className="content-cards-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {CONTENT_FEATURES.map((f, i) => (
          <ContentCard key={f.id} f={f} index={i} />
        ))}
      </div>

      {/* Divider */}
      <LayerDivider />

      {/* Intelligence layer grid — 2-col on sm, 2-col on lg */}
      <div className="intel-grid grid sm:grid-cols-2 gap-4">
        {INTELLIGENCE_FEATURES.map((f, i) => (
          <IntelligenceRow key={f.id} f={f} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
      });
      tl.fromTo('.feat-eyebrow',  { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
        .fromTo('.feat-headline', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
        .fromTo('.feat-line',     { scaleX: 0 },         { scaleX: 1, duration: 0.7, ease: 'expo.out', transformOrigin: 'right center' }, '-=0.4')
        .fromTo('.feat-sub',      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.35')
        // Layer labels
        .fromTo('.feat-layer-label', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'power3.out' }, '-=0.2');
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="mb-14 sm:mb-20" style={{ opacity: 1 }}>
      <p className="feat-eyebrow text-xs sm:text-sm font-mono tracking-widest uppercase mb-5" style={{ color: 'var(--accent)', opacity: 0 }}>
        داخل التطبيق
      </p>

      <h2
        className="feat-headline text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-4 leading-tight"
        style={{ color: 'var(--text-primary)', opacity: 0, lineHeight: '1.3' }}
      >
        محتوى يُبنى بعناية.
        <br />
        <span style={{ color: 'var(--accent)' }}>ذكاء يُحرّكه بهدف.</span>
      </h2>

      <div className="feat-line ember-line w-20 sm:w-28 mb-5" style={{ transformOrigin: 'right center' }} />

      <p
        className="feat-sub text-base sm:text-lg leading-loose max-w-2xl font-arabic mb-8"
        style={{ color: 'var(--text-secondary)', opacity: 0, lineHeight: '1.9' }}
      >
        بشير ليس مجرد مكتبة دروس — هو نظام تعلّم. طبقة المحتوى تُقدّم المعرفة،
        وطبقة الذكاء تضمن أنها تبقى وتُبنى عليها.
      </p>

      {/* Layer labels */}
      <div className="flex flex-wrap gap-3">
        <div
          className="feat-layer-label flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-mono tracking-wide"
          style={{
            background: 'rgba(212,137,30,0.08)',
            border: '1px solid rgba(212,137,30,0.2)',
            color: 'var(--text-secondary)',
            opacity: 0,
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)', opacity: 0.8 }} />
          <span>طبقة المحتوى</span>
          <span className="opacity-40">·</span>
          <span className="opacity-50">Content Layer</span>
        </div>
        <div
          className="feat-layer-label flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-mono tracking-wide"
          style={{
            background: 'rgba(212,137,30,0.04)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            opacity: 0,
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-40" style={{ background: 'var(--accent)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent)', opacity: 0.6 }} />
          </span>
          <span>طبقة الذكاء</span>
          <span className="opacity-40">·</span>
          <span className="opacity-50">Intelligence Layer</span>
        </div>
      </div>
    </div>
  );
}

// ─── Root export ───────────────────────────────────────────────────────────────

export default function Features() {
  const sectionRef = useRef(null);

  return (
    <section id="features" ref={sectionRef} className="py-24 sm:py-36 px-4 sm:px-6 relative">
      <div className="ember-line max-w-6xl mx-auto mb-20 opacity-40" />

      <div className="max-w-6xl mx-auto">
        <SectionHeader />
        <FeaturesMobile />
        <FeaturesDesktop />
      </div>
    </section>
  );
}