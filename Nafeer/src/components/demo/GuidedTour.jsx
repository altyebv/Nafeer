'use client';
import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TOUR STEPS
//
// Coordinates are within the content area (375 × ~553px on desktop):
//   y = 0  →  top of content area (below status bar + app top bar)
//   x = 0  →  left edge
//
// highlight: { x, y, w, h, rx }  — spotlight rectangle
// tooltipSide: 'below' | 'above' — which side the tooltip card sits on
// tooltipOffset: px gap between highlight edge and tooltip card
// ─────────────────────────────────────────────────────────────────────────────
export const TOUR_STEPS = [
  {
    tab:          'home',
    number:       '١ / ٤',
    title:        'سلسلة مذاكرتك 🔥',
    desc:         'كل يوم تذاكر، تحافظ على السلسلة. الانضباط يُبنى بالعادة لا بالإرادة.',
    highlight:    { x: 228, y: 12, w: 140, h: 60, rx: 16 },
    tooltipSide:  'below',
    tooltipOffset: 14,
  },
  {
    tab:          'lesson',
    number:       '٢ / ٤',
    title:        'درس منظّم ومهيكل 📖',
    desc:         'نصوص، معادلات، جداول، صور، أمثلة تفاعلية — المنهج نفسه بأسلوب مختلف تماماً.',
    highlight:    { x: 8, y: 68, w: 359, h: 200, rx: 14 },
    tooltipSide:  'below',
    tooltipOffset: 14,
  },
  {
    tab:          'feed',
    number:       '٣ / ٤',
    title:        'اسحب للأعلى ⬆️',
    desc:         'لقطات سريعة يومية — اسحب للأعلى بين البطاقات. صح/خطأ تُجيب بالسحب يميناً أو يساراً.',
    highlight:    { x: 12, y: 8, w: 351, h: 300, rx: 20 },
    tooltipSide:  'below',
    tooltipOffset: 14,
  },
  {
    tab:          'profile',
    number:       '٤ / ٤',
    title:        'تقدّمك أمامك دائماً 📊',
    desc:         'إحصائياتك، نشاطك الأسبوعي، وإنجازاتك — كلها في مكان واحد. هذا ملفك الشخصي.',
    highlight:    { x: 12, y: 72, w: 351, h: 160, rx: 14 },
    tooltipSide:  'above',
    tooltipOffset: 14,
  },
];

const TOOLTIP_HEIGHT_ESTIMATE = 148; // px — used for 'above' placement
const TOOLTIP_H_PADDING = 12;        // left/right margin

// ─────────────────────────────────────────────────────────────────────────────
// GuidedTour — SVG-mask overlay with smart tooltip placement
// ─────────────────────────────────────────────────────────────────────────────
export default function GuidedTour({ stepIndex, onNext, onPrev, onSkip }) {
  const [visible, setVisible] = useState(false);
  const step    = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === TOUR_STEPS.length - 1;
  const h       = step.highlight;
  const maskId  = `tour-mask-${stepIndex}`;

  // Tooltip position
  const tooltipTop = step.tooltipSide === 'below'
    ? h.y + h.h + step.tooltipOffset
    : h.y - step.tooltipOffset - TOOLTIP_HEIGHT_ESTIMATE;

  // Arrow direction — point toward the highlight
  const arrowPointsUp = step.tooltipSide === 'below'; // tooltip is below → arrow points up (at top of card)

  // Fade in on step change
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
      {/* ── Dim layer: blocks all pointer events except the spotlight and tooltip ── */}
      <div
        style={{
          position:      'absolute',
          inset:         0,
          zIndex:        51,
          pointerEvents: 'none',
        }}
      >
        {/* SVG mask — dim with cutout */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              <rect x={h.x} y={h.y} width={h.w} height={h.h} rx={h.rx} fill="black" />
            </mask>
          </defs>
          <rect
            width="100%" height="100%"
            fill="rgba(0,0,0,0.76)"
            mask={`url(#${maskId})`}
          />
        </svg>
      </div>

      {/* ── Clickable dim regions — four rects around the spotlight that eat clicks ── */}
      {/* Top */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height: h.y, zIndex:52, cursor:'default' }} />
      {/* Bottom */}
      <div style={{ position:'absolute', top: h.y+h.h, left:0, right:0, bottom:0, zIndex:52, cursor:'default' }} />
      {/* Left */}
      <div style={{ position:'absolute', top: h.y, left:0, width: h.x, height: h.h, zIndex:52, cursor:'default' }} />
      {/* Right */}
      <div style={{ position:'absolute', top: h.y, left: h.x+h.w, right:0, height: h.h, zIndex:52, cursor:'default' }} />

      {/* ── Spotlight border (amber pulse) ── */}
      <div
        style={{
          position:     'absolute',
          top:          `${h.y}px`,
          left:         `${h.x}px`,
          width:        `${h.w}px`,
          height:       `${h.h}px`,
          borderRadius: `${h.rx}px`,
          border:       '1.5px solid rgba(212,137,30,0.80)',
          boxShadow:    '0 0 0 3px rgba(212,137,30,0.10), inset 0 0 20px rgba(212,137,30,0.05)',
          pointerEvents:'none',
          zIndex:       53,
          animation:    'tourPulse 2.4s ease-in-out infinite',
        }}
      />

      {/* ── Corner accent marks ── */}
      <CornerAccents h={h} />

      {/* ── Tooltip card ── */}
      <div
        style={{
          position:     'absolute',
          top:          `${tooltipTop}px`,
          left:         `${TOOLTIP_H_PADDING}px`,
          right:        `${TOOLTIP_H_PADDING}px`,
          background:   'var(--bg-card)',
          border:       '1px solid rgba(212,137,30,0.28)',
          borderRadius: '20px',
          padding:      '14px 16px 12px',
          boxShadow:    '0 12px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
          zIndex:       60,
          animation:    'tourSlideUp 0.3s ease both',
        }}
        dir="rtl"
      >
        {/* Arrow caret */}
        {arrowPointsUp ? (
          // Arrow pointing up — tooltip is below highlight
          <div style={{
            position:    'absolute',
            top:         '-9px',
            left:        '50%',
            transform:   'translateX(-50%)',
            width:        0,
            height:       0,
            borderLeft:  '9px solid transparent',
            borderRight: '9px solid transparent',
            borderBottom: '9px solid var(--bg-card)',
            filter:      'drop-shadow(0 -1px 0 rgba(212,137,30,0.20))',
          }} />
        ) : (
          // Arrow pointing down — tooltip is above highlight
          <div style={{
            position:    'absolute',
            bottom:      '-9px',
            left:        '50%',
            transform:   'translateX(-50%)',
            width:        0,
            height:       0,
            borderLeft:  '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop:   '9px solid var(--bg-card)',
            filter:      'drop-shadow(0 1px 0 rgba(212,137,30,0.20))',
          }} />
        )}

        {/* Step number + progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.02em' }}>
            {step.number}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width:        i === stepIndex ? '18px' : '5px',
                  height:       '5px',
                  borderRadius: '3px',
                  background:   i < stepIndex
                    ? 'var(--accent)'
                    : i === stepIndex
                    ? 'var(--accent)'
                    : 'var(--border-mid)',
                  opacity:      i < stepIndex ? 0.45 : 1,
                  transition:   'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        <h3 style={{
          fontFamily: 'var(--font-arabic, inherit)', fontSize: '14px',
          fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 5px',
          lineHeight: 1.4,
        }}>
          {step.title}
        </h3>

        <p style={{
          fontFamily: 'var(--font-arabic, inherit)', fontSize: '12px',
          lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 12px',
        }}>
          {step.desc}
        </p>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            {!isFirst ? (
              <button
                onClick={onPrev}
                style={{
                  background: 'none', border: '1px solid var(--border-mid)', borderRadius: '10px',
                  padding: '6px 12px', fontFamily: 'var(--font-arabic, inherit)',
                  fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                ← السابق
              </button>
            ) : (
              <button
                onClick={onSkip}
                style={{
                  background: 'none', border: 'none', padding: '6px 4px',
                  fontFamily: 'var(--font-arabic, inherit)', fontSize: '12px',
                  color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.65,
                }}
              >
                تخطّ
              </button>
            )}
          </div>

          <button
            onClick={isLast ? onSkip : onNext}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            style={{
              background: 'var(--accent)', border: 'none', borderRadius: '10px',
              padding: '7px 22px', fontFamily: 'var(--font-arabic, inherit)',
              fontSize: '12px', fontWeight: 700, color: '#fff',
              cursor: 'pointer', transition: 'opacity 0.15s',
              boxShadow: '0 3px 12px rgba(212,137,30,0.30)',
            }}
          >
            {isLast ? 'جرّب بنفسك ✓' : 'التالي →'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(212,137,30,0.10), inset 0 0 20px rgba(212,137,30,0.05); }
          50%       { box-shadow: 0 0 0 7px rgba(212,137,30,0.05), inset 0 0 20px rgba(212,137,30,0.02); }
        }
        @keyframes tourSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CornerAccents — four small L-shaped corners on the spotlight
// ─────────────────────────────────────────────────────────────────────────────
function CornerAccents({ h }) {
  const size   = 10;
  const weight = 2;
  const color  = 'rgba(212,137,30,0.90)';
  const r      = Math.min(h.rx, 8);
  const style  = { position: 'absolute', pointerEvents: 'none', zIndex: 54 };

  return (
    <>
      {/* Top-left */}
      <div style={{ ...style, top: h.y - 1, left: h.x - 1 }}>
        <svg width={size + r} height={size + r} viewBox={`0 0 ${size+r} ${size+r}`}>
          <path d={`M${size+r} ${weight/2} H${r} Q${weight/2} ${weight/2} ${weight/2} ${r} V${size+r}`}
            fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round"/>
        </svg>
      </div>
      {/* Top-right */}
      <div style={{ ...style, top: h.y - 1, left: h.x + h.w - size - r + 1 }}>
        <svg width={size + r} height={size + r} viewBox={`0 0 ${size+r} ${size+r}`}>
          <path d={`M0 ${weight/2} H${size} Q${size+r-weight/2} ${weight/2} ${size+r-weight/2} ${r} V${size+r}`}
            fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round"/>
        </svg>
      </div>
      {/* Bottom-left */}
      <div style={{ ...style, top: h.y + h.h - size - r + 1, left: h.x - 1 }}>
        <svg width={size + r} height={size + r} viewBox={`0 0 ${size+r} ${size+r}`}>
          <path d={`M${weight/2} 0 V${size} Q${weight/2} ${size+r-weight/2} ${r} ${size+r-weight/2} H${size+r}`}
            fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round"/>
        </svg>
      </div>
      {/* Bottom-right */}
      <div style={{ ...style, top: h.y + h.h - size - r + 1, left: h.x + h.w - size - r + 1 }}>
        <svg width={size + r} height={size + r} viewBox={`0 0 ${size+r} ${size+r}`}>
          <path d={`M0 ${size+r-weight/2} H${size} Q${size+r-weight/2} ${size+r-weight/2} ${size+r-weight/2} ${size} V0`}
            fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round"/>
        </svg>
      </div>
    </>
  );
}