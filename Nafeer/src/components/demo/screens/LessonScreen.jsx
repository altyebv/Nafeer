'use client';
import { useState, useEffect, useRef } from 'react';
import BlockRenderer from '../blocks/BlockRenderer';
import { MarginItem, MarginSign, ReaderColumn, Icons } from '../blocks/margin';
import { getLevel } from './HomeScreen';
import { LESSON_BY_PATH, LESSON_PATH_BY_PATH, SUBJECT_COLORS, DEMO_USER } from '../demoData';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

const lerp = (a, b, t) => a + (b - a) * t;

function arabicLessons(n) {
  if (n === 1) return 'درس واحد';
  if (n === 2) return 'درسان';
  if (n >= 3 && n <= 10) return `${toAr(n)} دروس`;
  return `${toAr(n)} درساً`;
}

function arabicMinutes(n) {
  if (n === 1) return 'دقيقة واحدة';
  if (n === 2) return 'دقيقتان';
  if (n >= 3 && n <= 10) return `${toAr(n)} دقائق`;
  return `${toAr(n)} دقيقة`;
}

const Chevron = ({ size = 18, dir = 'left' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'right' ? 'scaleX(-1)' : 'none' }}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// LessonScreen — the Lessons page, and the lesson itself as a pipeline:
//
//   path   → lessons on the margin line (notebook cover above)
//   entry  → a notebook page: the hook, then what the student leaves knowing
//   reader → the lesson on the margin page, full screen, free scrolling,
//            ending in an active-recall question
//   exit   → a stepped ceremony: result, streak, gains, what comes next
//
// previewMode (set by the guided tour) opens straight on the reader.
// ─────────────────────────────────────────────────────────────────────────────
export default function LessonScreen({ userPath, previewMode = false, onGoHome, setFullScreen }) {
  const lesson = LESSON_BY_PATH[userPath] || LESSON_BY_PATH.SCIENCE;
  const color  = SUBJECT_COLORS[lesson.subjectKey] || '#4A90D9';
  const units  = LESSON_PATH_BY_PATH[userPath] || LESSON_PATH_BY_PATH.SCIENCE;

  const [phase,    setPhase]    = useState(previewMode ? 'reader' : 'path');
  const [recall,   setRecall]   = useState({ right: null });
  const startRef = useRef(null);
  const [spent,    setSpent]    = useState(0);

  useEffect(() => {
    if (previewMode && phase === 'path') setPhase('reader');
  }, [previewMode, phase]);

  useEffect(() => {
    if (setFullScreen) setFullScreen(phase === 'reader' || phase === 'entry' || phase === 'exit');
    return () => { if (setFullScreen) setFullScreen(false); };
  }, [phase, setFullScreen]);

  function openReader() {
    startRef.current = Date.now();
    setPhase('reader');
  }
  function finish(result) {
    setRecall(result);
    setSpent(startRef.current ? Date.now() - startRef.current : 0);
    setPhase('exit');
  }
  function leave() {
    if (onGoHome) onGoHome();
    else setPhase('path');
  }

  const root = { position: 'absolute', inset: 0, background: 'var(--b-paper)', color: 'var(--b-ink)' };

  return (
    <div dir="rtl" style={root}>
      {phase === 'path'   && <LessonsPage lesson={lesson} units={units} color={color} onOpen={() => setPhase('entry')} />}
      {phase === 'entry'  && <EntryPage lesson={lesson} color={color} onStart={openReader} onClose={() => setPhase('path')} />}
      {phase === 'reader' && <ReaderPage lesson={lesson} color={color} onClose={() => setPhase('path')} onFinish={finish} />}
      {phase === 'exit'   && <ExitPage lesson={lesson} units={units} color={color} recall={recall} timeSpent={spent} onLeave={leave} onBack={() => setPhase('path')} />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LESSONS PAGE
// ═════════════════════════════════════════════════════════════════════════════

const MARKER = 48;
const PAGE_MARGIN = 10;
const sway = i => 26 + 20 * Math.sin(i * 1.05);
const markerRight = i => PAGE_MARGIN + sway(i);            // marker box, from the right edge
const lineX = i => markerRight(i) + MARKER / 2;            // the line's x, from the right edge

const UNIT_GAP = 20;
const UNIT_BAND = 72;
const ROW_H = 76;
const HERO_H = 176;

function LessonsPage({ lesson, units, color, onOpen }) {
  const [f, setF] = useState(0);
  const spine = 10;

  // flatten into rows with a running y
  const rows = [];
  let y = 0, idx = 0, lessonNo = 0;
  units.forEach((u, ui) => {
    const done = u.lessons.filter(l => l.state === 'done').length;
    const tone = done === u.lessons.length ? 'complete' : u.lessons.some(l => l.state === 'hero' || l.state === 'open' || l.state === 'done') ? 'active' : 'ahead';
    const h = UNIT_GAP + UNIT_BAND;
    rows.push({ kind: 'unit', u, tone, done, y, h, idx, nodeY: y + UNIT_GAP + UNIT_BAND / 2, reached: tone !== 'ahead' });
    y += h; idx++;
    u.lessons.forEach(l => {
      lessonNo++;
      const hero = l.state === 'hero';
      const h2 = hero ? HERO_H : ROW_H;
      rows.push({ kind: 'lesson', l, number: lessonNo, y, h: h2, idx, nodeY: y + (hero ? 12 + MARKER / 2 : h2 / 2), reached: l.state === 'done' || hero });
      y += h2; idx++;
    });
  });
  const total = y;

  // the line, one S-curve between every pair of nodes
  const paths = [];
  rows.forEach((r, i) => {
    const nx = rows[i + 1];
    if (!nx) return;
    const x1 = lineX(r.idx), x2 = lineX(nx.idx), y1 = r.nodeY, y2 = nx.nodeY, mid = (y1 + y2) / 2;
    paths.push({ d: `M${x1} ${y1} C${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`, travelled: nx.reached });
  });

  const allLessons = units.flatMap(u => u.lessons);
  const completed = allLessons.filter(l => l.state === 'done').length;
  const totalLessons = allLessons.length;
  const activeUnit = units.find(u => u.lessons.some(l => l.state === 'hero')) || units[0];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: `color-mix(in srgb, ${color} 16%, var(--b-paper))` }}>
      {/* ── Notebook cover ── */}
      <header style={{ flexShrink: 0, position: 'relative', paddingRight: spine }}>
        <span style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: spine, background: color }} />
        <div style={{ display: 'flex', alignItems: 'center', height: lerp(56, 48, f), padding: '0 16px 0 20px' }}>
          <h1 style={{ margin: 0, flex: 1, font: `800 ${lerp(22, 17, f)}px/32px var(--font-arabic)`, color: 'var(--b-ink)' }}>
            {lesson.subjectName}
          </h1>
          {f > 0.5 && (
            <span style={{ font: '600 12px/18px var(--font-arabic)', opacity: (f - 0.5) * 2 }}>
              {toAr(completed)} من {toAr(totalLessons)}
            </span>
          )}
        </div>
        <div style={{ overflow: 'hidden', maxHeight: lerp(44, 0, f), opacity: Math.max(0, 1 - f / 0.5) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 20px 10px' }}>
            <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'color-mix(in srgb, var(--b-ink) 12%, transparent)', overflow: 'hidden' }}>
              <div style={{ width: `${(completed / totalLessons) * 100}%`, height: '100%', background: 'var(--b-accent)', borderRadius: 4 }} />
            </div>
            <span style={{ font: '600 12px/18px var(--font-arabic)' }}>{toAr(completed)} من {arabicLessons(totalLessons)}</span>
          </div>
        </div>
        {f > 0.6 && (
          <div style={{ background: 'var(--b-sunken)', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', font: '700 12px/18px var(--font-arabic)' }}>
            <span>{activeUnit.title}، {activeUnit.name}</span>
          </div>
        )}
      </header>

      {/* ── The margin line and its lessons ── */}
      <div
        onScroll={e => setF(Math.min(1, e.currentTarget.scrollTop / 96))}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', background: 'var(--b-paper)' }}
      >
        <div style={{ position: 'relative', height: total + 24 }}>
          <svg width="100%" height={total} style={{ position: 'absolute', top: 0, right: 0, transform: 'scaleX(-1)', pointerEvents: 'none' }} aria-hidden>
            {paths.map((p, i) => (
              <path key={i} d={p.d} fill="none" stroke={p.travelled ? 'var(--b-accent)' : 'var(--b-rule-strong)'}
                strokeWidth={p.travelled ? 3 : 2.5} strokeLinecap="round"
                strokeDasharray={p.travelled ? undefined : '0.1 8'} />
            ))}
          </svg>
          {rows.map((r, i) => r.kind === 'unit'
            ? <UnitBand key={i} r={r} />
            : <LessonRow key={i} r={r} color={color} onOpen={onOpen} />)}
        </div>
      </div>
    </div>
  );
}

function UnitBand({ r }) {
  const { u, tone, done } = r;
  const diamond = tone === 'complete' ? 'var(--b-accent)' : tone === 'active' ? 'var(--b-ink)' : 'var(--b-rule-strong)';
  const ink = tone === 'ahead' ? 'var(--b-ink3)' : tone === 'complete' ? 'var(--b-ink2)' : 'var(--b-ink)';
  return (
    <div style={{ position: 'absolute', top: r.y, left: 0, right: 0, height: r.h }}>
      <div style={{
        position: 'absolute', top: UNIT_GAP, left: 0, right: 0, height: UNIT_BAND, background: 'var(--b-sunken)',
        borderTop: '1px solid var(--b-rule-strong)', borderBottom: '1px solid var(--b-rule-strong)',
      }} />
      <div style={{ position: 'absolute', top: UNIT_GAP, height: UNIT_BAND, right: markerRight(r.idx), width: MARKER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--b-sunken)', position: 'absolute' }} />
        <span style={{ width: 16, height: 16, borderRadius: 3, background: diamond, transform: 'rotate(45deg)', position: 'relative' }} />
      </div>
      <div style={{
        position: 'absolute', top: UNIT_GAP, height: UNIT_BAND, right: markerRight(r.idx) + MARKER + 4, left: 20,
        display: 'flex', alignItems: 'center', gap: 8, color: ink,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '700 12px/18px var(--font-arabic)', opacity: 0.8 }}>{u.title}</div>
          <div style={{ font: '800 16px/26px var(--font-arabic)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
        </div>
        <span style={{ font: '600 12px/18px var(--font-arabic)', opacity: 0.8, whiteSpace: 'nowrap' }}>
          {toAr(done)} من {toAr(u.lessons.length)}
        </span>
      </div>
    </div>
  );
}

function PathMarker({ l, number, surround }) {
  const accent = 'var(--b-accent)';
  const ring = l.parts > 1 && l.state !== 'done';
  const dot = { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxSizing: 'border-box' };
  const num = c => <span style={{ font: '800 13px/1 var(--font-arabic)', color: c }}>{toAr(number)}</span>;
  return (
    <div style={{ width: MARKER, height: MARKER, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <span style={{ position: 'absolute', width: ring ? 48 : 36, height: ring ? 48 : 36, borderRadius: '50%', background: surround }} />
      {ring && (
        <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute' }}>
          {Array.from({ length: l.parts }).map((_, p) => {
            const span = 360 / l.parts, gap = 16, a0 = (-90 + p * span + gap / 2) * Math.PI / 180, a1 = (-90 + (p + 1) * span - gap / 2) * Math.PI / 180;
            const R = 20, c = 24;
            const d = `M${c + R * Math.cos(a0)} ${c + R * Math.sin(a0)} A${R} ${R} 0 ${span - gap > 180 ? 1 : 0} 1 ${c + R * Math.cos(a1)} ${c + R * Math.sin(a1)}`;
            return <path key={p} d={d} fill="none" strokeWidth="3.5" strokeLinecap="round"
              stroke={p < l.partsDone ? 'var(--b-ink)' : 'color-mix(in srgb, var(--b-ink) 22%, transparent)'} />;
          })}
        </svg>
      )}
      {l.state === 'done' && (
        <span style={{ ...dot, background: accent }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--b-on-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
        </span>
      )}
      {l.state === 'hero' && <span style={{ ...dot, background: accent }}>{num('var(--b-on-accent)')}</span>}
      {l.state === 'open' && <span style={{ ...dot, background: surround, border: `2px solid ${accent}` }}>{num('var(--b-accent-text)')}</span>}
      {l.state === 'locked' && (
        <span style={{ ...dot, background: surround, border: ring ? 0 : '1.5px solid var(--b-rule-strong)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--b-ink3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
      )}
    </div>
  );
}

function LessonRow({ r, color, onOpen }) {
  const { l, number } = r;
  const hero = l.state === 'hero';
  const locked = l.state === 'locked';
  const surround = hero ? 'var(--b-selected)' : 'var(--b-paper)';
  const titleColor = l.state === 'done' ? 'var(--b-ink2)' : locked ? 'var(--b-ink3)' : 'var(--b-ink)';
  const meta = hero
    ? `${l.parts > 1 ? `${toAr(l.parts)} أجزاء، ` : ''}${arabicMinutes(l.minutes)}`
    : l.state === 'done' ? 'خلّصته' : locked ? 'اقفل لحدّ ما تخلّص الدرس الفات' : '';
  const clickable = !locked;
  return (
    <div
      onClick={clickable ? onOpen : undefined}
      role={clickable ? 'button' : undefined}
      style={{
        position: 'absolute', top: r.y, left: 0, right: 0, height: r.h,
        background: hero ? 'var(--b-selected)' : 'transparent', cursor: clickable ? 'pointer' : 'default',
        borderBottom: hero || locked ? 0 : 0,
      }}
    >
      <div style={{ position: 'absolute', top: hero ? 12 : (r.h - MARKER) / 2, right: markerRight(r.idx) }}>
        <PathMarker l={l} number={number} surround={surround} />
      </div>
      <div style={{
        position: 'absolute', right: markerRight(r.idx) + MARKER + 4, left: 20,
        top: hero ? 26 : 0, bottom: hero ? 16 : 0,
        display: 'flex', flexDirection: 'column', justifyContent: hero ? 'flex-start' : 'center', gap: 2,
        color: hero ? 'var(--b-on-selected)' : titleColor,
      }}>
        {hero && <span style={{ font: '700 12px/18px var(--font-arabic)' }}>درسك التالي</span>}
        <span style={{ font: `${hero ? 800 : 700} ${hero ? 16 : 15}px/24px var(--font-arabic)` }}>{l.title}</span>
        {meta && <span style={{ font: '600 12px/18px var(--font-arabic)', opacity: hero ? 1 : 0.85 }}>{meta}</span>}
        {hero && (
          <button className="b-btn" style={{ marginTop: 10 }} onClick={e => { e.stopPropagation(); onOpen(); }}>
            ابدأ الدرس
          </button>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ENTRY — a page of the subject's notebook. The title steps back; the hook and
// the points the student leaves with lead. A short ritual plays once.
// ═════════════════════════════════════════════════════════════════════════════

const RITUAL_MS = 2200;
const RITUAL_PHRASES = ['بنجهّز ليك الدرس', 'بنرتّب الصفحات', 'كل حاجة حتبقى أوضح', 'جاهز'];
const SPINE = 10;

function EntryPage({ lesson, color, onStart, onClose }) {
  const points = lesson.orientation.points;
  const [p, setP] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t0 = performance.now();
    let raf;
    const tick = now => {
      const v = Math.min(1, (now - t0) / RITUAL_MS);
      setP(v);
      if (v < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setReady(true), 400);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const lit = ready ? points.length : Math.min(points.length, Math.floor(p * (points.length + 1)));
  const last = RITUAL_PHRASES.length - 1;
  const phrase = RITUAL_PHRASES[p >= 1 ? last : Math.min(last - 1, Math.floor(p * last))];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--b-paper)' }}>
      {/* subject watermark */}
      <span aria-hidden style={{
        position: 'absolute', left: 8, bottom: 110, font: '800 220px/1 var(--font-arabic)', color, opacity: 0.12, pointerEvents: 'none',
      }}>{lesson.subjectName.slice(0, 1)}</span>

      <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: `0 ${SPINE + 4}px 0 16px`, position: 'relative' }}>
        <button onClick={onClose} aria-label="إغلاق" style={{ background: 'none', border: 0, color: 'var(--b-ink)', cursor: 'pointer', padding: 8 }}><CloseIcon /></button>
        <span style={{ flex: 1 }} />
        <span style={{ font: '700 12px/18px var(--font-arabic)', color: 'var(--b-ink2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {lesson.subjectName}، {lesson.unitName.split(':')[0]}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', position: 'relative' }}>
        <div style={{ padding: `4px 24px 14px ${24}px`, paddingRight: SPINE + 24 }}>
          <div style={{ font: '800 12px/18px var(--font-arabic)', color: 'var(--b-accent-text)' }}>درس جديد</div>
          <h2 style={{ margin: 0, font: '700 19px/28px var(--font-arabic)' }}>{lesson.lessonTitle}</h2>
          <div style={{ font: '500 12px/18px var(--font-arabic)', color: 'var(--b-ink2)', paddingTop: 4 }}>
            {arabicMinutes(lesson.orientation.estimatedMins)}
          </div>
        </div>

        {/* the hook: loudest thing on the page, in its own band */}
        <div style={{
          background: 'var(--b-sunken)', borderTop: '1px solid var(--b-rule-strong)', borderBottom: '1px solid var(--b-rule-strong)',
          padding: `16px 24px 18px`, paddingRight: SPINE + 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--b-band)', transform: 'rotate(45deg)', border: '1px solid var(--b-accent-text)' }} />
            <span style={{ font: '800 12px/18px var(--font-arabic)', color: 'var(--b-accent-text)' }}>خلّيها في بالك</span>
          </div>
          <p className="b-read" style={{ margin: 0, font: '700 20px/36px var(--font-read)' }}>{lesson.hook}</p>
        </div>

        <div style={{ padding: `18px 24px 12px`, paddingRight: SPINE + 24 }}>
          <h3 style={{ margin: '0 0 4px', font: '700 16px/24px var(--font-arabic)' }}>حتطلع من الدرس وإنت بتعرف</h3>
          {points.map((pt, i) => (
            <div key={i} style={{ opacity: i < lit ? 1 : 0.22, transition: 'opacity .26s ease', borderBottom: '1px solid var(--b-rule)' }}>
              <div style={{ display: 'flex', gap: 12, padding: '10px 0' }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < lit ? 'var(--b-band)' : 'var(--b-rule)', color: 'var(--b-on-band)', font: '800 14px/22px var(--font-arabic)',
                }}>{toAr(i + 1)}</span>
                <span style={{ flex: 1, paddingTop: 2, font: '700 14px/24px var(--font-arabic)' }}>{pt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* the ritual, then the way in */}
      <div style={{ padding: `8px 20px 20px`, paddingRight: SPINE + 20, minHeight: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        {ready ? (
          <button className="b-btn" onClick={onStart}>ابدأ الدرس</button>
        ) : (
          <>
            <div style={{ textAlign: 'center', font: '700 16px/24px var(--font-arabic)' }}>{phrase}</div>
            <div style={{ height: 4, borderRadius: 4, background: 'var(--b-rule)', marginTop: 14, overflow: 'hidden' }}>
              <div style={{ width: `${p * 100}%`, height: '100%', background: 'var(--b-ink)' }} />
            </div>
          </>
        )}
      </div>

      {/* the spine, over the page so the hook's band runs under it */}
      <span aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: SPINE, background: color }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// READER — the lesson on its margin page. Full screen and focused: the bar
// retreats to a hairline of progress while reading and returns on scroll-up.
// ═════════════════════════════════════════════════════════════════════════════

function ReaderPage({ lesson, color, onClose, onFinish }) {
  const [barShown, setBarShown] = useState(true);
  const [frac, setFrac] = useState(0);
  const [result, setResult] = useState(null);   // null | { right: bool }
  const lastTop = useRef(0);

  function onScroll(e) {
    const el = e.currentTarget;
    const top = el.scrollTop;
    const max = el.scrollHeight - el.clientHeight;
    setFrac(max > 0 ? Math.min(1, top / max) : 0);
    if (top < 24) setBarShown(true);
    else if (top > lastTop.current + 6) setBarShown(false);
    else if (top < lastTop.current - 6) setBarShown(true);
    lastTop.current = top;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--b-paper)', ['--reader-line']: color }}>
      {/* 2px progress hairline, always there */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--b-rule)', zIndex: 6 }}>
        <div style={{ width: `${frac * 100}%`, height: '100%', background: color, marginLeft: 'auto' }} />
      </div>

      {/* the bar */}
      <div style={{
        position: 'absolute', top: 2, left: 0, right: 0, zIndex: 5, height: 52, display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 8px 0 16px', background: 'var(--b-paper)', borderBottom: '1px solid var(--b-rule)',
        transform: barShown ? 'none' : 'translateY(-110%)', transition: 'transform .22s ease',
      }}>
        <button onClick={onClose} aria-label="إغلاق" style={{ background: 'none', border: 0, color: 'var(--b-ink)', cursor: 'pointer', padding: 8 }}><CloseIcon /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '700 14px/20px var(--font-arabic)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.lessonTitle}</div>
          <div style={{ font: '500 12px/16px var(--font-arabic)', color: 'var(--b-ink2)' }}>{lesson.subjectName}</div>
        </div>
      </div>

      <div onScroll={onScroll} onClick={() => setBarShown(true)} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', paddingTop: 52 }}>
        <div style={{ paddingTop: 8 }}>
          {lesson.blocks.map(block => <BlockRenderer key={block.id} block={block} />)}
        </div>

        <RecallCard lesson={lesson} onSettled={setResult} />

        <MarginItem top={12} bottom={40}>
          <ReaderColumn>
            <button className="b-btn" disabled={!result} onClick={() => onFinish(result)}>
              {result ? 'خلّصت، كمّل' : 'جاوب على السؤال عشان تكمّل'}
            </button>
          </ReaderColumn>
        </MarginItem>
      </div>
    </div>
  );
}

// ── Active recall: a question on what was just read ──────────────────────────

function Choice({ text, state, onClick, disabled }) {
  const fill = state === 'picked' ? 'var(--b-selected)' : state === 'right' ? 'var(--b-positive-bg)' : state === 'wrong' ? 'var(--b-negative-bg)' : 'var(--b-surface)';
  const border = state === 'picked' ? '2px solid var(--b-ink)' : state === 'right' ? '2px solid var(--b-positive)' : state === 'wrong' ? '2px solid var(--b-negative)' : state === 'dimmed' ? '1px solid var(--b-rule)' : '1px solid var(--b-rule-strong)';
  const judged = state === 'right' || state === 'wrong';
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 48, padding: '8px 14px', textAlign: 'right',
      background: fill, border, borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
      color: state === 'dimmed' ? 'var(--b-ink2)' : 'var(--b-ink)',
      font: `${judged || state === 'picked' ? 700 : 400} 15px/27px var(--font-read)`, boxSizing: 'border-box',
    }}>
      <span style={{ flex: 1 }}>{text}</span>
      {judged && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          stroke={state === 'right' ? 'var(--b-positive)' : 'var(--b-negative)'}>
          {state === 'right' ? <path d="m5 12 5 5 9-10" /> : <path d="M6 6l12 12M18 6 6 18" />}
        </svg>
      )}
    </button>
  );
}

function RecallCard({ lesson, onSettled }) {
  const { question, options, correctIndex, explanation } = lesson.checkpoint;
  const [selected, setSelected] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [settled, setSettled] = useState(false);
  const [firstRight, setFirstRight] = useState(null);

  const right = submitted && selected === correctIndex;
  const wrong = submitted && !right;

  function submit() {
    setSubmitted(true);
    if (attempts === 0) setFirstRight(selected === correctIndex);
    setAttempts(a => a + 1);
    if (selected === correctIndex) { setSettled(true); onSettled({ right: attempts === 0 }); }
  }
  function retry() { setSelected(null); setSubmitted(false); }
  function settle() { setSettled(true); onSettled({ right: false }); }

  const stateOf = i => {
    if (!submitted) return selected === i ? 'picked' : 'idle';
    if (i === correctIndex && right) return 'right';
    if (i === selected && wrong) return 'wrong';
    return 'dimmed';
  };
  const subtitle = attempts > 0 && !submitted ? 'المحاولة التانية' : 'من غير ما ترجع للفقرة';

  return (
    <MarginItem
      top={20}
      bottom={16}
      bar="var(--b-accent)"
      sign={<MarginSign icon={Icons.recall} fill="var(--b-accent)" tint="var(--b-on-accent)" border="var(--b-accent)" />}
    >
      <ReaderColumn>
        <div style={{ minHeight: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ font: '800 12px/18px var(--font-arabic)', color: 'var(--b-accent-text)' }}>اختبر نفسك</span>
          <span style={{ font: '500 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>{subtitle}</span>
        </div>
        <p className="b-read" style={{ margin: '4px 0 12px', font: '500 16px/29px var(--font-read)' }}>{question}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((o, i) => (
            <Choice key={i} text={o} state={stateOf(i)} disabled={submitted} onClick={() => setSelected(i)} />
          ))}
        </div>

        {!submitted && (
          <div style={{ marginTop: 14 }}>
            <button className="b-btn-ink" disabled={selected === null} onClick={submit}>تحقّق</button>
          </div>
        )}

        {right && (
          <Feedback tone="right" title={firstRight ? 'صاح' : 'المرة دي صاح'} heading="ليه؟" body={explanation} />
        )}
        {wrong && (
          <>
            <Feedback tone="wrong" title="ما ظبطت المرة دي" heading="الغلط وين؟" body={explanation}
              extra={`الإجابة الصحيحة: ${options[correctIndex]}`} />
            <p style={{ margin: '10px 0', font: '500 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>
              المحاولة التانية للتثبيت بس. الأولى هي المحسوبة.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="b-btn-quiet" onClick={retry}>جرّب تاني</button>
              <button className="b-btn" onClick={settle}>فهمت، كمّل</button>
            </div>
          </>
        )}
      </ReaderColumn>
    </MarginItem>
  );
}

function Feedback({ tone, title, heading, body, extra }) {
  const ok = tone === 'right';
  return (
    <div style={{ marginTop: 14, animation: 'bshStep .25s ease' }}>
      <div style={{ font: '800 16px/24px var(--font-arabic)', color: ok ? 'var(--b-positive)' : 'var(--b-negative)' }}>{title}</div>
      {extra && <div style={{ font: '700 14px/22px var(--font-arabic)', paddingTop: 2 }}>{extra}</div>}
      <div style={{ font: '800 12px/18px var(--font-arabic)', color: 'var(--b-ink2)', paddingTop: 8 }}>{heading}</div>
      <p className="b-read" style={{ margin: 0, font: '400 15px/27px var(--font-read)' }}>{body}</p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXIT — a stepped ceremony of pages: what you did, the streak, what you
// gained, what comes next. "اختصر" skips to the last page.
// ═════════════════════════════════════════════════════════════════════════════

const WEEK = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

function ExitPage({ lesson, units, color, recall, timeSpent, onLeave, onBack }) {
  const [step, setStep] = useState(0);
  const STEPS = 4;
  const { xpGained, streakBefore } = lesson.complete;

  const minutes = Math.max(1, Math.round(timeSpent / 60000));
  const xp = DEMO_USER.xp + xpGained;
  const lvl = getLevel(xp);
  const unit = units.find(u => u.lessons.some(l => l.state === 'hero')) || units[0];
  const unitDone = unit.lessons.filter(l => l.state === 'done').length + 1;
  const left = unit.lessons.length - unitDone;
  const next = unit.lessons.find(l => l.state === 'open');

  const kicker = { font: '700 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--b-paper)' }}>
      {/* page dots, close, and the shortcut */}
      <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 8px 0 16px', gap: 8 }}>
        <button onClick={onBack} aria-label="إغلاق" style={{ background: 'none', border: 0, color: 'var(--b-ink)', cursor: 'pointer', padding: 8 }}><CloseIcon /></button>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 6 }} aria-label={`الصفحة ${toAr(step + 1)} من ${toAr(STEPS)}`}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <span key={i} style={{ width: i === step ? 22 : 8, height: 4, borderRadius: 4, background: i <= step ? 'var(--b-ink)' : 'var(--b-rule-strong)', transition: 'width .2s' }} />
          ))}
        </div>
        {step < STEPS - 1
          ? <button onClick={() => setStep(STEPS - 1)} style={{ background: 'none', border: 0, color: 'var(--b-ink2)', font: '700 12px/18px var(--font-arabic)', cursor: 'pointer', padding: 8 }}>اختصر</button>
          : <span style={{ width: 52 }} />}
      </div>

      <div key={step} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '8px 24px 16px', animation: 'bshStep .3s ease' }}>
        {step === 0 && (
          <>
            <div style={kicker}>خلّصت الدرس</div>
            <h2 style={{ margin: '0 0 20px', font: '800 22px/32px var(--font-arabic)' }}>{lesson.lessonTitle}</h2>
            <div style={{ display: 'flex', borderTop: '2px solid var(--b-ink)', borderBottom: '1px solid var(--b-rule)' }}>
              <Stat n={toAr(minutes)} label="دقيقة" />
              <span style={{ width: 1, background: 'var(--b-rule)' }} />
              <Stat n={recall.right ? 'صاح' : 'غلط'} label="اختبر نفسك" tone={recall.right ? 'var(--b-positive)' : 'var(--b-negative)'} />
            </div>
            <p style={{ margin: '20px 0 0', font: '500 14px/24px var(--font-arabic)', color: 'var(--b-ink2)' }}>
              {recall.right
                ? 'جاوبت صاح من أول مرة. واصل كدا.'
                : `«${lesson.concept}» لسه محتاج تثبيت. حنرجّعو ليك في المراجعة بكرة.`}
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <div style={kicker}>سلسلتك زادت يوم</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '4px 0 6px' }}>
              <span style={{ font: '800 96px/1.1 var(--font-arabic)' }}>{toAr(streakBefore + 1)}</span>
              <span style={{ font: '700 16px/24px var(--font-arabic)' }}>أيام على التوالي</span>
            </div>
            <div style={{ display: 'flex', gap: 6, margin: '12px 0 16px' }}>
              {WEEK.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: 36, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i === 6 ? 'var(--b-accent)' : 'var(--b-light-day)', color: 'var(--b-on-accent)',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
                  </div>
                  <div style={{ font: '600 12px/18px var(--font-arabic)', color: 'var(--b-ink2)', paddingTop: 2 }}>{d}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--b-rule)', padding: '12px 0' }}>
              <div style={{ font: '700 14px/22px var(--font-arabic)' }}>اليوم اتحسب بدرس كامل</div>
              <div style={{ font: '500 12px/20px var(--font-arabic)', color: 'var(--b-ink2)' }}>الدرس الكامل بيكبّر السلسلة، والمراجعة الخفيفة بتحافظ عليها.</div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={kicker}>حصيلتك من الدرس</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ font: '800 64px/1.2 var(--font-arabic)' }}>{toAr(xpGained)}</span>
              <span style={{ font: '700 16px/24px var(--font-arabic)' }}>نقطة</span>
            </div>
            <div style={{ font: '700 14px/22px var(--font-arabic)' }}>المستوى {toAr(lvl.level)}، {lvl.title}</div>
            <div style={{ height: 6, borderRadius: 4, background: 'var(--b-rule)', margin: '8px 0 4px', overflow: 'hidden' }}>
              <div style={{ width: `${lvl.progress}%`, height: '100%', background: 'var(--b-accent)', borderRadius: 4 }} />
            </div>
            <div style={{ font: '500 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>
              باقي {toAr(lvl.next.minXp - xp)} نقطة للمستوى {toAr(lvl.level + 1)}
            </div>

            <Row title={unit.name} aside={`${toAr(unitDone)} من ${arabicLessons(unit.lessons.length)}`}>
              <div style={{ display: 'flex', gap: 3, padding: '6px 0 4px' }}>
                {unit.lessons.map((_, i) => (
                  <span key={i} style={{ flex: 1, height: 6, borderRadius: 4, background: i < unitDone ? 'var(--b-accent)' : 'var(--b-rule)' }} />
                ))}
              </div>
              <div style={{ font: '600 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>
                {left === 0 ? 'قفلت الوحدة' : left === 1 ? 'درس واحد وتقفل الوحدة' : left === 2 ? 'درسين وتقفل الوحدة' : `باقي ${arabicLessons(left)} في الوحدة`}
              </div>
            </Row>

            <Row title="دخل كراسك" aside="مفهوم واحد">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                <span style={{ font: '700 14px/22px var(--font-arabic)' }}>{lesson.concept}</span>
                <span style={{ font: '700 12px/18px var(--font-arabic)', color: recall.right ? 'var(--b-positive)' : 'var(--b-warning)' }}>
                  {recall.right ? 'ثابت' : 'محتاج تثبيت'}
                </span>
              </div>
              <div style={{ font: '500 12px/18px var(--font-arabic)', color: 'var(--b-ink2)', paddingTop: 2 }}>كل مفهوم بيرجع ليك في المراجعة في يومه.</div>
            </Row>

            <Row title={`باقي ${toAr(DEMO_USER.daysUntilExam)} يوم للامتحان`} aside={DEMO_USER.paceLabel} />
          </>
        )}

        {step === 3 && (
          <>
            <div style={kicker}>{next ? 'الجاي' : 'خلّصت دروس الوحدة'}</div>
            {next && <h2 style={{ margin: '0 0 16px', font: '800 22px/32px var(--font-arabic)' }}>{next.title}</h2>}
            <div style={{
              background: 'var(--b-sunken)', borderTop: '1px solid var(--b-rule-strong)', borderBottom: '1px solid var(--b-rule-strong)',
              margin: '0 -24px', padding: '14px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--b-band)', transform: 'rotate(45deg)', border: '1px solid var(--b-accent-text)' }} />
                <span style={{ font: '800 12px/18px var(--font-arabic)', color: 'var(--b-accent-text)' }}>خلّيها في بالك</span>
              </div>
              <p className="b-read" style={{ margin: 0, font: '700 16px/30px var(--font-read)' }}>{lesson.hook}</p>
            </div>
            <p style={{ margin: '16px 0 0', font: '500 12px/20px var(--font-arabic)', color: 'var(--b-ink2)' }}>
              في بنك الأسئلة أسئلة على مفاهيم الدرس دا، لو عايز تتدرّب عليها.
            </p>
          </>
        )}
      </div>

      <div style={{ padding: '8px 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {step < STEPS - 1
          ? <button className="b-btn" onClick={() => setStep(s => s + 1)}>التالي</button>
          : (
            <>
              <button className="b-btn" onClick={onLeave}>ارجع للرئيسية</button>
              <button className="b-btn-quiet" onClick={onBack}>ارجع للدروس</button>
            </>
          )}
      </div>
    </div>
  );
}

function Stat({ n, label, tone }) {
  return (
    <div style={{ flex: 1, padding: '14px 0', textAlign: 'center' }}>
      <div style={{ font: '800 34px/44px var(--font-arabic)', color: tone || 'var(--b-ink)' }}>{n}</div>
      <div style={{ font: '600 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>{label}</div>
    </div>
  );
}

function Row({ title, aside, children }) {
  return (
    <div style={{ borderTop: '1px solid var(--b-rule)', padding: '12px 0', marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ font: '800 14px/22px var(--font-arabic)' }}>{title}</span>
        {aside && <span style={{ font: '600 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>{aside}</span>}
      </div>
      {children}
    </div>
  );
}
