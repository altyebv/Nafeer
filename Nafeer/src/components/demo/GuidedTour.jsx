'use client';
import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TOUR STEPS — each step highlights a specific area of the phone UI
//
// Coordinates are within the content area (375px wide, ~551px tall):
//   y=0 = top of content area (below status bar + top bar)
//   The SVG overlay covers this region via position: absolute; inset: 0
//
// highlight: { x, y, w, h, rx } — spotlight rectangle
// tooltipPos: 'below' | 'above' — position of the tooltip card
// tooltipOffset: pixels from edge of highlight to tooltip
// ─────────────────────────────────────────────────────────────────────────────
export const TOUR_STEPS = [
  {
    tab:    'home',
    number: '١ / ٤',
    title:  'سلسلة مذاكرتك 🔥',
    desc:   'كل يوم تذاكر، تحافظ على السلسلة. الانضباط يُبنى بالعادة.',
    highlight: { x: 243, y: 8, w: 124, h: 56, rx: 14 },
    tooltipPos: 'below',
    tooltipTop: 80,
  },
  {
    tab:    'lesson',
    number: '٢ / ٤',
    title:  'درس منظّم ومهيكل 📖',
    desc:   'نصوص، معادلات عربية، أمثلة تفاعلية خطوة بخطوة — المنهج نفسه بشكل مختلف.',
    highlight: { x: 0, y: 76, w: 375, h: 220, rx: 0 },
    tooltipPos: 'below',
    tooltipTop: 308,
  },
  {
    tab:    'feed',
    number: '٣ / ٤',
    title:  'اسحب للأعلى ⬆️',
    desc:   'لقطات سريعة يومية — اسحب للأعلى للانتقال بين البطاقات. صح/خطأ تُجيب بالسحب.',
    highlight: { x: 8, y: 4, w: 359, h: 340, rx: 18 },
    tooltipPos: 'below',
    tooltipTop: 358,
  },
  {
    tab:    'profile',
    number: '٤ / ٤',
    title:  'تقدّمك أمامك دائماً 📊',
    desc:   'إحصائياتك، نشاطك الأسبوعي، وإنجازاتك في مكان واحد. هذا ملفك.',
    highlight: { x: 12, y: 80, w: 351, h: 176, rx: 14 },
    tooltipPos: 'below',
    tooltipTop: 268,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GuidedTour — renders as absolute overlay over the content area
// ─────────────────────────────────────────────────────────────────────────────
export default function GuidedTour({ stepIndex, onNext, onPrev, onSkip }) {
  const [visible, setVisible] = useState(false);
  const step    = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === TOUR_STEPS.length - 1;
  const h       = step.highlight;

  // Fade in on mount / step change
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [stepIndex]);

  return (
    <div
      style={{
        position:   'absolute',
        inset:      0,
        zIndex:     50,
        opacity:    visible ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
    >
      {/* ── 4-panel dim overlay (creates spotlight cutout) ── */}
      <DimPanel style={{ top: 0,          left: 0,         right: 0,         height: `${h.y}px`             }} />
      <DimPanel style={{ top: `${h.y}px`, left: 0,         width: `${h.x}px`, height: `${h.h}px`            }} />
      <DimPanel style={{ top: `${h.y}px`, left: `${h.x + h.w}px`, right: 0, height: `${h.h}px`            }} />
      <DimPanel style={{ top: `${h.y + h.h}px`, left: 0,  right: 0,         bottom: 0                      }} />

      {/* ── Spotlight glow border ── */}
      <div
        style={{
          position:     'absolute',
          top:          `${h.y}px`,
          left:         `${h.x}px`,
          width:        `${h.w}px`,
          height:       `${h.h}px`,
          borderRadius: `${h.rx}px`,
          border:       '2px solid rgba(212,137,30,0.75)',
          boxShadow:    '0 0 0 3px rgba(212,137,30,0.18), inset 0 0 20px rgba(212,137,30,0.06)',
          pointerEvents:'none',
          animation:    'tourPulse 2.4s ease-in-out infinite',
        }}
      />

      {/* ── Tooltip card ── */}
      <div
        style={{
          position:    'absolute',
          top:         `${step.tooltipTop}px`,
          left:        '12px',
          right:       '12px',
          background:  'var(--bg-card)',
          border:      '1px solid rgba(212,137,30,0.30)',
          borderRadius:'18px',
          padding:     '14px 16px 12px',
          boxShadow:   '0 8px 32px rgba(0,0,0,0.45)',
          zIndex:      60,
          animation:   'tourSlideUp 0.3s ease both',
        }}
        dir="rtl"
      >
        {/* Step number + progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent)',
          }}>
            {step.number}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width:      i === stepIndex ? '16px' : '5px',
                  height:     '5px',
                  borderRadius:'3px',
                  background: i <= stepIndex ? 'var(--accent)' : 'var(--border-mid)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-arabic, inherit)',
          fontSize:   '14px',
          fontWeight: 700,
          color:      'var(--text-primary)',
          margin:     '0 0 5px',
        }}>
          {step.title}
        </h3>

        {/* Description */}
        <p style={{
          fontFamily:  'var(--font-arabic, inherit)',
          fontSize:    '12px',
          lineHeight:  1.7,
          color:       'var(--text-secondary)',
          margin:      '0 0 12px',
        }}>
          {step.desc}
        </p>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          {/* Left side */}
          <div>
            {!isFirst && (
              <button
                onClick={onPrev}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontFamily: 'var(--font-arabic, inherit)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                ← السابق
              </button>
            )}
            {isFirst && (
              <button
                onClick={onSkip}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px 4px',
                  fontFamily: 'var(--font-arabic, inherit)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  opacity: 0.7,
                }}
              >
                تخطّ
              </button>
            )}
          </div>

          {/* Right side */}
          <button
            onClick={isLast ? onSkip : onNext}
            style={{
              background:   'var(--accent)',
              border:       'none',
              borderRadius: '10px',
              padding:      '7px 18px',
              fontFamily:   'var(--font-arabic, inherit)',
              fontSize:     '12px',
              fontWeight:   600,
              color:        '#fff',
              cursor:       'pointer',
              transition:   'opacity 0.15s',
            }}
            onMouseEnter={e => { e.target.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.target.style.opacity = '1'; }}
          >
            {isLast ? 'جرّب بنفسك ✓' : 'التالي →'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(212,137,30,0.18), inset 0 0 20px rgba(212,137,30,0.06); }
          50%       { box-shadow: 0 0 0 6px rgba(212,137,30,0.10), inset 0 0 20px rgba(212,137,30,0.04); }
        }
        @keyframes tourSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function DimPanel({ style }) {
  return (
    <div
      style={{
        position: 'absolute',
        background: 'rgba(0,0,0,0.68)',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}