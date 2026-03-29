'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const scenes = [
  {
    num: '١',
    label: 'فجوة الفهم',
    labelEn: 'The Comprehension Gap',
    text: 'الكتاب موجود. المعلومة موجودة. لكن الفهم الحقيقي — ذلك الذي يجعلك تحل أي سؤال لا فقط الأسئلة التي حفظتها — بعيد المنال.',
  },
  {
    num: '٢',
    label: 'واقع البنية',
    labelEn: 'The Infrastructure Reality',
    text: 'الإنترنت غير مضمون. الكهرباء تنقطع. والتطبيقات التعليمية الجيدة لم تُصنع للبيئة السودانية — صُنعت لعالم مختلف.',
  },
  {
    num: '٣',
    label: 'ثمن الوضع الحالي',
    labelEn: 'The Cost of the Status Quo',
    text: 'الطالب الجيد يحفظ، يؤدي، وينسى. والمنهج يمشي — لكن الفهم لا يتراكم، والأساس يبقى هشاً.',
  },
];

export default function ProblemSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.problem-eyebrow',
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.problem-eyebrow', start: 'top 90%', once: true },
        }
      );

      gsap.fromTo('.problem-scene',
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.75, stagger: 0.2, ease: 'power3.out',
          scrollTrigger: { trigger: '.problem-scenes', start: 'top 88%', once: true },
        }
      );

      gsap.fromTo('.problem-pivot',
        { opacity: 0, y: 28, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '.problem-pivot', start: 'top 92%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="problem"
      className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden"
    >
      {/* Subtle section background shift */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,137,30,0.03) 0%, transparent 70%)' }}
      />

      {/* Faint watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ opacity: 0.018 }}
      >
        <span
          className="text-[30vw] font-arabic font-bold leading-none"
          style={{ color: 'var(--text-primary)' }}
        >الواقع</span>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Eyebrow */}
        <div className="problem-eyebrow mb-14 sm:mb-20">
          <span
            className="inline-block text-xs sm:text-sm font-mono tracking-widest uppercase mb-4"
            style={{ color: 'var(--accent)' }}
          >
            المشهد المألوف
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            الطالب السوداني يستحق أكثر
            <br />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75em', fontWeight: 400 }}>
              مما يحدث الآن
            </span>
          </h2>
        </div>

        {/* Three scenes — editorial, no cards */}
        <div className="problem-scenes space-y-0">
          {scenes.map((scene, i) => (
            <div
              key={i}
              className="problem-scene group"
            >
              <div
                className="py-8 sm:py-10 flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-12 transition-all duration-500"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                {/* Label column */}
                <div className="sm:w-48 shrink-0 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                  <span
                    className="text-3xl sm:text-4xl font-mono font-bold leading-none"
                    style={{ color: 'var(--accent)', opacity: 0.22 }}
                  >
                    {scene.num}
                  </span>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {scene.label}
                    </p>
                    <p
                      className="text-xs font-mono mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {scene.labelEn}
                    </p>
                  </div>
                </div>

                {/* Scene text */}
                <p
                  className="text-base sm:text-lg leading-loose font-arabic flex-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {scene.text}
                </p>
              </div>
            </div>
          ))}

          {/* Final border */}
          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
        </div>

        {/* Pivot line — the turn */}
        <div className="problem-pivot mt-14 sm:mt-20">
          <div
            className="p-8 sm:p-10 rounded-2xl relative overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(212,137,30,0.15)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(212,137,30,0.05), transparent 70%)' }}
            />
            <div className="relative z-10 flex items-start gap-5">
              <div
                className="w-1 self-stretch rounded-full shrink-0 hidden sm:block"
                style={{ background: 'var(--accent)', opacity: 0.5 }}
              />
              <div>
                <p
                  className="text-xs font-mono mb-3 tracking-widest uppercase"
                  style={{ color: 'var(--accent)' }}
                >
                  نقطة التحول
                </p>
                <p
                  className="text-xl sm:text-2xl md:text-3xl font-arabic font-bold leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  بشير لا يُبدّل المنهج —
                  <span style={{ color: 'var(--accent)' }}> يُبدّل طريقة عيشه.</span>
                </p>
                <p
                  className="text-base leading-loose mt-3 font-arabic"
                  style={{ color: 'var(--text-muted)' }}
                >
                  نفس المقررات. نفس المواد. طريقة مختلفة تماماً في التعلم.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}