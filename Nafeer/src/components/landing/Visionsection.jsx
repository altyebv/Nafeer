'use client';
import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useMotion, reveal } from '@/lib/gsap';
import { Eyebrow, cx } from '@/components/ui';
import { LandingSection } from './Section';

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

// Desktop: rotateX card-flip. Mobile: a plain fade-slide.
function flipWord(el, newText, isMobile, onDone) {
  if (!el) return;
  const out = isMobile ? { opacity: 0, y: -10 } : { rotateX: -90, opacity: 0 };
  const from = isMobile ? { opacity: 0, y: 10 } : { rotateX: 90, opacity: 0 };
  const to = isMobile ? { opacity: 1, y: 0, ease: 'power3.out' } : { rotateX: 0, opacity: 1, ease: 'back.out(1.4)' };
  gsap.to(el, {
    ...out, duration: 0.22, ease: 'power2.in',
    onComplete: () => { el.textContent = newText; gsap.fromTo(el, from, { ...to, duration: 0.28, onComplete: onDone }); },
  });
}

function swapLine(el, newText, delay = 0) {
  if (!el) return;
  gsap.to(el, {
    y: -12, opacity: 0, filter: 'blur(2px)', duration: 0.25, ease: 'power2.in', delay,
    onComplete: () => {
      el.textContent = newText;
      gsap.fromTo(el, { y: 12, opacity: 0, filter: 'blur(2px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' });
    },
  });
}

export default function VisionSection() {
  const sectionRef  = useRef(null);
  const wordRef     = useRef(null);
  const subjectRef  = useRef(null);
  const contrastRef = useRef(null);
  const [index, setIndex] = useState(0);

  // The phrase cycle is motion too: under reduced motion the first phrase
  // simply stays, which still reads as a complete sentence.
  useMotion(sectionRef, () => {
    reveal('.vision-statement', { y: 48, duration: 1.05 });
    reveal('.vision-line', { trigger: '.vision-lines', y: 20, stagger: 0.18 });
    gsap.from('.vision-divider', {
      scaleX: 0, transformOrigin: 'right center', duration: 0.7, ease: 'expo.out',
      scrollTrigger: { trigger: '.vision-divider', start: 'top 92%', once: true },
    });
    reveal('.vision-contrast', { trigger: '.vision-contrasts', y: 0, x: 20, stagger: 0.14, duration: 0.65 });

    let timer = null;
    let current = 0;
    const tick = () => {
      if (document.hidden) return; // paused while the tab is in the background
      current = (current + 1) % phrases.length;
      setIndex(current);
      flipWord(wordRef.current, phrases[current].word, window.innerWidth < 640, () => {
        swapLine(subjectRef.current, phrases[current].subject, 0);
        swapLine(contrastRef.current, phrases[current].contrast, 0.08);
      });
    };
    let delay = null;
    ScrollTrigger.create({
      trigger: '.vision-lines', start: 'top 88%', once: true,
      onEnter: () => { delay = setTimeout(() => { timer = setInterval(tick, 3400); }, 1800); },
    });
    return () => { clearTimeout(delay); clearInterval(timer); };
  });

  return (
    <LandingSection ref={sectionRef} id="vision" width="content"
      decoration={<div aria-hidden="true" className="ember-line absolute top-0 inset-x-0 max-w-7xl mx-auto opacity-40" />}>

      {/* ── Vision statement ─────────────────────────────────────── */}
      <div className="vision-statement mb-16 sm:mb-24">
        <Eyebrow as="p" className="mb-5">الإمكانية الحقيقية</Eyebrow>

        <h2 className="vision-lines font-arabic font-bold text-fg-strong">
          <span className="vision-line block text-2xl sm:text-3xl md:text-4xl leading-relaxed">تخيّل طالباً يفهم</span>
          {' '}
          <span className="vision-line block text-2xl sm:text-3xl md:text-4xl leading-relaxed">
            {/* Perspective only around the word, so the flip doesn't clip the other lines. */}
            <span className="inline-block [perspective:500px]">
              <em ref={wordRef} className="not-italic inline-block text-fg-accent">{phrases[0].word}</em>
            </span>
            {' '}
            <span ref={subjectRef}>{phrases[0].subject}</span>
          </span>
          {' '}
          <span className="vision-line block text-lg sm:text-2xl md:text-3xl leading-relaxed font-normal text-fg-muted">
            <span ref={contrastRef} className="inline-block">{phrases[0].contrast}</span>
          </span>
        </h2>

        <div aria-hidden="true" className="flex gap-2 mt-6 justify-center sm:justify-end">
          {phrases.map((p, i) => (
            <span key={p.word}
              className={cx('inline-block h-[3px] rounded-chip transition-[width,background-color] duration-500 ease-out-soft',
                i === index ? 'w-6 bg-accent' : 'w-1.5 bg-line-strong')} />
          ))}
        </div>

        <p className="read mt-8 t-body sm:text-lg leading-loose max-w-2xl text-fg-muted">
          طالب يسأل لأنه فضولي، لا لأن الامتحان يقترب.
          يرجع للمادة لأنها منطقية، لا لأنه نسي.
          هذا ما نبنيه.
        </p>
      </div>

      <div aria-hidden="true" className="vision-divider mb-12 sm:mb-16 w-16 h-px bg-line-strong" />

      {/* ── Contrasts ────────────────────────────────────────────── */}
      <ul className="vision-contrasts space-y-4 sm:space-y-5">
        {contrasts.map((c) => (
          <li key={c.after} className="vision-contrast flex items-center gap-3 sm:gap-8 flex-wrap">
            <s className="t-body text-fg-subtle">{c.before}</s>
            <span aria-hidden="true" className="text-fg-accent opacity-50 shrink-0">←</span>
            <span className="t-body font-bold text-fg-strong">{c.after}</span>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
