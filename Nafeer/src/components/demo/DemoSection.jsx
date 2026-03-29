'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LessonScreen from './screens/LessonScreen';
import FeedScreen   from './screens/FeedScreen';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────────────────────
// TAB DEFINITIONS
// Add or reorder screens here — no other file needs to change.
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  {
    id: 'lesson',
    labelAr: 'درس',
    labelEn: 'Lesson',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <line x1="7" y1="8"  x2="17" y2="8"/>
        <line x1="7" y1="12" x2="14" y2="12"/>
        <line x1="7" y1="16" x2="11" y2="16"/>
      </svg>
    ),
  },
  {
    id: 'feed',
    labelAr: 'لقطات',
    labelEn: 'Feed',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth="1.8">
        <path d="M4 6h16M4 10h10M4 14h13M4 18h8"/>
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DemoSection
// Landing page section wrapper. On mobile: full-width, looks like the real app.
// On desktop: constrained to 420px, centered, with a phone-shell border.
// ─────────────────────────────────────────────────────────────────────────────

export default function DemoSection() {
  const [activeTab, setActiveTab] = useState('lesson');
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.demo-eyebrow',
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.demo-eyebrow', start: 'top 88%', once: true },
        }
      );
      gsap.fromTo('.demo-heading',
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', delay: 0.08,
          scrollTrigger: { trigger: '.demo-heading', start: 'top 88%', once: true },
        }
      );
      gsap.fromTo('.demo-shell',
        { opacity: 0, y: 36, scale: 0.98 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', delay: 0.16,
          scrollTrigger: { trigger: '.demo-shell', start: 'top 88%', once: true },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  function handleTabChange(id) {
    if (id === activeTab) return;
    setActiveTab(id);
  }

  return (
    <section
      id="demo"
      ref={sectionRef}
      className="py-16 sm:py-24 px-4 sm:px-6 relative"
      dir="rtl"
    >
      {/* Ambient ember line */}
      <div className="ember-line max-w-6xl mx-auto mb-12 sm:mb-16 opacity-40" />

      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <div className="mb-10 sm:mb-14">
          <span
            className="demo-eyebrow inline-block text-xs sm:text-sm font-mono tracking-widest uppercase mb-4"
            style={{ color: 'var(--accent)' }}
          >
            جرّب الآن
          </span>

          <h2
            className="demo-heading font-arabic text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            بشير في يدك،<br />
            <span style={{ color: 'var(--accent)' }}>قبل أن يصل</span>
          </h2>

          <p
            className="demo-heading font-arabic text-base sm:text-lg mt-4 max-w-xl leading-loose"
            style={{ color: 'var(--text-secondary)' }}
          >
            هذه معاينة حقيقية للتجربة. اقرأ درساً مُهيكلاً أو تصفّح لقطات المعرفة — كما ستظهر في التطبيق تماماً.
          </p>
        </div>

        {/* Two-column layout on desktop: shell on left, description on right */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

          {/* Phone shell */}
          <div className="demo-shell w-full lg:w-auto lg:flex-shrink-0 flex justify-center">
            <AppShell activeTab={activeTab} onTabChange={handleTabChange} />
          </div>

          {/* Side annotations — hidden on mobile, visible on lg */}
          <div className="hidden lg:flex flex-col gap-8 pt-4 flex-1">
            <SideAnnotation
              active={activeTab === 'lesson'}
              color="#4A90D9"
              number="٠١"
              title="دروس مُهيكلة"
              desc="محتوى مُقسَّم إلى كتل واضحة — نصوص، معادلات مُعرَّضة بـ KaTeX، صناديق تعريف وتنبيه، وأمثلة تفاعلية خطوة بخطوة."
              onClick={() => handleTabChange('lesson')}
            />
            <SideAnnotation
              active={activeTab === 'feed'}
              color="#d4891e"
              number="٠٢"
              title="لقطات المعرفة"
              desc="بطاقات يومية قصيرة — تعريفات، حقائق، وبطاقات تذكير قابلة للقلب. ثلاث دقائق تبني ما لا يبنيه يوم مذاكرة."
              onClick={() => handleTabChange('feed')}
            />

            {/* Play store badge placeholder */}
            <div
              className="mt-4 rounded-2xl p-5"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p className="font-arabic text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                قريباً على Google Play
              </p>
              <p className="font-arabic text-xs leading-loose" style={{ color: 'var(--text-muted)' }}>
                التطبيق في مراحله الأخيرة. سجّل اهتمامك لتكون أول من يحصل عليه.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for step animation */}
      <style>{`
        @keyframes demoStepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppShell
// The mock Android app container.
// Mobile: full-width, no border radius on top. Desktop: 380px pill shell.
// ─────────────────────────────────────────────────────────────────────────────

function AppShell({ activeTab, onTabChange }) {
  return (
    <div
      className="w-full sm:w-[380px] overflow-hidden flex flex-col"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-mid)',
        borderRadius: '24px',
        // Constrain height and scroll internally
        maxHeight: '620px',
        minHeight: '520px',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 32px 80px rgba(0,0,0,0.5)',
      }}
    >
      {/* Fake status bar */}
      <div
        className="flex items-center justify-between px-5 pt-3 pb-1 flex-shrink-0"
        style={{ background: 'var(--bg-primary)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
          9:41
        </span>
        <div className="flex items-center gap-1.5">
          {/* Wifi icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--text-muted)">
            <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
          </svg>
          {/* Battery icon */}
          <svg width="16" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <rect x="1" y="6" width="18" height="12" rx="2"/>
            <path d="M23 11v2"/>
            <rect x="3" y="8" width="11" height="8" rx="1" fill="var(--text-muted)" stroke="none"/>
          </svg>
        </div>
      </div>

      {/* Scrollable app content */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {activeTab === 'lesson' && <LessonScreen />}
        {activeTab === 'feed'   && <FeedScreen   />}
      </div>

      {/* Bottom tab bar */}
      <div
        className="flex-shrink-0 flex"
        style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-150
                         cursor-pointer select-none"
              style={{ background: 'none', border: 'none' }}
            >
              {tab.icon(active)}
              <span
                className="font-arabic text-xs transition-colors duration-150"
                style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {tab.labelAr}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SideAnnotation
// Desktop-only annotation cards that highlight each tab's feature.
// Clicking one switches the active tab.
// ─────────────────────────────────────────────────────────────────────────────

function SideAnnotation({ active, color, number, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-right w-full rounded-2xl p-5 transition-all duration-200 cursor-pointer"
      style={{
        background: active ? `${color}0d` : 'var(--bg-card)',
        border: `1px solid ${active ? color + '33' : 'var(--border-subtle)'}`,
        outline: 'none',
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="font-mono text-xs font-bold flex-shrink-0 mt-0.5"
          style={{ color: active ? color : 'var(--text-muted)' }}
        >
          {number}
        </span>
        <div>
          <p
            className="font-arabic text-sm font-bold mb-1.5 transition-colors"
            style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            {title}
          </p>
          <p
            className="font-arabic text-xs leading-loose"
            style={{ color: 'var(--text-muted)' }}
          >
            {desc}
          </p>
        </div>
      </div>
    </button>
  );
}
