'use client';
import { useEffect, useRef } from 'react';

const features = [
  {
    icon: '📖',
    title: 'دروس محسّنة',
    subtitle: 'Enhanced Lessons',
    desc: 'المنهج كما لم تره من قبل — نصوص مُرقّمة، صور وصور متحركة، تتبع الوقت، وتسليط الضوء على المفاهيم الأساسية.',
    accent: 'from-sand-600/20 to-transparent',
    border: 'border-sand-700/30',
    tag: 'القراءة الذكية',
  },
  {
    icon: '📱',
    title: 'تغذية المعرفة',
    subtitle: 'Knowledge Feed',
    desc: 'محتوى يومي قصير في شكل تمرير عمودي — مفاهيم، بطاقات تعليمية، وألعاب صغيرة مثل اسحب لليمين أو اليسار لأسئلة صح/خطأ.',
    accent: 'from-ember-600/15 to-transparent',
    border: 'border-ember-700/30',
    tag: 'إدمان مفيد',
  },
  {
    icon: '🔬',
    title: 'المختبر التفاعلي',
    subtitle: 'Interactive Lab',
    desc: 'محاكاة مرئية للمعادلات والأشكال الثلاثية الأبعاد — غيّر المتغير وشاهد النتيجة مباشرة.',
    accent: 'from-blue-600/15 to-transparent',
    border: 'border-blue-700/30',
    tag: 'تجربة قبل حفظ',
  },
  {
    icon: '📝',
    title: 'بنك الأسئلة',
    subtitle: 'Question Bank',
    desc: 'آلاف الأسئلة من جميع المواد — امتحانات وتدريبات منظمة بمستويات صعوبة متدرجة.',
    accent: 'from-purple-600/15 to-transparent',
    border: 'border-purple-700/30',
    tag: 'استعداد حقيقي',
  },
  {
    icon: '🏆',
    title: 'التقدم والإنجازات',
    subtitle: 'Gamification',
    desc: 'نظام نقاط، سلاسل يومية، وشارات تحفيزية تجعل الالتزام بالمنهج أمراً ممتعاً.',
    accent: 'from-green-600/15 to-transparent',
    border: 'border-green-700/30',
    tag: 'لا تكسر السلسلة',
  },
  {
    icon: '📴',
    title: 'بدون إنترنت',
    subtitle: 'Offline First',
    desc: 'كل المحتوى متاح بعد التحميل الأول — لا حاجة لاتصال، لا انقطاع في المذاكرة.',
    accent: 'from-teal-600/15 to-transparent',
    border: 'border-teal-700/30',
    tag: 'يعمل دائماً',
  },
];

export default function Features() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll('.feature-card');
            cards.forEach((card, i) => {
              setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
              }, i * 80);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="vision" ref={sectionRef} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-20 text-center">
          <span className="inline-block text-sand-500 text-sm tracking-widest uppercase mb-4 font-mono">
            ما الذي نبنيه
          </span>
          <h2 className="text-4xl md:text-5xl font-arabic font-bold text-sand-50 mb-6">
            تجربة لم تعشها من قبل
          </h2>
          <div className="ember-line w-24 mx-auto" />
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`feature-card relative p-7 rounded-2xl border ${f.border} glass card-hover overflow-hidden cursor-default`}
              style={{ opacity: 0, transform: 'translateY(30px)', transition: 'all 0.5s ease' }}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} pointer-events-none`} />

              <div className="relative z-10">
                {/* Icon & tag */}
                <div className="flex items-start justify-between mb-5">
                  <span className="text-4xl">{f.icon}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-ink-800/60 text-ink-400 font-mono border border-ink-700/40">
                    {f.tag}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-sand-100 mb-1">{f.title}</h3>
                <p className="text-xs text-ink-500 font-mono mb-4 tracking-wide">{f.subtitle}</p>

                {/* Description */}
                <p className="text-ink-300 text-sm leading-loose">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
