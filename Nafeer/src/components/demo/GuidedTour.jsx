'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TOUR STEPS
//
// Each step targets one `tab` (drives tab switching in DemoApp).
//
// target:  a [data-tour="…"] element on the page. The spotlight is measured
//          from it, so the tour follows the layout instead of hard-coded
//          coordinates. `fixed` is used where there is no single element.
// fixed:   (W, H) => ({ x, y, w, h, rx }) — a spotlight from the overlay size.
// focusMode: true → DemoApp hides the bottom nav for this step, and the
//          tooltip floats in the middle with no spotlight.
//
// Numbering is always computed from TOTAL.
// ─────────────────────────────────────────────────────────────────────────────
export const TOUR_STEPS = [
  {
    tab:    'home',
    title:  'سلسلة مذاكرتك',
    desc:   'كل يوم تذاكر فيه، السلسلة بتكبر. والعدّاد التاني بيوريك باقي كم يوم للامتحان.',
    target: 'streak',
  },
  {
    tab:    'home',
    title:  'خطة اليوم',
    desc:   'بنختار ليك الدرس الجاي، وإنت بتكمّل من محل ما وقفت.',
    target: 'focus',
  },
  {
    tab:       'lesson',
    focusMode: true,
    title:     'الدرس بملء الشاشة',
    desc:      'ما في أزرار ولا شريط تنقل. الصفحة ليك والدرس بس، والشريط بيرجع لمن تسحب لفوق.',
  },
  {
    tab:   'lesson',
    title: 'كل نوع له علامته',
    desc:  'التعريف والقانون والمثال والتنبيه، كل واحد بعلامته على الهامش، عشان تعرف شنو جاي قبل ما تقراه.',
    fixed: (W, H) => ({ x: 8, y: 70, w: W - 16, h: Math.min(330, H - 220), rx: 10 }),
  },
  {
    tab:   'feed',
    title: 'اسحب لفوق',
    desc:  'بطاقات سريعة للمراجعة. وصح أو خطأ بتجاوبها بالسحب يمين أو شمال.',
    fixed: (W, H) => ({ x: 12, y: 70, w: W - 24, h: Math.min(320, H - 260), rx: 10 }),
  },
  {
    tab:    'profile',
    title:  'تقدّمك قدّامك',
    desc:   'كرّاسك فيه سلسلتك ومستواك ونشاط الأسبوع، وبعدها الأختام اللي أخدتها.',
    target: 'record',
  },
];

const TOTAL         = TOUR_STEPS.length;
const TOOLTIP_H_EST = 190;   // estimated tooltip height, for placing it above
const TOOLTIP_MX    = 12;    // left/right margin
const PAD           = 6;     // breathing room around a measured target

// ─────────────────────────────────────────────────────────────────────────────
// GuidedTour — a dimmed page with one lit window and a plain tooltip
// ─────────────────────────────────────────────────────────────────────────────
export default function GuidedTour({ stepIndex, onNext, onPrev, onSkip }) {
  const [visible, setVisible] = useState(false);
  const [box, setBox] = useState({ W: 375, H: 600, h: null });
  const rootRef = useRef(null);
  const step    = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === TOTAL - 1;
  const isFull  = Boolean(step.focusMode);
  const maskId  = `tour-mask-${stepIndex}`;

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [stepIndex]);

  // Measure the lit window once the page behind has settled on this step's tab.
  useLayoutEffect(() => {
    function measure() {
      const root = rootRef.current;
      if (!root) return;
      const R = root.getBoundingClientRect();
      const W = R.width, H = R.height;
      let h = null;
      if (!isFull) {
        if (step.target) {
          const el = root.parentElement?.querySelector(`[data-tour="${step.target}"]`);
          if (el) {
            const r = el.getBoundingClientRect();
            h = {
              x: Math.max(4, r.left - R.left - PAD), y: Math.max(4, r.top - R.top - PAD),
              w: Math.min(W - 8, r.width + PAD * 2), h: r.height + PAD * 2, rx: 10,
            };
          }
        }
        if (!h && step.fixed) h = step.fixed(W, H);
        if (!h) h = { x: 12, y: 80, w: W - 24, h: 200, rx: 10 };
      }
      setBox({ W, H, h });
    }
    const t1 = setTimeout(measure, 40);
    const t2 = setTimeout(measure, 320);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', measure); };
  }, [stepIndex, isFull, step]);

  const h = box.h;
  const below = h ? h.y + h.h + 190 < box.H : true;
  const tooltipTop = !h ? null : below ? h.y + h.h + 14 : Math.max(8, h.y - 14 - TOOLTIP_H_EST);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease',
        display: isFull ? 'flex' : undefined, alignItems: isFull ? 'center' : undefined, justifyContent: isFull ? 'center' : undefined,
      }}
    >
      {/* dim layer, with a window cut out where the target is */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 51, pointerEvents: 'none' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              {h && <rect x={h.x} y={h.y} width={h.w} height={h.h} rx={h.rx} fill="black" />}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(20,16,10,0.72)" mask={h ? `url(#${maskId})` : undefined} />
        </svg>
      </div>

      {/* block taps outside the lit window */}
      {h ? (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h.y, zIndex: 52 }} />
          <div style={{ position: 'absolute', top: h.y + h.h, left: 0, right: 0, bottom: 0, zIndex: 52 }} />
          <div style={{ position: 'absolute', top: h.y, left: 0, width: h.x, height: h.h, zIndex: 52 }} />
          <div style={{ position: 'absolute', top: h.y, left: h.x + h.w, right: 0, height: h.h, zIndex: 52 }} />
          <div style={{
            position: 'absolute', top: h.y, left: h.x, width: h.w, height: h.h, borderRadius: h.rx, zIndex: 53,
            border: '2px solid var(--b-accent)', pointerEvents: 'none', boxSizing: 'border-box',
          }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, zIndex: 52 }} />
      )}

      {(isFull || h) && (
        <TooltipCard
          step={step} stepIndex={stepIndex} isFirst={isFirst} isLast={isLast} isFull={isFull}
          tooltipTop={tooltipTop} onNext={onNext} onPrev={onPrev} onSkip={onSkip}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TooltipCard — a sheet of paper: step counter, title, one sentence, buttons
// ─────────────────────────────────────────────────────────────────────────────
function TooltipCard({ step, stepIndex, isFirst, isLast, isFull, tooltipTop, onNext, onPrev, onSkip }) {
  const posStyle = isFull
    ? { position: 'relative', width: `calc(100% - ${TOOLTIP_MX * 2}px)`, maxWidth: 336 }
    : { position: 'absolute', top: `${tooltipTop}px`, left: `${TOOLTIP_MX}px`, right: `${TOOLTIP_MX}px` };
  const FONT = 'var(--font-arabic)';

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-label={step.title}
      style={{
        ...posStyle, zIndex: 60, boxSizing: 'border-box',
        background: 'var(--b-surface)', border: '1px solid var(--b-rule-strong)', borderRadius: 16,
        padding: '14px 16px 14px', color: 'var(--b-ink)',
        animation: 'bshStep .25s ease both',
      }}
    >
      {/* where we are: marks, not dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ font: `700 12px/18px ${FONT}`, color: 'var(--b-ink2)' }}>
          {toArNum(stepIndex + 1)} من {toArNum(TOTAL)}
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {TOUR_STEPS.map((_, i) => (
            <span key={i} style={{
              width: i === stepIndex ? 20 : 8, height: 4, borderRadius: 4, transition: 'width .2s',
              background: i <= stepIndex ? 'var(--b-ink)' : 'var(--b-rule-strong)',
            }} />
          ))}
        </div>
      </div>

      <h3 style={{ margin: '0 0 4px', font: `800 16px/24px ${FONT}`, textAlign: 'right' }}>{step.title}</h3>
      <p style={{ margin: '0 0 14px', font: `500 14px/24px ${FONT}`, color: 'var(--b-ink2)', textAlign: 'right' }}>{step.desc}</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {!isFirst ? (
          <button onClick={onPrev} style={{
            minHeight: 44, padding: '0 14px', background: 'none', border: '1px solid var(--b-rule-strong)', borderRadius: 10,
            font: `700 12px/18px ${FONT}`, color: 'var(--b-ink)', cursor: 'pointer',
          }}>السابق</button>
        ) : (
          <button onClick={onSkip} style={{
            minHeight: 44, padding: '0 8px', background: 'none', border: 0, font: `700 12px/18px ${FONT}`, color: 'var(--b-ink2)', cursor: 'pointer',
          }}>تخطّ</button>
        )}
        <button onClick={isLast ? onSkip : onNext} style={{
          minHeight: 44, padding: '0 28px', background: 'var(--b-accent)', color: 'var(--b-on-accent)', border: 0, borderRadius: 10,
          font: `800 14px/22px ${FONT}`, cursor: 'pointer',
        }}>
          {isLast ? 'جرّب بنفسك' : 'التالي'}
        </button>
      </div>
    </div>
  );
}

function toArNum(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}
