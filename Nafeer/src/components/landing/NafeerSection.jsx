'use client';
import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

const steps = [
  { num: '١', title: 'تقدم بطلبك', desc: 'أخبرنا من أنت وأي مادة تريد بناءها. نقرأ كل طلب شخصياً ونرد خلال ٤٨ ساعة.' },
  { num: '٢', title: 'احصل على صلاحياتك', desc: 'بعد الموافقة، حساب كامل في منصة نفير — والمادة التي اخترتها محجوزة لك.' },
  { num: '٣', title: 'ابدأ البناء', desc: 'أداة تحرير مبنية لهذا الغرض تحديداً — وحدات، دروس، مفاهيم، وأسئلة. لا تقنية معقدة.' },
  { num: '٤', title: 'شاهد أثرك', desc: 'محتواك يُصدَّر تلقائياً لتطبيق بشير. اسمك يظهر على كل درس بنيته — أمام كل من يفتحه.' },
];

const perks = [
  { icon: '🏅', title: 'اسمك في التطبيق', desc: 'كل طالب يفتح درساً أنشأته يرى اسمك. ليس في الـ credits — في لحظة التعلم نفسها.' },
  { icon: '🎓', title: 'أثر يمتد عبر الزمن', desc: 'طالب يفهم اليوم بسببك قد يُعلّم غيره غداً. بعض الأفعال لا حدود لتضاعفها.' },
  { icon: '🛠️', title: 'أدوات احترافية', desc: 'منصة نفير بُنيت خصيصاً لإنشاء محتوى الشهادة السودانية. كل أداة فيها لها غرض واحد.' },
];

export default function NafeerSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Story block: slide up
      gsap.fromTo('.nafeer-story',
        { opacity: 0, y: 44 },
        {
          opacity: 1, y: 0, duration: 0.95, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-story', start: 'top 88%', once: true },
        }
      );

      // Who-list items: stagger from right
      gsap.fromTo('.nafeer-who',
        { opacity: 0, x: 24 },
        {
          opacity: 1, x: 0, duration: 0.65, stagger: 0.13, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-who-list', start: 'top 90%', once: true },
        }
      );

      // Impact callout: scale in
      gsap.fromTo('.nafeer-impact',
        { opacity: 0, scale: 0.94, y: 24 },
        {
          opacity: 1, scale: 1, y: 0, duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-impact', start: 'top 88%', once: true },
        }
      );

      // Steps: stagger up, connecting line animates between them
      gsap.fromTo('.nafeer-step',
        { opacity: 0, y: 36, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.14, ease: 'back.out(1.3)',
          scrollTrigger: { trigger: '.nafeer-steps', start: 'top 88%', once: true },
        }
      );

      // Connector lines between steps
      gsap.fromTo('.nafeer-connector',
        { scaleX: 0, transformOrigin: 'right center' },
        {
          scaleX: 1, duration: 0.6, stagger: 0.14, ease: 'expo.out', delay: 0.3,
          scrollTrigger: { trigger: '.nafeer-steps', start: 'top 88%', once: true },
        }
      );

      // Perks: stagger from right
      gsap.fromTo('.nafeer-perk',
        { opacity: 0, x: 32 },
        {
          opacity: 1, x: 0, duration: 0.7, stagger: 0.13, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-perks', start: 'top 90%', once: true },
        }
      );

      // CTA block: scale in from below
      gsap.fromTo('.nafeer-cta-block',
        { opacity: 0, y: 28, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-cta-block', start: 'top 92%', once: true },
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="nafeer" ref={sectionRef} className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="ember-line max-w-6xl mx-auto mb-16 sm:mb-24 opacity-40" />

      {/* Background watermark */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none" style={{ opacity: 0.018 }}>
        <span className="text-[28vw] font-arabic font-bold leading-none" style={{ color: 'var(--text-primary)' }}>نفير</span>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* ── BEAT 1: The Story ── */}
        <div className="nafeer-story mb-14 sm:mb-20" style={{ opacity: 0 }}>
          <span className="inline-block text-xs sm:text-sm tracking-widest uppercase mb-5 font-mono" style={{ color: 'var(--accent)' }}>
            النفير — مفهوم سوداني أصيل
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-6 leading-snug" style={{ color: 'var(--text-primary)' }}>
            ما لا يبنيه شخص واحد
            <br />
            <span style={{ color: 'var(--accent)' }}>يبنيه النفير</span>
          </h2>
          <div className="max-w-2xl space-y-4 text-base sm:text-lg leading-loose font-arabic" style={{ color: 'var(--text-secondary)' }}>
            <p>
              النفير في الثقافة السودانية يعني أن يجتمع الجيران لبناء ما لا يستطيع
              أحدهم بناءه وحده. ليس تطوعاً وليس عملاً — بل شيء أعمق: إحساس بأن
              هذا يخصني وأن غيابي سيُشعَر به.
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              هكذا نبني بشير — خبير يرسم مادته، وطالب يفهمها، وأثر يمتد.
            </p>
          </div>

          {/* Who belongs here */}
          <div className="nafeer-who-list mt-8 sm:mt-10 space-y-2">
            <p className="text-xs font-mono mb-4 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>النفير يبحث عن</p>
            {[
              { icon: '🎓', who: 'معلمين', desc: 'يعرفون مادتهم ويريدون نقلها بطريقة تفاعلية' },
              { icon: '🧑‍💻', who: 'طلاب جامعة', desc: 'يتذكرون ما صعب عليهم في الشهادة ويريدون تسهيله' },
              { icon: '🌍', who: 'متحمسين للتعليم', desc: 'يرون في تحسين التعليم قضية تستحق وقتهم' },
            ].map((item, i) => (
              <div
                key={i}
                className="nafeer-who flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-200"
                style={{ border: '1px solid var(--border-subtle)', opacity: 0 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,137,30,0.25)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{item.who}</span>
                  <span className="text-sm mr-2" style={{ color: 'var(--text-muted)' }}>— {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact callout */}
        <div
          className="nafeer-impact mb-14 sm:mb-20 p-6 sm:p-8 rounded-2xl relative overflow-hidden"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(212,137,30,0.2)', opacity: 0 }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(212,137,30,0.07), transparent 70%)' }} />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-8">
            <div>
              <p className="text-xs sm:text-sm font-mono mb-2" style={{ color: 'var(--accent)' }}>ماذا يعني وجودك؟</p>
              <p className="text-xl sm:text-2xl font-arabic font-bold" style={{ color: 'var(--text-primary)' }}>
                مادة واحدة منك = مئات الدروس، تُعاد استخدامها آلاف المرات
              </p>
            </div>
            <div className="flex gap-8 sm:gap-10 shrink-0">
              {[{ value: '١٢', label: 'مادة مفتوحة' }, { value: '∞', label: 'طالب يستفيد' }].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold stat-number" style={{ color: 'var(--accent)' }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BEAT 2: How to Join ── */}
        <p className="text-xs font-mono mb-6 sm:mb-7 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          الطريق أقصر مما تتخيل — ٤ خطوات
        </p>

        {/* Steps grid */}
        <div className="nafeer-steps grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-14 sm:mb-18">
          {steps.map((step, i) => (
            <div key={i} className="nafeer-step relative" style={{ opacity: 0 }}>
              {/* Connector line between steps */}
              {i < steps.length - 1 && (
                <div
                  className="nafeer-connector hidden lg:block absolute top-10 left-0 w-full h-px pointer-events-none"
                  style={{ background: 'linear-gradient(to left, transparent, var(--border-mid), transparent)', transform: 'scaleX(0)' }}
                />
              )}
              <div
                className="relative p-5 sm:p-6 rounded-xl h-full transition-all duration-300"
                style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,137,30,0.3)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="text-2xl sm:text-3xl font-bold font-mono mb-3" style={{ color: 'var(--accent)', opacity: 0.8 }}>{step.num}</div>
                <h3 className="text-sm sm:text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="text-xs sm:text-sm leading-loose font-arabic" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Perks */}
        <div className="nafeer-perks grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-14 sm:mb-16">
          {perks.map((item, i) => (
            <div
              key={i}
              className="nafeer-perk flex items-start gap-4 p-5 sm:p-6 rounded-xl transition-all duration-300"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', opacity: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,137,30,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span className="text-2xl sm:text-3xl mt-0.5 shrink-0">{item.icon}</span>
              <div>
                <h4 className="font-bold mb-1.5 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                <p className="text-xs sm:text-sm leading-loose font-arabic" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Closing CTA block */}
        <div
          className="nafeer-cta-block text-center py-12 sm:py-14 px-6 sm:px-10 rounded-2xl relative overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', opacity: 0 }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center bottom, var(--mesh-1), transparent 60%)' }} />
          <div className="relative z-10">
            <p className="text-xs sm:text-sm font-mono mb-3" style={{ color: 'var(--text-muted)' }}>كل يوم بدون مادة يعني يوماً أقل لطالب ينتظر</p>
            <p className="text-2xl sm:text-3xl font-arabic font-bold mb-7" style={{ color: 'var(--text-primary)' }}>مقعدك في النفير شاغر</p>
            <a
              href="/prejoin"
              className="inline-flex items-center gap-3 px-10 sm:px-12 py-4 font-bold rounded-xl transition-all duration-300 text-base"
              style={{ background: 'var(--accent)', color: '#0e0c09' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 0 60px var(--glow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
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