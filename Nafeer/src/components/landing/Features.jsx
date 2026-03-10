'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: '📖', title: 'دروس محسّنة',       subtitle: 'Enhanced Lessons',  desc: 'المنهج كما لم تره من قبل — نصوص مُرقّمة، صور وصور متحركة، تتبع الوقت، وتسليط الضوء على المفاهيم الأساسية.', accent: 'rgba(212,137,30,0.12)',  border: 'rgba(212,137,30,0.2)',  tag: 'القراءة الذكية' },
  { icon: '📱', title: 'تغذية المعرفة',      subtitle: 'Knowledge Feed',    desc: 'محتوى يومي قصير في شكل تمرير عمودي — مفاهيم، بطاقات تعليمية، وألعاب صغيرة مثل اسحب لليمين أو اليسار لأسئلة صح/خطأ.', accent: 'rgba(234,108,10,0.10)', border: 'rgba(234,108,10,0.20)', tag: 'إدمان مفيد' },
  { icon: '🔬', title: 'المختبر التفاعلي',   subtitle: 'Interactive Lab',   desc: 'محاكاة مرئية للمعادلات والأشكال الثلاثية الأبعاد — غيّر المتغير وشاهد النتيجة مباشرة.',                                  accent: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.20)', tag: 'تجربة قبل حفظ' },
  { icon: '📝', title: 'بنك الأسئلة',        subtitle: 'Question Bank',     desc: 'آلاف الأسئلة من جميع المواد — امتحانات وتدريبات منظمة بمستويات صعوبة متدرجة.',                                             accent: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.20)', tag: 'استعداد حقيقي' },
  { icon: '🏆', title: 'التقدم والإنجازات',  subtitle: 'Gamification',      desc: 'نظام نقاط، سلاسل يومية، وشارات تحفيزية تجعل الالتزام بالمنهج أمراً ممتعاً.',                                              accent: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.20)',  tag: 'لا تكسر السلسلة' },
  { icon: '📴', title: 'بدون إنترنت',        subtitle: 'Offline First',     desc: 'كل المحتوى متاح بعد التحميل الأول — لا حاجة لاتصال، لا انقطاع في المذاكرة.',                                              accent: 'rgba(20,184,166,0.10)', border: 'rgba(20,184,166,0.20)', tag: 'يعمل دائماً' },
];

export default function Features() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.features-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '.features-header', start: 'top 90%', once: true },
        }
      );

      gsap.fromTo('.feature-card',
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.65,
          stagger: { each: 0.08, from: 'start' },
          ease: 'power3.out',
          scrollTrigger: { trigger: '.features-grid', start: 'top 90%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="vision" ref={sectionRef} className="py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="features-header mb-14 sm:mb-20 text-center">
          <span className="inline-block text-sm tracking-widest uppercase mb-4 font-mono" style={{ color: 'var(--accent)' }}>
            ما الذي نبنيه
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-4 sm:mb-6" style={{ color: 'var(--text-primary)' }}>
            تجربة لم تعشها من قبل
          </h2>
          <div className="ember-line w-20 sm:w-24 mx-auto" />
        </div>

        <div className="features-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card relative p-5 sm:p-7 rounded-2xl overflow-hidden cursor-default transition-all duration-300"
              style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: `1px solid ${f.border}` }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: `radial-gradient(ellipse at top right, ${f.accent}, transparent 70%)` }} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4 sm:mb-5">
                  <span className="text-3xl sm:text-4xl">{f.icon}</span>
                  <span className="text-xs px-2 py-1 rounded-full font-mono" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-xs font-mono mb-3 sm:mb-4 tracking-wide" style={{ color: 'var(--text-muted)' }}>{f.subtitle}</p>
                <p className="text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
