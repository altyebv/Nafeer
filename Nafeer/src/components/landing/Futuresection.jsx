'use client';
import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

const horizons = [
  {
    phase: 'المرحلة التالية',
    title: 'تغطية كاملة للمرحلة الثانوية',
    desc: 'بشير اليوم يخدم طلاب الشهادة. الخطوة القادمة: الصف الأول والثاني الثانوي — حتى لا يصل الطالب للشهادة وعنده فجوات من سنتين.',
    accent: true,
  },
  {
    phase: 'قريباً',
    title: 'منافسة ولوحات شرف',
    desc: 'تحديات أسبوعية بين الطلاب، ومسابقات بين المدارس. التعلم لا يحتاج أن يكون صامتاً — المنافسة الصحية تُشعل الشغف.',
    accent: false,
  },
  {
    phase: 'قريباً',
    title: 'نماذج أذكى، تجربة أعمق',
    desc: 'شرح يتكيف مع طريقة تفكير كل طالب. عندما لا يفهم طريقة واحدة، يجرب بشير طريقة ثانية وثالثة — آلياً.',
    accent: false,
  },
  {
    phase: 'قريباً',
    title: 'المعمل',
    desc: 'بيئة تفاعلية لتجريب المفاهيم العلمية والرياضية. لا تكتفي بفهم النظرية — جربها بنفسك وشاهدها تعمل.',
    accent: false,
  },
  {
    phase: 'دائماً',
    title: 'تحسين مستمر بلا توقف',
    desc: 'كل إصدار أفضل من السابق. المحتوى يُراجع، الأداء يُقاس، والملاحظات من الطلاب والمساهمين تشكّل كل قرار.',
    accent: false,
  },
];

export default function FutureSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.fromTo('.future-eyebrow',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.future-eyebrow', start: 'top 90%', once: true } }
      );

      gsap.fromTo('.future-headline',
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 1.05, ease: 'power3.out',
          scrollTrigger: { trigger: '.future-headline', start: 'top 88%', once: true } }
      );

      gsap.fromTo('.future-sub',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1,
          scrollTrigger: { trigger: '.future-sub', start: 'top 88%', once: true } }
      );

      gsap.fromTo('.future-horizon',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.13, ease: 'power3.out',
          scrollTrigger: { trigger: '.future-horizons', start: 'top 88%', once: true } }
      );

      gsap.fromTo('.future-open-source',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out',
          scrollTrigger: { trigger: '.future-open-source', start: 'top 92%', once: true } }
      );

      gsap.fromTo('.future-closing',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '.future-closing', start: 'top 92%', once: true } }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="future"
      className="py-24 sm:py-36 px-4 sm:px-6 relative overflow-hidden"
    >
      {/* Background watermark */}
      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2 pointer-events-none select-none"
        style={{ opacity: 0.014 }}
      >
        <span className="text-[40vw] font-arabic font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
          غداً
        </span>
      </div>

      {/* Ambient glow — top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(212,137,30,0.07), transparent 70%)' }}
      />

      <div className="max-w-4xl mx-auto relative z-10">

        {/* ── Vision statement ── */}
        <div className="mb-16 sm:mb-24">
          <span
            className="future-eyebrow inline-block text-md tracking-widest uppercase font-mono mb-6"
            style={{ color: 'var(--accent)', opacity: 0 }}
          >
            إلى أين نذهب
          </span>

          <h2
            className="future-headline text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-arabic font-bold leading-snug mb-7"
            style={{ color: 'var(--text-primary)', opacity: 0 }}
          >
            بشير اليوم بداية.
            <br />
            <span style={{ color: 'var(--accent)' }}>والطريق أمامنا طويل.</span>
          </h2>

          <p
            className="future-sub text-base sm:text-lg leading-loose font-arabic max-w-2xl"
            style={{ color: 'var(--text-secondary)', opacity: 0 }}
          >
            بُني بيد واحدة، ويُطور الآن بمساهمة عشرات. الهدف لم يتغير:
            أن لا يعتمد أي طالب سوداني على الحظ ليفهم مادته.
            هذا ما يبدو عليه الطريق من هنا.
          </p>
        </div>

        {/* ── Roadmap horizons ── */}
        <div className="future-horizons space-y-4 mb-16 sm:mb-20">
          {horizons.map((item, i) => (
            <div
              key={i}
              className="future-horizon group relative flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8 py-6 sm:py-7 px-6 sm:px-8 rounded-2xl transition-all duration-300"
              style={{
                background: item.accent ? 'var(--accent-dim)' : 'var(--bg-card)',
                border: item.accent
                  ? '1px solid rgba(212,137,30,0.22)'
                  : '1px solid var(--border-subtle)',
                opacity: 0,
              }}
              onMouseEnter={e => {
                if (!item.accent) {
                  e.currentTarget.style.borderColor = 'rgba(212,137,30,0.18)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = item.accent ? 'rgba(212,137,30,0.22)' : 'var(--border-subtle)';
                e.currentTarget.style.background = item.accent ? 'var(--accent-dim)' : 'var(--bg-card)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Phase pill */}
              <div className="shrink-0 sm:w-28 sm:text-left">
                <span
                  className="inline-block text-xs font-mono px-2.5 py-1 rounded-full"
                  style={
                    item.phase === 'دائماً'
                      ? { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }
                      : item.accent
                      ? { background: 'rgba(212,137,30,0.18)', border: '1px solid rgba(212,137,30,0.3)', color: 'var(--accent)' }
                      : { background: 'rgba(212,137,30,0.08)', border: '1px solid rgba(212,137,30,0.18)', color: 'var(--accent)', opacity: 0.75 }
                  }
                >
                  {item.phase}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3
                  className="font-bold text-base sm:text-lg mb-2 font-arabic"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-loose font-arabic"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Open source commitment ── */}
        <div
          className="future-open-source flex items-start gap-4 mb-16 sm:mb-20 py-5 px-6 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', opacity: 0 }}
        >
          <div className="mt-1 shrink-0">
            <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
          </div>
          <p className="text-sm leading-relaxed font-arabic" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>بشير مفتوح المصدر ومجاني الآن وللأبد.</span>{' '}
            هذا القرار ليس تكتيكاً تسويقياً — هو مبدأ. التعليم الجيد لا يجب أن يكون خلف جدار.
          </p>
        </div>

        {/* ── Closing statement ── */}
        <div className="future-closing text-center" style={{ opacity: 0 }}>
          <div
            className="w-12 h-px mx-auto mb-8"
            style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
          />
          <p
            className="text-xl sm:text-2xl md:text-3xl font-arabic font-bold leading-relaxed mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            كل هذا يبدأ بمساهم واحد.
          </p>
          <p className="text-md font-arabic" style={{ color: 'var(--text-muted)' }}>
            ربما أنت.
          </p>
        </div>

      </div>
    </section>
  );
}