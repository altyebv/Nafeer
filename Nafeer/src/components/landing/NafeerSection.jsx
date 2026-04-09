'use client';
import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

const steps = [
  { num: '١', title: 'تقدم بطلبك', desc: 'أخبرنا من أنت وأي مادة تريد بناءها. نقرأ كل طلب شخصياً ونرد خلال ٤٨ ساعة.' },
  { num: '٢', title: 'احصل على صلاحياتك', desc: 'بعد الموافقة، حساب كامل في منصة نفير — والمادة التي اخترتها محجوزة لك.' },
  { num: '٣', title: 'ابدأ البناء', desc: 'أداة تحرير مبنية لهذا الغرض تحديداً — وحدات، دروس، مفاهيم، وأسئلة. لا تقنية معقدة.' },
  { num: '٤', title: 'شاهد أثرك', desc: 'محتواك يُصدَّر تلقائياً لتطبيق بشير. اسمك يظهر على كل درس بنيته — أمام كل من يفتحه.' },
];

export default function NafeerSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.fromTo('.nafeer-label',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-label', start: 'top 90%', once: true } }
      );

      gsap.fromTo('.nafeer-headline',
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-headline', start: 'top 88%', once: true } }
      );

      gsap.fromTo('.nafeer-body-line',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.75, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-body', start: 'top 88%', once: true } }
      );

      gsap.fromTo('.nafeer-who',
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.65, stagger: 0.11, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-who-list', start: 'top 90%', once: true } }
      );

      gsap.fromTo('.nafeer-pull',
        { opacity: 0, scaleX: 0.96, y: 20 },
        { opacity: 1, scaleX: 1, y: 0, duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-pull', start: 'top 88%', once: true } }
      );

      gsap.fromTo('.nafeer-steps-label',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-steps-label', start: 'top 90%', once: true } }
      );

      gsap.fromTo('.nafeer-step',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.65, stagger: 0.12, ease: 'back.out(1.2)',
          scrollTrigger: { trigger: '.nafeer-steps', start: 'top 88%', once: true } }
      );

      gsap.fromTo('.nafeer-perk',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-perks', start: 'top 90%', once: true } }
      );

      gsap.fromTo('.nafeer-cta-block',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-cta-block', start: 'top 92%', once: true } }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="nafeer" ref={sectionRef} className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden">

      {/* Background watermark */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
        style={{ opacity: 0.016 }}
      >
        <span className="text-[32vw] font-arabic font-bold leading-none" style={{ color: 'var(--text-primary)' }}>نفير</span>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* ── BEAT 1: The Story ── */}
        <div className="mb-16 sm:mb-24">

          {/* Label + headline */}
          <div className="nafeer-label mb-6" style={{ opacity: 0 }}>
            <span className="inline-block text-xs tracking-widest uppercase font-mono" style={{ color: 'var(--accent)' }}>
              النفير — مفهوم سوداني أصيل
            </span>
          </div>

          <h2
            className="nafeer-headline text-3xl sm:text-4xl md:text-[2.75rem] font-arabic font-bold mb-10 leading-snug"
            style={{ color: 'var(--text-primary)', opacity: 0 }}
          >
            ما لا يبنيه شخص واحد
            <br />
            <span style={{ color: 'var(--accent)' }}>يبنيه النفير</span>
          </h2>

          {/* Two-column layout: story text + who-list */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 md:gap-16 items-start">

            {/* Story paragraphs */}
            <div className="nafeer-body space-y-5 text-base sm:text-lg leading-[2] font-arabic" style={{ color: 'var(--text-secondary)' }}>
              <p className="nafeer-body-line" style={{ opacity: 0 }}>
                النفير في الثقافة السودانية يعني أن يجتمع الناس لبناء ما لا يستطيع أحدهم بناءه وحده.
                ليس عملاً مؤقتاً — بل شعور بأن هذا الشيء يخصنا جميعاً وأننا مسؤولون عنه.
              </p>
              <p className="nafeer-body-line" style={{ opacity: 0, color: 'var(--text-muted)' }}>
                السودان يمر اليوم بلحظة تحوّل رقمي حقيقية. والسؤال ليس هل نكون جزءاً منه — بل كيف؟
                النفير هو جوابنا: نبني المعرفة كما نبني البيوت — معاً، بإحساس المسؤولية، وبطريقتنا.
              </p>
              <p className="nafeer-body-line" style={{ opacity: 0, color: 'var(--text-muted)' }}>
                خبير يرسم مادته. طالب يفهمها. وأثر يمتد لسنوات.
              </p>
            </div>

            {/* Who belongs here — compact aside */}
            <div className="nafeer-who-list md:w-64 shrink-0">
              <p className="text-xs font-mono mb-4 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                النفير يبحث عن
              </p>
              <div className="space-y-2">
                {[
                  { icon: '🎓', who: 'معلمين', desc: 'يريدون نقل مادتهم بطريقة تفاعلية' },
                  { icon: '🧑‍💻', who: 'طلاب جامعة', desc: 'يريدون تسهيل ما صعب عليهم' },
                  { icon: '🌍', who: 'متحمسين', desc: 'يرون التعليم قضية تستحق وقتهم' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="nafeer-who flex items-center gap-3 py-2.5 px-3.5 rounded-xl transition-all duration-200"
                    style={{ border: '1px solid var(--border-subtle)', opacity: 0 }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(212,137,30,0.22)';
                      e.currentTarget.style.background = 'var(--bg-card)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div>
                      <span className="font-bold text-xs block" style={{ color: 'var(--text-primary)' }}>{item.who}</span>
                      <span className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pull quote — impact statement */}
          <div
            className="nafeer-pull mt-12 sm:mt-14 py-7 px-7 sm:px-10 rounded-2xl relative overflow-hidden"
            style={{
              background: 'var(--accent-dim)',
              borderRight: '3px solid var(--accent)',
              borderTop: '1px solid rgba(212,137,30,0.15)',
              borderBottom: '1px solid rgba(212,137,30,0.15)',
              borderLeft: '1px solid rgba(212,137,30,0.15)',
              opacity: 0,
            }}
          >
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <p className="text-xl sm:text-2xl font-arabic font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                مادة واحدة منك تُبنى مرة واحدة
                <span style={{ color: 'var(--accent)' }}> وتُستخدم آلاف المرات</span>
              </p>
              <div className="flex gap-8 shrink-0">
                {[{ value: '١٢', label: 'مادة مفتوحة' }, { value: '∞', label: 'طالب يستفيد' }].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl font-bold stat-number" style={{ color: 'var(--accent)' }}>{s.value}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── BEAT 2: How to Join ── */}
        <div className="mb-14 sm:mb-20">
          <p className="nafeer-steps-label text-xs font-mono mb-8 tracking-widest uppercase" style={{ color: 'var(--text-muted)', opacity: 0 }}>
            الطريق أقصر مما تتخيل — ٤ خطوات
          </p>

          {/* Steps: horizontal list on desktop, stacked on mobile */}
          <div className="nafeer-steps grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className="nafeer-step group relative p-5 rounded-xl transition-all duration-300"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  opacity: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(212,137,30,0.28)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Step number — top right in RTL */}
                <div
                  className="text-3xl font-bold font-mono mb-4 leading-none"
                  style={{ color: 'var(--accent)', opacity: 0.7 }}
                >
                  {step.num}
                </div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="text-sm leading-loose font-arabic" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>

                {/* Subtle connector dot — bottom left (leading edge in RTL = left) */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-8 left-0 -translate-x-1/2"
                    style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border-mid)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── BEAT 3: What You Get ── */}
        <div className="nafeer-perks mb-14 sm:mb-20">
          <p className="text-xs font-mono mb-8 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            ماذا يعني وجودك
          </p>

          {/* Perks: 3-col on desktop, full-width divider-separated rows on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px" style={{ background: 'var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              {
                icon: '🏅',
                title: 'اسمك في لحظة التعلم',
                desc: 'كل طالب يفتح درساً أنشأته يرى اسمك — ليس في الإهداء ، بل في لحظة التعلم نفسها.',
              },
              {
                icon: '🎓',
                title: 'أثر يتضاعف',
                desc: 'طالب يفهم اليوم بسببك قد يُعلّم غيره غداً. بعض الأفعال لا حدود لامتدادها.',
              },
              {
                icon: '🛠️',
                title: 'أدوات مبنية لغرض واحد',
                desc: 'نفير بُني خصيصاً لمحتوى الشهادة السودانية. كل أداة فيه لها غرض واحد فقط.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="nafeer-perk p-6 sm:p-7 transition-all duration-300"
                style={{ background: 'var(--bg-secondary)', opacity: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              >
                <span className="text-2xl block mb-4">{item.icon}</span>
                <h4 className="font-bold mb-2 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                <p className="text-xs sm:text-sm leading-loose font-arabic" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BEAT 4: CTA ── */}
        <div
          className="nafeer-cta-block text-center py-14 sm:py-16 px-6 sm:px-10 rounded-2xl relative overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', opacity: 0 }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center bottom, var(--mesh-1), transparent 65%)' }}
          />
          <div className="relative z-10">
            <p className="text-xs font-mono mb-4 tracking-wide" style={{ color: 'var(--text-muted)' }}>
              كل يوم بدون مادة يعني يوماً أقل لطالب ينتظر
            </p>
            <p className="text-2xl sm:text-3xl font-arabic font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              مقعدك في النفير شاغر
            </p>
            <p className="text-sm font-arabic mb-8" style={{ color: 'var(--text-muted)' }}>
              كن جزءاً من التحول الرقمي — بطريقتنا، بقصصنا، بمعرفتنا
            </p>
            <a
              href="/prejoin"
              className="inline-flex items-center gap-3 px-10 sm:px-12 py-4 font-bold rounded-xl transition-all duration-300 text-base"
              style={{ background: 'var(--accent)', color: '#0e0c09' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--accent-hover)';
                e.currentTarget.style.boxShadow = '0 0 60px var(--glow)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>انضم للنفير الآن</span>
              <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>←</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}