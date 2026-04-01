'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

const features = [
  {
    num: '٠١', icon: '📖', title: 'دروس محسّنة', subtitle: 'Enhanced Lessons',
    desc: 'المنهج نفسه، عُرض بشكل مختلف تماماً — نصوص مُهيكلة، صور توضيحية، ومفاهيم مرقّمة تُبنى فوق بعضها. كل درس يُصنع بعناية من مساهم متخصص في المادة.',
    insight: 'الفهم لا يأتي من القراءة — يأتي من الوضوح',
    accent: 'rgba(212,137,30,0.14)', border: 'rgba(212,137,30,0.22)',
  },
  {
    num: '٠٢', icon: '📱', title: 'تغذية المعرفة', subtitle: 'Knowledge Feed',
    desc: 'محتوى يومي قصير في شكل تمرير عمودي — مفاهيم صغيرة، بطاقات تذكيرية، وأسئلة سريعة. معرفة تتراكم بدون أن تشعر.',
    insight: '٣ دقائق يومياً تبني ما لا يبنيه يوم مذاكرة',
    accent: 'rgba(234,108,10,0.11)', border: 'rgba(234,108,10,0.22)',
  },
  {
    num: '٠٣', icon: '🔬', title: 'المختبر التفاعلي', subtitle: 'Interactive Lab',
    desc: 'محاكاة مرئية للمعادلات والأشكال الثلاثية الأبعاد — غيّر المتغير وشاهد النتيجة مباشرة.',
    insight: 'شاهد — ثم تذكر. ليس العكس',
    accent: 'rgba(59,130,246,0.11)', border: 'rgba(59,130,246,0.22)',
  },
  {
    num: '٠٤', icon: '📝', title: 'بنك الأسئلة', subtitle: 'Question Bank',
    desc: 'آلاف الأسئلة مرتّبة حسب المادة، الوحدة، ومستوى الصعوبة — من الأسئلة الموضوعية إلى التحليلية. كل الامتحانات السابقة في مكان واحد.',
    insight: 'تدرّب على ما سيسألك الامتحان فعلاً',
    accent: 'rgba(168,85,247,0.11)', border: 'rgba(168,85,247,0.22)',
  },
  {
    num: '٠٥', icon: '🏆', title: 'التقدم والإنجازات', subtitle: 'Progress & Streaks',
    desc: 'نظام نقاط، سلاسل يومية، وشارات تحفيزية تجعل الالتزام بالمنهج أمراً ممتعاً.',
    insight: 'الانضباط لا يُجبر — يُبنى بالعادة',
    accent: 'rgba(34,197,94,0.11)', border: 'rgba(34,197,94,0.22)',
  },
  {
    num: '٠٦', icon: '📴', title: 'يعمل بدون إنترنت', subtitle: 'Offline First',
    desc: 'كل المحتوى متاح بعد التحميل الأول — لا اتصال، لا توقف، لا اعتذارات. مُصمَّم للواقع السوداني، ليس لمثاليته.',
    insight: 'انقطاع الكهرباء لا يوقف الطموح',
    accent: 'rgba(20,184,166,0.11)', border: 'rgba(20,184,166,0.22)',
  },
];

// ─── Mobile sticky-scroll variant ────────────────────────────────────────────

function FeaturesStickyMobile() {
  const trackRef    = useRef(null);
  const cardRef     = useRef(null);
  const innerRef    = useRef(null);
  const dotsRef     = useRef(null);
  const activeRef   = useRef(0);           // mutable, no re-render
  const pendingRef  = useRef(null);        // index queued while animating out
  const animatingRef = useRef(false);
  const [active, setActive] = useState(0);

  // Called after React re-renders with new content — animate IN
  const innerCallbackRef = useCallback((node) => {
    innerRef.current = node;
    if (!node) return;
    // Animate each child element with a stagger for liveliness
    const children = node.querySelectorAll('.anim-child');
    gsap.fromTo(children,
      { opacity: 0, y: 22, filter: 'blur(4px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 0.5,
        stagger: 0.07,
        ease: 'power3.out',
        onComplete: () => {
          animatingRef.current = false;
          // If a transition was queued while we were animating, run it now
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
    // Debounce: if mid-animation, queue and bail
    if (animatingRef.current) {
      pendingRef.current = index;
      return;
    }
    if (activeRef.current === index) return;

    animatingRef.current = true;
    activeRef.current = index;
    const f = features[index];

    // 1. Animate current content OUT with stagger (reversed)
    const inner = innerRef.current;
    if (inner) {
      const children = inner.querySelectorAll('.anim-child');
      gsap.to(children, {
        opacity: 0,
        y: -16,
        filter: 'blur(3px)',
        duration: 0.28,
        stagger: { each: 0.04, from: 'end' },
        ease: 'power2.in',
        onComplete: () => {
          // 2. Update React state — triggers re-render → innerCallbackRef fires → animate IN
          setActive(index);
        },
      });
    } else {
      setActive(index);
    }

    // 3. Transition card border color and accent bg simultaneously
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        borderColor: f.border,
        duration: 0.55,
        ease: 'power2.inOut',
      });
      // Pulse the card slightly — a heartbeat on each swap
      gsap.fromTo(cardRef.current,
        { scale: 1 },
        { scale: 1.018, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }
      );
    }

    // 4. Animate dots
    const dots = dotsRef.current?.querySelectorAll('.feat-dot');
    dots?.forEach((d, di) => {
      if (di === index) {
        gsap.fromTo(d,
          { scale: 1 },
          { scale: 1.6, backgroundColor: 'var(--accent)', duration: 0.25, ease: 'back.out(2)',
            onComplete: () => gsap.to(d, { scale: 1.35, duration: 0.15 }) }
        );
      } else {
        gsap.to(d, { backgroundColor: 'var(--border-subtle)', scale: 1, duration: 0.25 });
      }
    });
  }

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(max-width: 639px)', () => {
      const ctx = gsap.context(() => {

        // Card entrance
        gsap.fromTo(cardRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: trackRef.current, start: 'top 85%', once: true },
          }
        );

        // ScrollTrigger per feature segment
        features.forEach((_, i) => {
          ScrollTrigger.create({
            trigger: trackRef.current,
            start: () => `top+=${i * (window.innerHeight * 0.8)} top`,
            end:   () => `top+=${(i + 1) * (window.innerHeight * 0.8)} top`,
            onEnter:     () => transitionTo(i),
            onEnterBack: () => transitionTo(i),
          });
        });

      }, trackRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const f = features[active];

  return (
    <div ref={trackRef} className="relative sm:hidden" style={{ height: `${features.length * 80}vh` }}>

      <div className="sticky top-0 h-screen flex flex-col justify-center px-4 pointer-events-none">
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden pointer-events-auto"
          style={{
            background:     'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            border:         `1px solid ${features[0].border}`,
            opacity:        0,
            minHeight:      '360px',
            // Smooth the accent bg via CSS transition — GSAP handles border/transform
            transition:     'background 0.55s ease',
          }}
        >
          {/* Radial accent bg — CSS-transitioned */}
          <div
            className="absolute inset-0 pointer-events-none opacity-80"
            style={{
              background: `radial-gradient(ellipse at top right, ${f.accent}, transparent 65%)`,
              transition: 'background 0.55s ease',
            }}
          />

          {/* Content — key forces remount → innerCallbackRef fires on every feature change */}
          <div
            key={active}
            ref={innerCallbackRef}
            className="relative z-10 flex flex-col p-6"
            style={{ minHeight: '360px' }}
          >
            {/* Row 1: num + icon + dots */}
            <div className="anim-child flex items-start justify-between mb-5">
              <div>
                <div className="text-xs font-mono mb-2 opacity-35" style={{ color: 'var(--text-primary)' }}>
                  {f.num}
                </div>
                <span className="text-4xl" style={{ display: 'block', lineHeight: 1 }}>{f.icon}</span>
              </div>
              {/* Progress dots */}
              <div ref={dotsRef} className="flex flex-col gap-1.5 mt-1">
                {features.map((_, di) => (
                  <div
                    key={di}
                    className="feat-dot rounded-full"
                    style={{
                      width: '6px', height: '6px',
                      backgroundColor: di === 0 ? 'var(--accent)' : 'var(--border-subtle)',
                    }}
                  />
                ))}
              </div>
            </div>

            <h3 className="anim-child text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {f.title}
            </h3>
            <p className="anim-child text-xs font-mono mb-4 tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {f.subtitle}
            </p>
            <p className="anim-child text-sm leading-loose flex-1 mb-6 font-arabic" style={{ color: 'var(--text-secondary)' }}>
              {f.desc}
            </p>

            <div className="anim-child mt-auto pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>↓ {f.insight}</span>
            </div>
          </div>
        </div>

        {active === 0 && (
          <p className="text-center text-xs font-mono mt-4 opacity-40 animate-pulse" style={{ color: 'var(--text-muted)' }}>
            مرّر للأسفل
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Desktop grid variant (unchanged) ────────────────────────────────────────

function FeaturesGrid() {
  const gridRef = useRef(null);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 640px)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.feature-card',
          { opacity: 0, y: 55, scale: 0.93 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.75,
            stagger: { each: 0.1, from: 'start' },
            ease: 'power3.out',
            scrollTrigger: { trigger: '.features-grid', start: 'top 87%', once: true },
          }
        );
      }, gridRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={gridRef} className="hidden sm:block">
      <div className="features-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
        {features.map((f, i) => (
          <div
            key={i}
            className="feature-card relative p-6 sm:p-8 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col"
            style={{
              background:     'var(--bg-card)',
              backdropFilter: 'blur(12px)',
              border:         `1px solid ${f.border}`,
              opacity:        0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
              e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-80"
              style={{ background: `radial-gradient(ellipse at top right, ${f.accent}, transparent 65%)` }} />

            <div className="relative z-10 flex flex-col flex-1">
              <div className="text-xs font-mono mb-4 opacity-35" style={{ color: 'var(--text-primary)' }}>{f.num}</div>
              <div className="flex items-start justify-between mb-5">
                <span className="text-3xl sm:text-4xl">{f.icon}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-xs font-mono mb-4 tracking-wide" style={{ color: 'var(--text-muted)' }}>{f.subtitle}</p>
              <p className="text-sm leading-loose flex-1 mb-6 font-arabic" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>↓ {f.insight}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section shell ────────────────────────────────────────────────────────────

export default function Features() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.features-header',
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '.features-header', start: 'top 90%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-24 sm:py-36 px-4 sm:px-6 relative">
      <div className="ember-line max-w-6xl mx-auto mb-20 opacity-40" />

      <div className="max-w-6xl mx-auto">

        <div className="features-header mb-14 sm:mb-20" style={{ opacity: 0 }}>
          <p className="text-xs sm:text-sm font-mono tracking-widest uppercase mb-4" style={{ color: 'var(--accent)' }}>
            داخل التطبيق
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            ست أدوات. منهج واحد. فهم حقيقي.
          </h2>
          <div className="ember-line w-20 sm:w-28 mb-5" />
          <p className="text-base sm:text-lg leading-loose max-w-xl font-arabic" style={{ color: 'var(--text-secondary)' }}>
            ليس تطبيقاً تعليمياً عاماً — بشير مصنوع للمنهج السوداني، خطوة خطوة.
          </p>
        </div>

        <FeaturesStickyMobile />
        <FeaturesGrid />

      </div>
    </section>
  );
}