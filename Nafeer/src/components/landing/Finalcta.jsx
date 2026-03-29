'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export default function FinalCTA() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.finalcta-eyebrow',
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.finalcta-eyebrow', start: 'top 92%', once: true },
        }
      );
      gsap.fromTo('.finalcta-panel',
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.75,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.finalcta-grid', start: 'top 90%', once: true },
        }
      );
      gsap.fromTo('.finalcta-footer',
        { opacity: 0 },
        {
          opacity: 1, duration: 0.8,
          scrollTrigger: { trigger: '.finalcta-footer', start: 'top 95%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="join"
      className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden"
    >
      <div className="ember-line max-w-6xl mx-auto mb-16 opacity-40" />

      <div className="max-w-6xl mx-auto">

        {/* Eyebrow */}
        <div className="finalcta-eyebrow text-center mb-10 sm:mb-14">
          <span
            className="inline-block text-xs sm:text-sm font-mono tracking-widest uppercase"
            style={{ color: 'var(--accent)' }}
          >
            خطوتان. مستقبل واحد.
          </span>
        </div>

        {/* Two-panel grid */}
        <div className="finalcta-grid grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-10">

          {/* ── Panel A: Students → /demo ── */}
          <div
            className="finalcta-panel relative p-8 sm:p-10 rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(20px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(59,130,246,0.05), 0 20px 50px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Ambient — cool blue */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.05) 0%, transparent 70%)' }}
            />

            <div className="relative z-10 flex items-center gap-2 mb-7">
              <span
                className="text-xs font-mono px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  color: '#60a5fa',
                }}
              >
                للطلاب
              </span>
            </div>

            <div className="relative z-10 text-5xl sm:text-6xl mb-6" style={{ lineHeight: 1 }}>📱</div>

            <div className="relative z-10 flex-1">
              <h2
                className="text-2xl sm:text-3xl font-arabic font-bold mb-3 leading-snug"
                style={{ color: 'var(--text-primary)' }}
              >
                أنت الطالب الذي
                <br />
                <span style={{ color: 'var(--accent)' }}>يستحق أكثر</span>
              </h2>
              <p
                className="text-base leading-loose mb-8 font-arabic"
                style={{ color: 'var(--text-secondary)' }}
              >
                جرّب بشير الآن — معاينة تفاعلية حقيقية قبل الإطلاق على Play Store.
              </p>
            </div>

            {/* ← Changed: href="/demo" instead of "#features" */}
            <Link
              href="/demo"
              className="relative z-10 inline-flex items-center justify-center gap-3 w-full py-4 font-bold rounded-xl transition-all duration-300 text-sm sm:text-base"
              style={{ background: 'var(--accent)', color: '#0e0c09', textDecoration: 'none' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--accent-hover)';
                e.currentTarget.style.boxShadow = '0 0 40px var(--glow)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>جرّب بشير الآن</span>
              <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>←</span>
            </Link>
          </div>

          {/* ── Panel B: Contributors ── */}
          <div
            className="finalcta-panel relative p-8 sm:p-10 rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(212,137,30,0.2)',
              backdropFilter: 'blur(20px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(212,137,30,0.45)';
              e.currentTarget.style.boxShadow = '0 0 50px rgba(212,137,30,0.07), 0 20px 50px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(212,137,30,0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Ambient — warm amber */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,137,30,0.09) 0%, transparent 70%)' }}
            />

            <div className="relative z-10 flex items-center gap-2 mb-7">
              <span
                className="text-xs font-mono px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(212,137,30,0.12)',
                  border: '1px solid rgba(212,137,30,0.35)',
                  color: 'var(--accent)',
                }}
              >
                للمساهمين
              </span>
            </div>

            <div className="relative z-10 text-5xl sm:text-6xl mb-6" style={{ lineHeight: 1 }}>🏗️</div>

            <div className="relative z-10 flex-1">
              <h2
                className="text-2xl sm:text-3xl font-arabic font-bold mb-3 leading-snug"
                style={{ color: 'var(--text-primary)' }}
              >
                أنت الشخص الذي
                <br />
                <span style={{ color: 'var(--accent)' }}>يغيّر هذا</span>
              </h2>
              <p
                className="text-base leading-loose mb-8 font-arabic"
                style={{ color: 'var(--text-secondary)' }}
              >
                مادة واحدة منك تصل لآلاف الطلاب — درس بعد درس.
                النفير في انتظارك.
              </p>
            </div>

            <Link
              href="/prejoin"
              className="relative z-10 inline-flex items-center justify-center gap-3 w-full py-4 font-bold rounded-xl transition-all duration-300 text-sm sm:text-base"
              style={{
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                background: 'transparent',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.color = '#0e0c09';
                e.currentTarget.style.boxShadow = '0 0 40px var(--glow)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--accent)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>انضم للنفير</span>
              <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>←</span>
            </Link>
          </div>
        </div>

        {/* Footer closing line */}
        <div
          className="finalcta-footer text-center py-6"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            مشروع مفتوح من السودان، للسودان — مجاني الآن وللأبد
          </p>
        </div>
      </div>
    </section>
  );
}
