'use client';
import { useState, useEffect, useRef } from 'react';
import { DEMO_USER, SUBJECTS_BY_PATH, FOCUS_BY_PATH, SUBJECT_COLORS } from '../demoData';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// Level thresholds & labels
const LEVELS = [
  { level: 1,  minXp: 0,    title: 'مبتدئ'  },
  { level: 2,  minXp: 500,  title: 'متعلّم' },
  { level: 3,  minXp: 1000, title: 'متقدّم' },
  { level: 4,  minXp: 1500, title: 'ماهر'   },
  { level: 5,  minXp: 2500, title: 'خبير'   },
  { level: 6,  minXp: 4000, title: 'محترف'  },
];

export function getLevel(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
  }
  const idx  = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] || { ...current, minXp: current.minXp + 1000 };
  const progress = Math.min(100, Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100));
  return { ...current, next, progress, xpInLevel: xp - current.minXp, xpToNext: next.minXp - current.minXp };
}

function streakTitle(days) {
  if (days <= 0) return 'ابدأ سلسلتك اليوم';
  if (days === 1) return 'أول يوم في سلسلتك';
  if (days === 2) return 'يومان متتاليان';
  if (days % 100 >= 3 && days % 100 <= 10) return `${toAr(days)} أيام متتالية`;
  return `${toAr(days)} يوماً متتالياً`;
}

function examUnit(days) {
  if (days === 0) return 'الامتحان اليوم';
  if (days === 1) return 'يوم واحد للامتحان';
  if (days === 2) return 'يومان للامتحان';
  if (days % 100 >= 3 && days % 100 <= 10) return 'أيام للامتحان';
  return 'يوماً للامتحان';
}

const lerp = (a, b, t) => a + (b - a) * t;

// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen — amber band that collapses on scroll, a page over it, and the
// subjects as a shelf of notebooks on the darker paper tone.
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen({ onNavigate, userProfile, bonusXp = 0 }) {
  const path    = userProfile?.path || 'SCIENCE';
  const nameAr  = userProfile?.name || DEMO_USER.nameAr;
  const { streak, dailyGoalDone, dailyGoalTotal, daysUntilExam, paceLabel } = DEMO_USER;
  const xp        = DEMO_USER.xp + bonusXp;
  const levelInfo = getLevel(xp);
  const subjects  = SUBJECTS_BY_PATH[path] || SUBJECTS_BY_PATH.SCIENCE;
  const focus     = FOCUS_BY_PATH[path]    || FOCUS_BY_PATH.SCIENCE;
  const goalLeft  = dailyGoalTotal - dailyGoalDone;

  const [f, setF] = useState(0);
  const ref = useRef(null);
  function onScroll(e) {
    setF(Math.min(1, e.currentTarget.scrollTop / 90));
  }

  const ink = 'var(--b-on-band)';
  const detail = Math.max(0, 1 - f / 0.5);

  return (
    <div dir="rtl" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--b-band)' }}>

      {/* ── Header band ── */}
      <header style={{ flexShrink: 0, padding: `${lerp(20, 8, f)}px 20px ${lerp(18, 12, f)}px`, color: ink }}>
        <div style={{ overflow: 'hidden', maxHeight: lerp(40, 0, f), opacity: detail }}>
          <h1 style={{ font: '800 19px/28px var(--font-arabic)', margin: 0, paddingBottom: 12 }}>
            مرحب يا {nameAr}
          </h1>
        </div>

        <div data-tour="streak" style={{ display: 'flex', alignItems: 'center', height: lerp(52, 44, f) }}>
          {/* streak */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={streak > 0 ? ink : 'none'} stroke={ink} strokeWidth="1.8" strokeLinejoin="round">
              <path d="M12 2c.5 3-1.5 4.500-3 6.500C7.500 10.500 7 12 7 13.500a5 5 0 0 0 10 0c0-1.500-.5-2.500-1-3.500-.5 1-1.500 1.500-2 1.500.5-3-.5-6-2-9.500z"/>
            </svg>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: '800 14px/22px var(--font-arabic)', whiteSpace: 'nowrap' }}>{streakTitle(streak)}</div>
              <div style={{ font: '600 12px/18px var(--font-arabic)', overflow: 'hidden', maxHeight: lerp(18, 0, f), opacity: detail }}>
                المستوى {toAr(levelInfo.level)}، {levelInfo.title}
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: lerp(40, 20, f), background: ink, opacity: 0.28 }} />

          {/* exam countdown */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: lerp(10, 6, f), paddingInlineStart: 16, minWidth: 0 }}>
            {daysUntilExam >= 3 && (
              <span style={{ fontFamily: 'var(--font-arabic)', fontWeight: 800, fontSize: lerp(24, 14, f), lineHeight: `${lerp(32, 22, f)}px` }}>
                {toAr(daysUntilExam)}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ font: '800 14px/22px var(--font-arabic)', whiteSpace: 'nowrap' }}>{examUnit(daysUntilExam)}</div>
              <div style={{ font: '600 12px/18px var(--font-arabic)', overflow: 'hidden', maxHeight: lerp(18, 0, f), opacity: detail }}>
                {paceLabel}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page over the band ── */}
      <div
        ref={ref}
        onScroll={onScroll}
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none',
          background: 'var(--b-paper)', borderRadius: '16px 16px 0 0',
        }}
      >
        {/* today's plan: rules and space, no cards */}
        <section style={{ padding: '20px 20px 4px' }}>
          <h2 style={{ font: '800 16px/24px var(--font-arabic)', margin: '0 0 4px', color: 'var(--b-ink)' }}>خطة اليوم</h2>

          <button
            onClick={() => onNavigate('lesson')}
            data-tour="focus"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'right',
              padding: '14px 0', background: 'none', border: 0, borderTop: '1px solid var(--b-rule)',
              borderBottom: '1px solid var(--b-rule)', cursor: 'pointer', color: 'var(--b-ink)',
            }}
          >
            <span style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: focus.color }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', font: '600 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>
                كمّل من وين وقفت، {focus.subjectAr}
              </span>
              <span style={{ display: 'block', font: '700 15px/24px var(--font-arabic)' }}>{focus.lessonTitle}</span>
              <span style={{ display: 'block', font: '500 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>{focus.unitAr}</span>
              <span style={{ display: 'block', height: 4, borderRadius: 4, background: 'var(--b-sunken)', marginTop: 8, overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${focus.progress}%`, background: 'var(--b-accent)', borderRadius: 4 }} />
              </span>
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--b-accent-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>

          {/* daily goal */}
          <div style={{ padding: '14px 0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ font: '700 14px/22px var(--font-arabic)', color: 'var(--b-ink)' }}>هدف اليوم</span>
              <span style={{ font: '700 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>
                {toAr(dailyGoalDone)} من {toAr(dailyGoalTotal)}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: 'var(--b-sunken)', margin: '8px 0 6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(dailyGoalDone / dailyGoalTotal) * 100}%`, background: 'var(--b-accent)', borderRadius: 4, transition: 'width .6s ease' }} />
            </div>
            <span style={{ font: '500 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>
              {goalLeft === 1 ? 'باقي واحد عشان تكمّل هدفك' : `باقي ${toAr(goalLeft)} عشان تكمّل هدفك`}
            </span>
          </div>
        </section>

        {/* ── Notebook shelf ── */}
        <section data-tour="subjects" style={{ background: 'var(--b-sunken)', borderTop: '1px solid var(--b-rule)', padding: '24px 20px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 12 }}>
            <h2 style={{ font: '800 16px/24px var(--font-arabic)', margin: 0, color: 'var(--b-ink)' }}>كرّاساتك</h2>
            <span style={{ font: '500 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>
              {subjects.length === 2 ? 'مادتان' : `${toAr(subjects.length)} مواد`}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {subjects.map(s => (
              <NotebookTile key={s.id} subject={s} onOpen={() => onNavigate('lesson')} onPractice={() => onNavigate('quiz')} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// One subject as an exercise book: spine in the subject colour, cover, label
// plate with name and progress, and a strip that opens practice.
function NotebookTile({ subject, onOpen, onPractice }) {
  const color = SUBJECT_COLORS[subject.key] || '#4A90D9';
  const label = subject.progress === 0 ? 'لم تبدأ بعد' : `${toAr(subject.progress)}٪ مكتمل`;
  return (
    <div style={{
      display: 'flex', background: 'var(--b-surface)', border: '1px solid var(--b-rule-strong)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <div style={{ width: 8, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <button onClick={onOpen} aria-label={`افتح دروس ${subject.nameAr}`}
          style={{ flex: 1, background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'right', color: 'var(--b-ink)' }}>
          <div style={{
            height: 84, background: 'var(--b-paper)', borderBottom: '1px solid var(--b-rule)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: '800 40px/1 var(--font-arabic)', color,
          }}>
            {subject.initial}
          </div>
          <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: '700 14px/22px var(--font-arabic)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subject.nameAr}</span>
            <span style={{ height: 4, borderRadius: 4, background: 'var(--b-sunken)', overflow: 'hidden', display: 'block' }}>
              <span style={{ display: 'block', height: '100%', width: `${subject.progress}%`, background: 'var(--b-accent)', borderRadius: 4 }} />
            </span>
            <span style={{ font: '500 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>{label}</span>
          </div>
        </button>
        <button onClick={onPractice} aria-label={`تدرّب على ${subject.nameAr}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, padding: '0 12px',
            background: 'none', border: 0, borderTop: '1px solid var(--b-rule)', cursor: 'pointer',
            font: '700 14px/22px var(--font-arabic)', color: 'var(--b-accent-text)',
          }}>
          تدرّب
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LevelUpOverlay — a quiet sheet of paper, one numeral, one button. No
// confetti, no looping animation.
// ─────────────────────────────────────────────────────────────────────────────
export function LevelUpOverlay({ levelInfo, onDone }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6, padding: 32,
        background: 'var(--b-paper)', opacity: shown ? 1 : 0, transition: 'opacity .35s ease',
      }}
    >
      <span style={{ font: '700 14px/22px var(--font-arabic)', color: 'var(--b-ink2)' }}>وصلت للمستوى</span>
      <span style={{ font: '800 96px/1.1 var(--font-arabic)', color: 'var(--b-ink)' }}>{toAr(levelInfo.level)}</span>
      <span style={{ font: '800 22px/32px var(--font-arabic)', color: 'var(--b-accent-text)', marginBottom: 28 }}>{levelInfo.title}</span>
      <div style={{ width: '100%', maxWidth: 260 }}>
        <button className="b-btn" onClick={onDone}>تمام</button>
      </div>
    </div>
  );
}
