'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const contrasts = [
  { before: 'حفظ الكتاب',          after: 'فهم المادة' },
  { before: 'تلقي المعلومة',        after: 'تجربة المفهوم' },
  { before: 'الاعتماد على الإنترنت', after: 'التعلم في أي ظرف' },
];

export default function VisionSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.vision-statement',
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: '.vision-statement', start: 'top 88%', once: true },
        }
      );

      gsap.fromTo('.vision-contrast',
        { opacity: 0, x: 20 },
        {
          opacity: 1, x: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: '.vision-contrasts', start: 'top 90%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="vision"
      className="py-16 sm:py-24 px-4 sm:px-6 relative"
    >
      <div className="ember-line max-w-6xl mx-auto mb-16 sm:mb-24 opacity-40" />

      <div className="max-w-4xl mx-auto">

        {/* Vision statement block */}
        <div className="vision-statement mb-14 sm:mb-20">
          <span
            className="inline-block text-xs sm:text-sm font-mono tracking-widest uppercase mb-5"
            style={{ color: 'var(--accent)' }}
          >
            الإمكانية الحقيقية
          </span>

          {/* Large vision text */}
          <div
            className="text-2xl sm:text-3xl md:text-4xl font-arabic font-bold leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
          >
            <p>تخيّل طالباً يفهم</p>
            <p>
              <em
                className="not-italic"
                style={{ color: 'var(--accent)' }}
              >لماذا</em>
              {' '}تحدث التفاعلات الكيميائية
            </p>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
              لا فقط يحفظ معادلاتها.
            </p>
          </div>

          <p
            className="mt-6 text-base sm:text-lg leading-loose font-arabic max-w-2xl"
            style={{ color: 'var(--text-muted)' }}
          >
            يقدر يسأل، يجرب، ويعود — في أي وقت وأي مكان.
            هذا ما نبنيه معاً.
          </p>
        </div>

        {/* Divider */}
        <div
          className="mb-10 sm:mb-14 w-16"
          style={{ height: '1px', background: 'var(--border-mid)' }}
        />

        {/* Before / After contrasts */}
        <div className="vision-contrasts space-y-4">
          {contrasts.map((c, i) => (
            <div
              key={i}
              className="vision-contrast flex items-center gap-3 sm:gap-6 flex-wrap"
            >
              {/* Before */}
              <span
                className="relative text-sm sm:text-base font-arabic"
                style={{ color: 'var(--text-muted)', opacity: 0.7 }}
              >
                {/* Strikethrough line */}
                <span className="relative">
                  {c.before}
                  <span
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
                    style={{ height: '1px', background: 'var(--text-muted)', opacity: 0.5 }}
                  />
                </span>
              </span>

              {/* Arrow */}
              <span
                className="font-mono text-sm shrink-0"
                style={{ color: 'var(--border-mid)', transform: 'scaleX(-1)', display: 'inline-block' }}
              >
                ──→
              </span>

              {/* After */}
              <span
                className="text-sm sm:text-base font-arabic font-bold"
                style={{ color: 'var(--accent)' }}
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