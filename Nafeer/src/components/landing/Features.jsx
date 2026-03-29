'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    num: '٠١',
    icon: '📖',
    title: 'دروس محسّنة',
    subtitle: 'Enhanced Lessons',
    desc: 'المنهج نفسه، عُرض بشكل مختلف تماماً — نصوص مُهيكلة، صور توضيحية، ومفاهيم مرقّمة تُبنى فوق بعضها. كل درس يُصنع بعناية من مساهم متخصص في المادة.',
    insight: 'الفهم لا يأتي من القراءة — يأتي من الوضوح',
    accent: 'rgba(212,137,30,0.14)',
    border: 'rgba(212,137,30,0.22)',
  },
  {
    num: '٠٢',
    icon: '📱',
    title: 'تغذية المعرفة',
    subtitle: 'Knowledge Feed',
    desc: 'محتوى يومي قصير في شكل تمرير عمودي — مفاهيم صغيرة، بطاقات تذكيرية، وأسئلة سريعة. معرفة تتراكم بدون أن تشعر.',
    insight: '٣ دقائق يومياً تبني ما لا يبنيه يوم مذاكرة',
    accent: 'rgba(234,108,10,0.11)',
    border: 'rgba(234,108,10,0.22)',
  },
  {
    num: '٠٣',
    icon: '🔬',
    title: 'المختبر التفاعلي',
    subtitle: 'Interactive Lab',
    desc: 'محاكاة مرئية للمعادلات والأشكال الثلاثية الأبعاد — غيّر المتغير وشاهد النتيجة مباشرة.',
    insight: 'شاهد — ثم تذكر. ليس العكس',
    accent: 'rgba(59,130,246,0.11)',
    border: 'rgba(59,130,246,0.22)',
  },
  {
    num: '٠٤',
    icon: '📝',
    title: 'بنك الأسئلة',
    subtitle: 'Question Bank',
    desc: 'آلاف الأسئلة مرتّبة حسب المادة، الوحدة، ومستوى الصعوبة — من الأسئلة الموضوعية إلى التحليلية. كل الامتحانات السابقة في مكان واحد.',
    insight: 'تدرّب على ما سيسألك الامتحان فعلاً',
    accent: 'rgba(168,85,247,0.11)',
    border: 'rgba(168,85,247,0.22)',
  },
  {
    num: '٠٥',
    icon: '🏆',
    title: 'التقدم والإنجازات',
    subtitle: 'Progress & Streaks',
    desc: 'نظام نقاط، سلاسل يومية، وشارات تحفيزية تجعل الالتزام بالمنهج أمراً ممتعاً.',
    insight: 'الانضباط لا يُجبر — يُبنى بالعادة',
    accent: 'rgba(34,197,94,0.11)',
    border: 'rgba(34,197,94,0.22)',
  },
  {
    num: '٠٦',
    icon: '📴',
    title: 'يعمل بدون إنترنت',
    subtitle: 'Offline First',
    desc: 'كل المحتوى متاح بعد التحميل الأول — لا اتصال، لا توقف، لا اعتذارات. مُصمَّم للواقع السوداني، ليس لمثاليته.',
    insight: 'انقطاع الكهرباء لا يوقف الطموح',
    accent: 'rgba(20,184,166,0.11)',
    border: 'rgba(20,184,166,0.22)',
  },
];

export default function Features() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.features-header',
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: '.features-header', start: 'top 90%', once: true },
        }
      );

      gsap.fromTo('.feature-card',
        { opacity: 0, y: 50, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.7,
          stagger: { each: 0.1, from: 'start' },
          ease: 'power3.out',
          scrollTrigger: { trigger: '.features-grid', start: 'top 85%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-24 sm:py-36 px-4 sm:px-6 relative">
      <div className="ember-line max-w-6xl mx-auto mb-20 opacity-40" />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="features-header mb-14 sm:mb-20">
          <p
            className="text-xs sm:text-sm font-mono tracking-widest uppercase mb-4"
            style={{ color: 'var(--accent)' }}
          >
            داخل التطبيق
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            ست أدوات. منهج واحد. فهم حقيقي.
          </h2>
          <div className="ember-line w-20 sm:w-28 mb-5" />
          <p
            className="text-base sm:text-lg leading-loose max-w-xl font-arabic"
            style={{ color: 'var(--text-secondary)' }}
          >
            ليس تطبيقاً تعليمياً عاماً — بشير مصنوع للمنهج السوداني، خطوة خطوة.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="features-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card relative p-6 sm:p-8 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col"
              style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${f.border}`,
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
              {/* Radial accent bg */}
              <div
                className="absolute inset-0 pointer-events-none opacity-80"
                style={{ background: `radial-gradient(ellipse at top right, ${f.accent}, transparent 65%)` }}
              />

              <div className="relative z-10 flex flex-col flex-1">
                <div
                  className="text-xs font-mono mb-4 opacity-35"
                  style={{ color: 'var(--text-primary)' }}
                >{f.num}</div>

                <div className="flex items-start justify-between mb-5">
                  <span className="text-3xl sm:text-4xl">{f.icon}</span>
                </div>

                <h3
                  className="text-lg sm:text-xl font-bold mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >{f.title}</h3>
                <p
                  className="text-xs font-mono mb-4 tracking-wide"
                  style={{ color: 'var(--text-muted)' }}
                >{f.subtitle}</p>
                <p
                  className="text-sm leading-loose flex-1 mb-6 font-arabic"
                  style={{ color: 'var(--text-secondary)' }}
                >{f.desc}</p>

                {/* Insight line */}
                <div
                  className="mt-auto pt-4"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}
                >
                  <span
                    className="text-xs font-mono"
                    style={{ color: 'var(--accent)' }}
                  >↓ {f.insight}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}