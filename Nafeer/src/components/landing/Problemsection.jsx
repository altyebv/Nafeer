'use client';
import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

const scenes = [
  {
    num: '١',
    label: 'كنز في انتظار مفتاحه',
    labelEn: 'A Goldmine Awaiting Its Key',
    text: 'المنهج السوداني غني بالفعل — علم حقيقي، مفاهيم راسخة، معرفة تستحق الفهم. المشكلة ليست فيما يُدرَّس، بل في الجسر بين الكتاب وعقل الطالب. بشير هو ذلك الجسر.',
  },
  {
    num: '٢',
    label: 'صُنع لهذا العالم تحديداً',
    labelEn: 'Built for This World Specifically',
    text: 'معظم التطبيقات التعليمية صُنعت لبيئات مختلفة. بشير صُنع للواقع السوداني — يعمل بلا إنترنت، بلا انقطاع، بلا استثناء. لأن التعليم الجيد حق لكل طالب، بغض النظر عن ظروف اتصاله.',
  },
  {
    num: '٣',
    label: 'المعرفة التي تبقى وتبني',
    labelEn: 'Knowledge That Stays and Builds',
    text: 'كثير من المفاهيم التي تُدرَّس في المرحلة الثانوية هي أساس لما يأتي بعدها. بشير يُساعد الطالب على رؤية هذه الروابط — فلا تُعاد دراسة ما سبق تعلّمه، بل يُبنى عليه.',
  },
];

export default function ProblemSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Eyebrow: slide up
      gsap.fromTo('.problem-eyebrow',
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '.problem-eyebrow', start: 'top 90%', once: true },
        }
      );

      // Scenes: stagger with a larger reveal — each row draws a separator then slides content
      gsap.fromTo('.problem-scene',
        { opacity: 0, y: 44 },
        {
          opacity: 1, y: 0, duration: 0.85, stagger: 0.22, ease: 'power3.out',
          scrollTrigger: { trigger: '.problem-scenes', start: 'top 88%', once: true },
        }
      );

      // Scene separators: draw from right → left (RTL reading direction)
      gsap.fromTo('.problem-separator',
        { scaleX: 0, transformOrigin: 'right center' },
        {
          scaleX: 1, duration: 0.7, stagger: 0.22, ease: 'expo.out',
          scrollTrigger: { trigger: '.problem-scenes', start: 'top 88%', once: true },
        }
      );

      // Pivot card: scale + fade in
      gsap.fromTo('.problem-pivot',
        { opacity: 0, y: 32, scale: 0.96 },
        {
          opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: '.problem-pivot', start: 'top 92%', once: true },
        }
      );

      // Pivot accent bar: grows in
      gsap.fromTo('.problem-pivot-bar',
        { scaleY: 0, transformOrigin: 'top center' },
        {
          scaleY: 1, duration: 0.9, ease: 'expo.out',
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
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,137,30,0.03) 0%, transparent 70%)' }}
      />

      {/* Faint background watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ opacity: 0.018 }}>
        <span className="text-[30vw] font-arabic font-bold leading-none" style={{ color: 'var(--text-primary)' }}>الإمكانية</span>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Eyebrow */}
        <div className="problem-eyebrow mb-14 sm:mb-20" style={{ opacity: 0 }}>
          <span className="inline-block text-xs sm:text-sm font-mono tracking-widest uppercase mb-4" style={{ color: 'var(--accent)' }}>
            لماذا بشير
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            الإمكانية موجودة دائماً
            <br />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75em', fontWeight: 400 }}>نحتاج فقط الأداة المناسبة لإطلاقها</span>
          </h2>
        </div>

        {/* Three scenes */}
        <div className="problem-scenes space-y-0">
          {scenes.map((scene, i) => (
            <div key={i} className="problem-scene group" style={{ opacity: 0 }}>
              {/* Separator line — animates separately */}
              <div className="problem-separator" style={{ borderTop: '1px solid var(--border-subtle)', transform: 'scaleX(0)' }} />
              <div className="py-8 sm:py-10 flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-12 transition-all duration-500">
                {/* Label column */}
                <div className="sm:w-48 shrink-0 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                  <span className="text-3xl sm:text-4xl font-mono font-bold leading-none" style={{ color: 'var(--accent)', opacity: 0.22 }}>
                    {scene.num}
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{scene.label}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{scene.labelEn}</p>
                  </div>
                </div>

                {/* Scene text */}
                <p className="text-base sm:text-lg leading-loose font-arabic flex-1" style={{ color: 'var(--text-secondary)' }}>
                  {scene.text}
                </p>
              </div>
            </div>
          ))}
          <div className="problem-separator" style={{ borderTop: '1px solid var(--border-subtle)', transform: 'scaleX(0)' }} />
        </div>

        {/* Pivot card */}
        <div className="problem-pivot mt-14 sm:mt-20" style={{ opacity: 0 }}>
          <div
            className="p-8 sm:p-10 rounded-2xl relative overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(212,137,30,0.15)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(212,137,30,0.05), transparent 70%)' }} />
            <div className="relative z-10 flex items-start gap-5">
              <div className="problem-pivot-bar w-1 self-stretch rounded-full shrink-0 hidden sm:block" style={{ background: 'var(--accent)', opacity: 0.5, transform: 'scaleY(0)' }} />
              <div>
                <p className="text-md font-mono mb-3 tracking-widest uppercase" style={{ color: 'var(--accent)' }}>الفرق الذي يصنعه بشير</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-arabic font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  بشير لا يُبدّل المنهج —
                  <span style={{ color: 'var(--accent)' }}> يُبدّل طريقة عيشِه.</span>
                </p>
                <p className="text-base leading-loose mt-3 font-arabic" style={{ color: 'var(--text-muted)' }}>
                  نفس المقررات، نفس المواد، نفس الدُروس — لكن بتجربة تعلّم مرئية، تفاعليه و ممتعة . مصممة للطالب السوداني تحديداً.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}