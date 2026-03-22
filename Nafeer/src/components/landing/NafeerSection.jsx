'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    num: '١',
    title: 'تقدم بطلبك',
    desc: 'أخبرنا عن خلفيتك ومادتك. نراجع الطلبات يدوياً ونرد خلال ٤٨ ساعة.',
  },
  {
    num: '٢',
    title: 'احصل على صلاحياتك',
    desc: 'بعد الموافقة تحصل على حساب في منصة نفير مع المادة المخصصة لك مباشرة.',
  },
  {
    num: '٣',
    title: 'ابدأ البناء',
    desc: 'استخدم أداة التحرير لإضافة الوحدات، الدروس، المفاهيم، والأسئلة — بواجهة مبنية لهذا الهدف.',
  },
  {
    num: '٤',
    title: 'يصل للطلاب',
    desc: 'محتواك يُصدَّر مباشرة لتطبيق بشير ويصل لآلاف الطلاب في كل مكان — تلقائياً.',
  },
];

const perks = [
  {
    icon: '🏅',
    title: 'اسمك في التطبيق',
    desc: 'كل درس تبنيه يحمل اسمك أمام كل من يقرأه. أثرك مرئي وحقيقي.',
  },
  {
    icon: '🎓',
    title: 'أثر يمتد عبر الزمن',
    desc: 'طالب يفهم اليوم بسببك قد يُعلّم غيره غداً. المعرفة تتضاعف بلا حدود.',
  },
  {
    icon: '🛠️',
    title: 'أدوات احترافية',
    desc: 'منصة نفير ليست نموذجاً عاماً — بيئة عمل حقيقية مبنية لهذا الهدف تحديداً.',
  },
];

export default function NafeerSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.nafeer-header',
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-header', start: 'top 88%', once: true },
        }
      );
      gsap.fromTo('.nafeer-impact',
        { opacity: 0, scale: 0.95, y: 20 },
        {
          opacity: 1, scale: 1, y: 0, duration: 0.75, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-impact', start: 'top 88%', once: true },
        }
      );
      gsap.fromTo('.nafeer-step',
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 0.65, stagger: 0.13, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-steps', start: 'top 88%', once: true },
        }
      );
      gsap.fromTo('.nafeer-perk',
        { opacity: 0, x: 28 },
        {
          opacity: 1, x: 0, duration: 0.65, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-perks', start: 'top 90%', once: true },
        }
      );
      gsap.fromTo('.nafeer-cta-block',
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '.nafeer-cta-block', start: 'top 92%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="ember-line max-w-6xl mx-auto mb-16 sm:mb-24 opacity-40" />

      {/* Background watermark */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
        style={{ opacity: 0.02 }}
      >
        <span
          className="text-[28vw] font-arabic font-bold leading-none"
          style={{ color: 'var(--text-primary)' }}
        >نفير</span>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="nafeer-header mb-12 sm:mb-16 max-w-2xl">
          <span
            className="inline-block text-xs sm:text-sm tracking-widest uppercase mb-4 font-mono"
            style={{ color: 'var(--accent)' }}
          >
            النفير — المساهمون
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-5 leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            أنت تعرف المادة —
            <br />
            <span style={{ color: 'var(--accent)' }}>نحن نبني الأداة</span>
          </h2>
          <p
            className="text-base sm:text-lg leading-loose"
            style={{ color: 'var(--text-secondary)' }}
          >
            النفير مفهوم سوداني أصيل للتعاون الجماعي — حين يجتمع الكل لبناء ما لا يقدر عليه الفرد وحده.
            هكذا نبني بشير: خبير يرسم مادته، وطالب يفهمها، وأثر يمتد.
          </p>
        </div>

        {/* Impact callout */}
        <div
          className="nafeer-impact mb-14 sm:mb-20 p-6 sm:p-8 rounded-2xl relative overflow-hidden"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid rgba(212,137,30,0.2)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(212,137,30,0.07), transparent 70%)' }}
          />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-8">
            <div>
              <p
                className="text-xs sm:text-sm font-mono mb-2"
                style={{ color: 'var(--accent)' }}
              >ماذا يعني مساهمتك؟</p>
              <p
                className="text-xl sm:text-2xl font-arabic font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                مادة واحدة منك = مئات الدروس لآلاف الطلاب
              </p>
            </div>
            <div className="flex gap-8 sm:gap-10 shrink-0">
              {[
                { value: '١٢', label: 'مادة مفتوحة' },
                { value: '∞',  label: 'طالب يستفيد' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div
                    className="text-3xl font-bold stat-number"
                    style={{ color: 'var(--accent)' }}
                  >{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps label */}
        <p
          className="text-xs font-mono mb-6 sm:mb-7 tracking-widest uppercase"
          style={{ color: 'var(--text-muted)' }}
        >كيف تبدأ — ٤ خطوات</p>

        {/* Steps grid */}
        <div className="nafeer-steps grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-14 sm:mb-18">
          {steps.map((step, i) => (
            <div key={i} className="nafeer-step relative">
              {/* Connecting line between steps */}
              {i < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-10 left-0 w-full h-px pointer-events-none"
                  style={{ background: 'linear-gradient(to left, transparent, var(--border-mid), transparent)' }}
                />
              )}
              <div
                className="relative p-5 sm:p-6 rounded-xl h-full transition-all duration-300"
                style={{
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(212,137,30,0.3)';
                  e.currentTarget.style.transform   = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow   = '0 8px 30px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform   = 'translateY(0)';
                  e.currentTarget.style.boxShadow   = 'none';
                }}
              >
                <div
                  className="text-2xl sm:text-3xl font-bold font-mono mb-3"
                  style={{ color: 'var(--accent)', opacity: 0.8 }}
                >{step.num}</div>
                <h3
                  className="text-sm sm:text-base font-bold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >{step.title}</h3>
                <p
                  className="text-xs sm:text-sm leading-loose"
                  style={{ color: 'var(--text-muted)' }}
                >{step.desc}</p>
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
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(212,137,30,0.25)';
                e.currentTarget.style.transform   = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform   = 'translateY(0)';
              }}
            >
              <span className="text-2xl sm:text-3xl mt-0.5 shrink-0">{item.icon}</span>
              <div>
                <h4
                  className="font-bold mb-1.5 text-sm sm:text-base"
                  style={{ color: 'var(--text-primary)' }}
                >{item.title}</h4>
                <p
                  className="text-xs sm:text-sm leading-loose"
                  style={{ color: 'var(--text-muted)' }}
                >{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Closing CTA block */}
        <div
          className="nafeer-cta-block text-center py-12 sm:py-14 px-6 sm:px-10 rounded-2xl relative overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center bottom, var(--mesh-1), transparent 60%)' }}
          />
          <div className="relative z-10">
            <p
              className="text-xs sm:text-sm font-mono mb-3"
              style={{ color: 'var(--text-muted)' }}
            >الوقت مهم — المنهج يبدأ بك</p>
            <p
              className="text-2xl sm:text-3xl font-arabic font-bold mb-7"
              style={{ color: 'var(--text-primary)' }}
            >
              مستعد لترك أثر حقيقي؟
            </p>
            <a
              href="/prejoin"
              className="inline-flex items-center gap-3 px-10 sm:px-12 py-4 font-bold rounded-xl transition-all duration-300 text-base"
              style={{ background: 'var(--accent)', color: '#0e0c09' }}
              onMouseEnter={e => {
                e.currentTarget.style.background  = 'var(--accent-hover)';
                e.currentTarget.style.boxShadow   = '0 0 60px var(--glow)';
                e.currentTarget.style.transform   = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.boxShadow  = 'none';
                e.currentTarget.style.transform  = 'translateY(0)';
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