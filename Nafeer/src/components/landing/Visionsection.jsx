'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

const contrasts = [
  { before: 'يحفظ ليجيب',      after: 'يفهم ليبني' },
  { before: 'المعلومة تُلقى',  after: 'المفهوم يُعاش' },
  { before: 'ينتهي بالامتحان', after: 'يبقى لما بعده' },
];

const phrases = [
  {
    word:     'لماذا',
    subject:  'تتحد الذرات وتنكسر روابطها',
    contrast: 'لا فقط يحفظ المعادلة ويمشي.',
  },
  {
    word:     'كيف',
    subject:  'شكّلت طرق التجارة حضارات بأكملها',
    contrast: 'لا فقط يحفظ أسماء المحيطات.',
  },
  {
    word:     'متى',
    subject:  'تتوزع الأحمال وتصل المنشآت لحدودها',
    contrast: 'لا فقط يحفظ قوانين الإجهاد.',
  },
];

export default function VisionSection() {
  const sectionRef  = useRef(null);
  const cycleRef    = useRef(null);
  const wordRef     = useRef(null);
  const subjectRef  = useRef(null);
  const contrastRef = useRef(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  // Desktop: rotateX card-flip. Mobile: clean fade-slide (no blur+3d combo)
  const flipWord = (el, newText, isMobile, onDone) => {
    if (!el) return;
    if (isMobile) {
      gsap.fromTo(el,
        { opacity: 1, y: 0 },
        {
          opacity: 0, y: -10,
          duration: 0.2, ease: 'power2.in',
          onComplete: () => {
            el.textContent = newText;
            gsap.fromTo(el,
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.28, ease: 'power3.out', onComplete: onDone }
            );
          },
        }
      );
    } else {
      gsap.fromTo(el,
        { rotateX: 0, opacity: 1 },
        {
          rotateX: -90, opacity: 0,
          duration: 0.22, ease: 'power2.in',
          onComplete: () => {
            el.textContent = newText;
            gsap.fromTo(el,
              { rotateX: 90, opacity: 0 },
              { rotateX: 0, opacity: 1, duration: 0.28, ease: 'back.out(1.4)', onComplete: onDone }
            );
          },
        }
      );
    }
  };

  const swapLine = (el, newText, delay = 0) => {
    if (!el) return;
    gsap.fromTo(el,
      { y: 0, opacity: 1, filter: 'blur(0px)' },
      {
        y: -12, opacity: 0, filter: 'blur(2px)',
        duration: 0.25, ease: 'power2.in', delay,
        onComplete: () => {
          el.textContent = newText;
          gsap.fromTo(el,
            { y: 12, opacity: 0, filter: 'blur(2px)' },
            { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }
          );
        },
      }
    );
  };

  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── Scroll-in ───────────────────────────────────────────────
      gsap.fromTo('.vision-statement',
        { opacity: 0, y: 48 },
        {
          opacity: 1, y: 0, duration: 1.05, ease: 'power3.out',
          scrollTrigger: { trigger: '.vision-statement', start: 'top 88%', once: true },
        }
      );

      gsap.fromTo('.vision-line',
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.18, ease: 'power3.out',
          scrollTrigger: { trigger: '.vision-lines', start: 'top 88%', once: true },
        }
      );

      gsap.fromTo('.vision-divider',
        { scaleX: 0, transformOrigin: 'right center' },
        {
          scaleX: 1, duration: 0.7, ease: 'expo.out',
          scrollTrigger: { trigger: '.vision-divider', start: 'top 92%', once: true },
        }
      );

      gsap.fromTo('.vision-contrast',
        { opacity: 0, x: 20 },
        {
          opacity: 1, x: 0, duration: 0.65, stagger: 0.14, ease: 'power3.out',
          scrollTrigger: { trigger: '.vision-contrasts', start: 'top 90%', once: true },
        }
      );

      // ── Cycle ───────────────────────────────────────────────────
      const startCycle = () => {
        const isMobile = window.innerWidth < 640;

        const tick = () => {
          const next = (indexRef.current + 1) % phrases.length;
          indexRef.current = next;
          setIndex(next);

          flipWord(wordRef.current, phrases[next].word, isMobile, () => {
            swapLine(subjectRef.current,  phrases[next].subject,  0);
            swapLine(contrastRef.current, phrases[next].contrast, 0.08);
          });
        };

        cycleRef.current = setInterval(tick, 3400);

        // Pause cycle when tab is hidden, resume cleanly
        const onVisibility = () => {
          if (document.hidden) {
            clearInterval(cycleRef.current);
          } else {
            // Small delay so the browser has painted before we animate
            setTimeout(() => { cycleRef.current = setInterval(tick, 3400); }, 300);
          }
        };
        document.addEventListener('visibilitychange', onVisibility);
        // Store cleanup on ref so we can remove it
        cycleRef._visCleanup = () => document.removeEventListener('visibilitychange', onVisibility);
      };

      ScrollTrigger.create({
        trigger: '.vision-lines',
        start: 'top 88%',
        once: true,
        onEnter: () => setTimeout(startCycle, 1800),
      });

    }, sectionRef);

    return () => {
      ctx.revert();
      clearInterval(cycleRef.current);
      if (cycleRef._visCleanup) cycleRef._visCleanup();
    };
  }, []);

  return (
    <section ref={sectionRef} id="vision" className="py-16 sm:py-28 px-4 sm:px-6 relative">
      <div className="ember-line max-w-6xl mx-auto mb-16 sm:mb-24 opacity-40" />

      <div className="max-w-4xl mx-auto">

        {/* ── Vision statement ─────────────────────────────────────── */}
        <div className="vision-statement mb-16 sm:mb-24" style={{ opacity: 0 }}>
          <span
            className="inline-block text-md sm:text-sm font-mono font-bold tracking-widest uppercase mb-5"
            style={{ color: 'var(--accent)' }}
          >
            الإمكانية الحقيقية
          </span>

          {/*
            perspective on a tight wrapper — only the word el needs 3D context,
            not the whole block, which avoids clipping issues on the other lines
          */}
          <div
            className="vision-lines font-arabic font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {/* Fixed line */}
            <p
              className="vision-line text-2xl sm:text-3xl md:text-4xl leading-relaxed"
              style={{ opacity: 0 }}
            >
              تخيّل طالباً يفهم
            </p>

            {/*
              Animated line — on mobile the word and subject are stacked so
              the subject wraps freely without any overflow:hidden clipping it.
              On sm+ they sit inline as before.
            */}
            <p
              className="vision-line text-2xl sm:text-3xl md:text-4xl leading-relaxed"
              style={{ opacity: 0 }}
            >
              {/* Word: perspective wrapper only here */}
              <span style={{ display: 'inline-block', perspective: 500 }}>
                <em
                  ref={wordRef}
                  className="not-italic"
                  style={{ color: 'var(--accent)', display: 'inline-block' }}
                >
                  {phrases[0].word}
                </em>
              </span>
              {/* Non-breaking space keeps word+subject on same visual flow */}
              {'\u00a0'}
              {/* Subject — no overflow:hidden so wrapped lines aren't clipped */}
              <span
                ref={subjectRef}
                style={{ display: 'inline' }}
              >
                {phrases[0].subject}
              </span>
            </p>

            {/* Contrast line — lighter weight, no clip needed */}
            <p
              className="vision-line text-lg sm:text-2xl md:text-3xl leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontWeight: 400, opacity: 0 }}
            >
              <span ref={contrastRef} style={{ display: 'inline-block' }}>
                {phrases[0].contrast}
              </span>
            </p>
          </div>

          {/* Progress pills — centred on mobile, right on desktop */}
          <div className="flex gap-2 mt-6 justify-center sm:justify-end">
            {phrases.map((p, i) => (
              <span
                key={i}
                title={p.word}
                style={{
                  width: i === index ? 24 : 6,
                  height: 3,
                  borderRadius: 2,
                  background: i === index ? 'var(--accent)' : 'var(--border-subtle)',
                  transition: 'width 0.45s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease',
                  display: 'inline-block',
                }}
              />
            ))}
          </div>

          <p
            className="mt-8 text-base sm:text-lg leading-loose font-arabic max-w-2xl"
            style={{ color: 'var(--text-muted)' }}
          >
            طالب يسأل لأنه فضولي، لا لأن الامتحان يقترب.
            يرجع للمادة لأنها منطقية، لا لأنه نسي.
            هذا ما نبنيه.
          </p>
        </div>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <div
          className="vision-divider mb-12 sm:mb-16 w-16"
          style={{ height: '1px', background: 'var(--border-mid)', transform: 'scaleX(0)' }}
        />

        {/* ── Contrasts ────────────────────────────────────────────── */}
        <div className="vision-contrasts space-y-4 sm:space-y-5">
          {contrasts.map((c, i) => (
            <div
              key={i}
              className="vision-contrast flex items-center gap-3 sm:gap-8 flex-wrap"
              style={{ opacity: 0 }}
            >
              {/* Before — strikethrough */}
              <span
                className="relative text-sm sm:text-base font-arabic"
                style={{ color: 'var(--text-muted)', opacity: 0.6 }}
              >
                {c.before}
                <span
                  className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
                  style={{ height: '1px', background: 'var(--text-muted)', opacity: 0.45 }}
                />
              </span>

              {/* Arrow — shorter on mobile so it doesn't eat space */}
              <span
                className="font-mono text-xs shrink-0 hidden xs:inline-block sm:inline-block"
                style={{ color: 'var(--accent)', opacity: 0.35, transform: 'scaleX(-1)', display: 'inline-block', letterSpacing: '-1px' }}
              >
                ──→
              </span>

              {/* After */}
              <span
                className="text-sm sm:text-base font-arabic font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {c.after}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}