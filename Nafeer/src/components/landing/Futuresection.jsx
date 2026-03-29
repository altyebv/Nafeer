'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const roadmap = [
  { label: 'دعم اللغات السودانية المحلية',  status: 'قريباً' },
  { label: 'وضع الامتحان التجريبي الكامل',   status: 'قريباً' },
  { label: 'تحليل نقاط ضعف الطالب تلقائياً', status: 'مستقبلاً' },
  { label: 'أدوات متابعة لأولياء الأمور',    status: 'مستقبلاً' },
];

export default function FutureSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.future-content',
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.95, ease: 'power3.out',
          scrollTrigger: { trigger: '.future-content', start: 'top 88%', once: true },
        }
      );
      gsap.fromTo('.future-item',
        { opacity: 0, x: 20 },
        {
          opacity: 1, x: 0, duration: 0.55, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.future-items', start: 'top 90%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="future"
      className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden"
    >
      <div className="ember-line max-w-6xl mx-auto mb-16 sm:mb-20 opacity-40" />

      <div className="max-w-6xl mx-auto">
        <div
          className="future-content relative rounded-3xl overflow-hidden p-10 sm:p-16"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(212,137,30,0.15)',
          }}
        >
          {/* Ambient layers */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(212,137,30,0.06) 0%, transparent 70%)' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 50% 60% at 80% 20%, rgba(234,108,10,0.04) 0%, transparent 70%)' }}
          />

          {/* Watermark */}
          <div
            className="absolute left-0 bottom-0 pointer-events-none select-none"
            style={{ opacity: 0.025 }}
          >
            <span
              className="text-[18vw] font-arabic font-bold leading-none"
              style={{ color: 'var(--text-primary)' }}
            >
              غداً
            </span>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start gap-12 lg:gap-20">

            {/* Left: The vision */}
            <div className="flex-1">
              <span
                className="inline-block text-xs sm:text-sm font-mono tracking-widest uppercase mb-5"
                style={{ color: 'var(--accent)' }}
              >
                إلى أين نذهب
              </span>

              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold leading-snug mb-6"
                style={{ color: 'var(--text-primary)' }}
              >
                الشهادة السودانية
                <br />
                لا تحتاج تعذراً.
                <br />
                <span style={{ color: 'var(--accent)' }}>تحتاج أدوات.</span>
              </h2>

              <div
                className="space-y-4 text-base leading-loose font-arabic"
                style={{ color: 'var(--text-secondary)' }}
              >
                <p>
                  بشير اليوم مشروع ناشئ بُني بيد واحدة. في المستقبل،
                  سيكون منصة مجتمعية تجمع مئات المساهمين من المعلمين
                  والطلاب والمتطوعين من كل أنحاء السودان والمهجر.
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                  لكن ذلك يبدأ اليوم — بمساهم واحد، ودرس واحد.
                </p>
              </div>
            </div>

            {/* Right: Roadmap */}
            <div className="lg:w-72 shrink-0">
              <p
                className="text-xs font-mono mb-5 tracking-widest uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                على الطريق
              </p>

              <div className="future-items space-y-3">
                {roadmap.map((item, i) => (
                  <div
                    key={i}
                    className="future-item flex items-center justify-between gap-4 py-3 px-4 rounded-xl"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span
                      className="text-sm font-arabic leading-snug"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full shrink-0"
                      style={
                        item.status === 'قريباً'
                          ? {
                              background: 'rgba(212,137,30,0.12)',
                              border: '1px solid rgba(212,137,30,0.25)',
                              color: 'var(--accent)',
                            }
                          : {
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)',
                            }
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Open source note */}
              <div
                className="mt-6 pt-5 flex items-start gap-3"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: '#22c55e' }}
                />
                <p
                  className="text-xs leading-relaxed font-arabic"
                  style={{ color: 'var(--text-muted)' }}
                >
                  بشير مفتوح المصدر، مجاني الآن وللأبد. القرار ليس تكتيكاً — هو مبدأ.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}