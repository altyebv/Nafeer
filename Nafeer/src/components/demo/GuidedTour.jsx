'use client';
import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TOUR STEPS
//
// Each step targets one `tab` (drives tab switching in DemoApp).
// highlight: { x, y, w, h, rx } — spotlight rectangle within content area
//   y=0 is top of content area (below status bar + app top bar ~80px total)
//   Content area is 375px wide × ~553px tall on desktop
//
// tooltipSide: 'below' | 'above' | 'center'
//   'center' → no arrow, tooltip floats in the middle (used for focus-mode step)
// tooltipOffset: gap in px between highlight edge and tooltip card
//
// focusMode: true → DemoApp will hide the top bar + bottom nav for this step
//
// Add new steps freely — numbering is always computed automatically from TOTAL.
// ─────────────────────────────────────────────────────────────────────────────
export const TOUR_STEPS = [
  // ── 1. Streak widget on home ──────────────────────────────────────────────
  {
    tab:           'home',
    title:         'سلسلة مذاكرتك 🔥',
    desc:          'كل يوم تذاكر، تحافظ على السلسلة. الانضباط يُبنى بالعادة لا بالإرادة.',
    highlight:     { x: 5, y: 8, w: 90, h: 70, rx: 25 },
    tooltipSide:   'below',
    tooltipOffset: 14,
  },

  {
    tab:           'home',
    title:         'ترشيح اليوم 📌',
    desc:          'نِظام ترشيح يومي ذكي — يختار لك أفضل درس للمراجعة كل يوم بناءً على نشاطك وأدائك.',
    highlight:     { x: 12, y: 265, w: 351, h: 170, rx: 20 },
    tooltipSide:   'above',
    tooltipOffset: 14,
  },

  // ── 2. Focus mode — lesson runs fullscreen ────────────────────────────────
  {
    tab:           'lesson',
    focusMode:     true,    // DemoApp hides top bar + bottom nav for this step
    title:         'وضع التركيز الكامل 🎯',
    desc:          'تم تصميم شاشة الدرس لتكون خالية من المشتتات — لا أزرار، لا عداد تقدم، لا شريط تنقل. فقط أنت والمحتوى.',
    highlight:     { x: 0, y: 0, w: 375, h: 553, rx: 0 },
    tooltipSide:   'center',
    tooltipOffset: 0,
  },

  // ── 3. Lesson content blocks ──────────────────────────────────────────────
  {
    tab:           'lesson',
    focusMode:     false,   // restore top bar so highlight makes sense
    title:         'درس منظّم ومهيكل 📖',
    desc:          'نصوص، معادلات، جداول، صور، أمثلة تفاعلية — المنهج نفسه بأسلوب مختلف تماماً.',
    highlight:     { x: 8, y: 76, w: 359, h: 210, rx: 14 },
    tooltipSide:   'below',
    tooltipOffset: 12,
  },

  // ── 4. Feed ───────────────────────────────────────────────────────────────
  {
    tab:           'feed',
    title:         'اسحب للأعلى ⬆️',
    desc:          'لقطات سريعة يومية — اسحب للأعلى بين البطاقات. صح/خطأ تُجيب بالسحب يميناً أو يساراً.',
    highlight:     { x: 12, y: 8, w: 351, h: 300, rx: 20 },
    tooltipSide:   'below',
    tooltipOffset: 14,
  },

  // ── 5. Profile ────────────────────────────────────────────────────────────
  {
    tab:           'profile',
    title:         'تقدّمك أمامك دائماً 📊',
    desc:          'إحصائياتك، نشاطك الأسبوعي، وإنجازاتك — كلها في مكان واحد. هذا ملفك الشخصي.',
    highlight:     { x: 12, y: 72, w: 351, h: 160, rx: 14 },
    tooltipSide:   'above',
    tooltipOffset: 14,
  },
];

const TOTAL         = TOUR_STEPS.length;
const TOOLTIP_H_EST = 160;   // estimated tooltip height for 'above' placement
const TOOLTIP_MX    = 12;    // left/right margin

// ─────────────────────────────────────────────────────────────────────────────
// GuidedTour — SVG-mask overlay with smart tooltip placement
// ─────────────────────────────────────────────────────────────────────────────
export default function GuidedTour({ stepIndex, onNext, onPrev, onSkip }) {
  const [visible, setVisible] = useState(false);
  const step    = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === TOTAL - 1;
  const h       = step.highlight;
  const maskId  = `tour-mask-${stepIndex}`;
  const isFull  = step.tooltipSide === 'center';

  const tooltipTop = isFull ? null
    : step.tooltipSide === 'below'
      ? h.y + h.h + step.tooltipOffset
      : h.y - step.tooltipOffset - TOOLTIP_H_EST;

  const arrowPointsUp = step.tooltipSide === 'below';

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [stepIndex]);

  return (
    <div
      style={{
        position:       'absolute',
        inset:          0,
        zIndex:         50,
        opacity:        visible ? 1 : 0,
        transition:     'opacity 0.25s ease',
        display:        isFull ? 'flex' : undefined,
        alignItems:     isFull ? 'center' : undefined,
        justifyContent: isFull ? 'center' : undefined,
      }}
    >
      {/* ── Dim layer ── */}
      <div style={{ position:'absolute', inset:0, zIndex:51, pointerEvents:'none' }}>
        <svg
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              {!isFull && <rect x={h.x} y={h.y} width={h.w} height={h.h} rx={h.rx} fill="black" />}
            </mask>
          </defs>
          <rect
            width="100%" height="100%"
            fill={isFull ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0.76)'}
            mask={isFull ? undefined : `url(#${maskId})`}
          />
        </svg>
      </div>

      {/* ── Click-blocking rects ── */}
      {!isFull && (
        <>
          <div style={{ position:'absolute', top:0,         left:0,       right:0,       height:h.y,  zIndex:52, cursor:'default' }} />
          <div style={{ position:'absolute', top:h.y+h.h,   left:0,       right:0,       bottom:0,    zIndex:52, cursor:'default' }} />
          <div style={{ position:'absolute', top:h.y,       left:0,       width:h.x,     height:h.h,  zIndex:52, cursor:'default' }} />
          <div style={{ position:'absolute', top:h.y,       left:h.x+h.w, right:0,       height:h.h,  zIndex:52, cursor:'default' }} />
        </>
      )}
      {isFull && <div style={{ position:'absolute', inset:0, zIndex:52, cursor:'default' }} />}

      {/* ── Spotlight border ── */}
      {!isFull && (
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
      )}

      {/* ── Corner accents ── */}
      {!isFull && <CornerAccents h={h} />}

      {/* ── Tooltip card ── */}
      <TooltipCard
        step={step}
        stepIndex={stepIndex}
        isFirst={isFirst}
        isLast={isLast}
        isFull={isFull}
        tooltipTop={tooltipTop}
        arrowPointsUp={arrowPointsUp}
        onNext={onNext}
        onPrev={onPrev}
        onSkip={onSkip}
      />

      <style>{`
        @keyframes tourPulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(212,137,30,0.10), inset 0 0 20px rgba(212,137,30,0.05); }
          50%      { box-shadow: 0 0 0 8px rgba(212,137,30,0.04), inset 0 0 20px rgba(212,137,30,0.02); }
        }
        @keyframes tourSlideUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes tourPop {
          from { opacity:0; transform:scale(0.94); }
          to   { opacity:1; transform:scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TooltipCard
// ─────────────────────────────────────────────────────────────────────────────
function TooltipCard({ step, stepIndex, isFirst, isLast, isFull, tooltipTop, arrowPointsUp, onNext, onPrev, onSkip }) {
  const posStyle = isFull
    ? { position: 'relative', width: `calc(100% - ${TOOLTIP_MX * 2}px)`, maxWidth: 316 }
    : { position: 'absolute', top: `${tooltipTop}px`, left: `${TOOLTIP_MX}px`, right: `${TOOLTIP_MX}px` };

  return (
    <div
      style={{
        ...posStyle,
        background:   'var(--bg-card)',
        border:       '1px solid rgba(212,137,30,0.28)',
        borderRadius: '20px',
        padding:      '15px 16px 13px',
        boxShadow:    '0 16px 48px rgba(0,0,0,0.60), 0 2px 8px rgba(0,0,0,0.35)',
        zIndex:       60,
        animation:    isFull ? 'tourPop 0.35s ease both' : 'tourSlideUp 0.3s ease both',
      }}
      dir="rtl"
    >
      {/* Caret arrow */}
      {!isFull && (
        arrowPointsUp ? (
          <div style={{
            position:'absolute', top:'-9px', left:'50%', transform:'translateX(-50%)',
            width:0, height:0,
            borderLeft:'9px solid transparent', borderRight:'9px solid transparent',
            borderBottom:'9px solid var(--bg-card)',
            filter:'drop-shadow(0 -1px 0 rgba(212,137,30,0.18))',
          }} />
        ) : (
          <div style={{
            position:'absolute', bottom:'-9px', left:'50%', transform:'translateX(-50%)',
            width:0, height:0,
            borderLeft:'9px solid transparent', borderRight:'9px solid transparent',
            borderTop:'9px solid var(--bg-card)',
            filter:'drop-shadow(0 1px 0 rgba(212,137,30,0.18))',
          }} />
        )
      )}

      {/* Step counter + progress pills */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{
          fontFamily:'monospace', fontSize:10, fontWeight:700,
          color:'var(--accent)', opacity:0.75, letterSpacing:'0.04em',
        }}>
          {toArNum(stepIndex + 1)}&thinsp;/&thinsp;{toArNum(TOTAL)}
        </span>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width:        i === stepIndex ? '20px' : '5px',
                height:       '5px',
                borderRadius: '3px',
                background:   i <= stepIndex ? 'var(--accent)' : 'var(--border-mid)',
                opacity:      i < stepIndex ? 0.38 : 1,
                transition:   'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Focus-mode icon */}
      {isFull && (
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <div style={{
            width:48, height:48, borderRadius:'50%',
            background:'rgba(212,137,30,0.12)',
            border:'1.5px solid rgba(212,137,30,0.28)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22,
          }}>
            🎯
          </div>
        </div>
      )}

      <h3 style={{
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize:   isFull ? '15px' : '14px',
        fontWeight: 700,
        color:      'var(--text-primary)',
        margin:     '0 0 6px',
        lineHeight: 1.4,
        textAlign:  isFull ? 'center' : 'right',
      }}>
        {step.title}
      </h3>

      <p style={{
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize:   '12px',
        lineHeight: 1.8,
        color:      'var(--text-secondary)',
        margin:     '0 0 14px',
        textAlign:  isFull ? 'center' : 'right',
      }}>
        {step.desc}
      </p>

      {/* Navigation row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div>
          {!isFirst ? (
            <button
              onClick={onPrev}
              style={{
                background:'none', border:'1px solid var(--border-mid)',
                borderRadius:10, padding:'7px 13px',
                fontFamily:'var(--font-arabic, inherit)', fontSize:12,
                color:'var(--text-muted)', cursor:'pointer', transition:'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.65'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >
              ← السابق
            </button>
          ) : (
            <button
              onClick={onSkip}
              style={{
                background:'none', border:'none', padding:'7px 6px',
                fontFamily:'var(--font-arabic, inherit)', fontSize:12,
                color:'var(--text-muted)', cursor:'pointer', opacity:0.5,
              }}
            >
              تخطّ
            </button>
          )}
        </div>

        <button
          onClick={isLast ? onSkip : onNext}
          onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}
          style={{
            background:  'var(--accent)', border:'none', borderRadius:10,
            padding:     '8px 24px',
            fontFamily:  'var(--font-arabic, inherit)', fontSize:12, fontWeight:700,
            color:       '#fff', cursor:'pointer', transition:'opacity 0.15s',
            boxShadow:   '0 3px 14px rgba(212,137,30,0.35)',
          }}
        >
          {isLast ? 'جرّب بنفسك ✓' : 'التالي →'}
        </button>
      </div>
    </div>
  );
}

function toArNum(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// ─────────────────────────────────────────────────────────────────────────────
// CornerAccents
// ─────────────────────────────────────────────────────────────────────────────
function CornerAccents({ h }) {
  const size   = 10;
  const weight = 2;
  const color  = 'rgba(212,137,30,0.90)';
  const r      = Math.min(h.rx, 8);
  const st     = { position:'absolute', pointerEvents:'none', zIndex:54 };

  return (
    <>
      <div style={{ ...st, top: h.y-1, left: h.x-1 }}>
        <svg width={size+r} height={size+r} viewBox={`0 0 ${size+r} ${size+r}`}>
          <path d={`M${size+r} ${weight/2} H${r} Q${weight/2} ${weight/2} ${weight/2} ${r} V${size+r}`}
            fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ ...st, top: h.y-1, left: h.x+h.w-size-r+1 }}>
        <svg width={size+r} height={size+r} viewBox={`0 0 ${size+r} ${size+r}`}>
          <path d={`M0 ${weight/2} H${size} Q${size+r-weight/2} ${weight/2} ${size+r-weight/2} ${r} V${size+r}`}
            fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ ...st, top: h.y+h.h-size-r+1, left: h.x-1 }}>
        <svg width={size+r} height={size+r} viewBox={`0 0 ${size+r} ${size+r}`}>
          <path d={`M${weight/2} 0 V${size} Q${weight/2} ${size+r-weight/2} ${r} ${size+r-weight/2} H${size+r}`}
            fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ ...st, top: h.y+h.h-size-r+1, left: h.x+h.w-size-r+1 }}>
        <svg width={size+r} height={size+r} viewBox={`0 0 ${size+r} ${size+r}`}>
          <path d={`M0 ${size+r-weight/2} H${size} Q${size+r-weight/2} ${size+r-weight/2} ${size+r-weight/2} ${size} V0`}
            fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round"/>
        </svg>
      </div>
    </>
  );
}