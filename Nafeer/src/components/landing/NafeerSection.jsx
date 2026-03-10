'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { num: '١', title: 'تقدم بطلبك',        desc: 'أخبرنا عن خلفيتك ومادتك. نراجع الطلبات يدوياً.' },
  { num: '٢', title: 'احصل على صلاحياتك', desc: 'بعد الموافقة تحصل على حساب في منصة نفير مع المادة المخصصة لك.' },
  { num: '٣', title: 'ابدأ الرسم',          desc: 'استخدم أداة التحرير لإضافة الوحدات، الدروس، المفاهيم، والأسئلة.' },
  { num: '٤', title: 'يصل للطلاب',         desc: 'ما تبنيه يُصدَّر مباشرة لتطبيق بشير ويصل لآلاف الطلاب.' },
];

const perks = [
  { icon: '🏅', title: 'الاعتراف', desc: 'اسمك في التطبيق على كل درس تبنيه.' },
  { icon: '🎓', title: 'الأثر',    desc: 'محتواك يصل لطلاب في كل مكان — حتى بعد سنوات.' },
  { icon: '🛠️', title: 'الأدوات', desc: 'أداة تحرير مبنية خصيصاً لهذا الهدف — سهلة وسريعة.' },
];

export default function NafeerSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.nafeer-header',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.nafeer-header', start: 'top 90%', once: true } }
      );
      gsap.fromTo('.nafeer-step',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.nafeer-steps', start: 'top 90%', once: true } }
      );
      gsap.fromTo('.nafeer-perk',
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.nafeer-perks', start: 'top 90%', once: true } }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="ember-line max-w-6xl mx-auto mb-16 sm:mb-24 opacity-40" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none" style={{ opacity: 0.02 }}>
        <span className="text-[30vw] font-arabic font-bold leading-none" style={{ color: 'var(--text-primary)' }}>نفير</span>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="nafeer-header mb-14 sm:mb-20 max-w-2xl">
          <span className="inline-block text-sm tracking-widest uppercase mb-4 font-mono" style={{ color: 'var(--accent)' }}>
            النفير — المساهمون
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-5 sm:mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
            معاً نبني ما يستحقه
            <span style={{ color: 'var(--accent)' }}> الطالب السوداني</span>
          </h2>
          <p className="text-base sm:text-lg leading-loose" style={{ color: 'var(--text-secondary)' }}>
            النفير هو مفهوم تعاون جماعي في ثقافتنا — الكل يُساهم بما يقدر عليه لصالح الجميع.
            هكذا نبني بشير: كل خبير يرسم مادته، وكل طالب يستفيد.
          </p>
        </div>

        {/* Steps */}
        <div className="nafeer-steps grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-14 sm:mb-20">
          {steps.map((step, i) => (
            <div key={i} className="nafeer-step relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-0 w-full h-px pointer-events-none"
                  style={{ background: 'linear-gradient(to left, transparent, var(--border-mid), transparent)' }} />
              )}
              <div
                className="relative p-5 sm:p-6 rounded-xl transition-all duration-300"
                style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div className="text-2xl sm:text-3xl font-bold font-mono mb-3 sm:mb-4" style={{ color: 'var(--accent)', opacity: 0.7 }}>{step.num}</div>
                <h3 className="text-sm sm:text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="text-xs sm:text-sm leading-loose" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Perks */}
        <div className="nafeer-perks grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {perks.map((item, i) => (
            <div key={i} className="nafeer-perk flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-2xl sm:text-3xl mt-0.5">{item.icon}</span>
              <div>
                <h4 className="font-bold mb-1 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                <p className="text-xs sm:text-sm leading-loose" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
