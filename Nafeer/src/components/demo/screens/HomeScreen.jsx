'use client';
import { useState, useEffect } from 'react';
import { DEMO_USER, SUBJECTS_BY_PATH, FOCUS_BY_PATH, SUBJECT_COLORS } from '../demoData';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// Level thresholds & labels
const LEVELS = [
  { level: 1,  minXp: 0,    title: 'مبتدئ',     color: '#95A5A6' },
  { level: 2,  minXp: 500,  title: 'متعلّم',     color: '#27AE60' },
  { level: 3,  minXp: 1000, title: 'متقدّم',     color: '#4A90D9' },
  { level: 4,  minXp: 1500, title: 'ماهر',        color: '#9B59B6' },
  { level: 5,  minXp: 2500, title: 'خبير',        color: '#E67E22' },
  { level: 6,  minXp: 4000, title: 'محترف',       color: '#d4891e' },
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

// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen({ onNavigate, userProfile, bonusXp = 0, justLeveledUp = false, onLevelUpSeen }) {
  const path       = userProfile?.path  || 'SCIENCE';
  const nameAr     = userProfile?.name  || DEMO_USER.nameAr;
  const grade      = userProfile?.grade;

  const { streak, dailyGoalDone, dailyGoalTotal } = DEMO_USER;
  const xp           = DEMO_USER.xp + bonusXp;
  const levelInfo    = getLevel(xp);
  const goalProgress = Math.round((dailyGoalDone / dailyGoalTotal) * 100);
  const subjects     = SUBJECTS_BY_PATH[path] || SUBJECTS_BY_PATH.SCIENCE;
  const focus        = FOCUS_BY_PATH[path]    || FOCUS_BY_PATH.SCIENCE;
  const gradeLabel   = grade === '3' ? 'الثالث ثانوي' : 'الثاني ثانوي';

  const [xpBarAnimated, setXpBarAnimated] = useState(false);

  useEffect(() => {
    if (bonusXp > 0) {
      const t = setTimeout(() => setXpBarAnimated(true), 200);
      return () => clearTimeout(t);
    }
  }, [bonusXp]);

  return (
    <div className="pb-6" dir="rtl" style={{ position: 'relative' }}>

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="font-arabic text-xs" style={{ color: 'var(--text-muted)' }}>أهلاً،</p>
            <h2 className="font-arabic text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {nameAr} 👋
            </h2>
            {grade && (
              <p className="font-arabic text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                {gradeLabel} · {path === 'SCIENCE' ? 'علمي' : 'أدبي'}
              </p>
            )}
          </div>
          {/* Streak badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(212,137,30,0.12)', border: '1px solid rgba(212,137,30,0.28)' }}
          >
            <span style={{ fontSize: '16px' }}>🔥</span>
            <div>
              <p className="font-arabic text-sm font-bold leading-none" style={{ color: 'var(--accent)' }}>
                {toAr(streak)}
              </p>
              <p className="font-arabic text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>يوم</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily Goal ── */}
      <div
        className="mx-4 mb-4 rounded-2xl p-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex justify-between items-center mb-2">
          <p className="font-arabic text-sm font-bold" style={{ color: 'var(--text-primary)' }}>هدف اليوم</p>
          <p className="font-arabic text-xs font-mono" style={{ color: 'var(--accent)' }}>
            {toAr(dailyGoalDone)} / {toAr(dailyGoalTotal)}
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${goalProgress}%`, background: 'var(--accent)' }}
          />
        </div>
        <p className="font-arabic text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {toAr(dailyGoalTotal - dailyGoalDone)} عناصر متبقية لإتمام هدفك
        </p>
      </div>

      {/* ── XP & Level Card ── */}
      <div
        className="mx-4 mb-4 rounded-2xl p-4"
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${bonusXp > 0 ? levelInfo.color + '50' : 'var(--border-subtle)'}`,
          transition: 'border-color 0.6s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle glow when xp was earned */}
        {bonusXp > 0 && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 16,
            background: `radial-gradient(ellipse at top left, ${levelInfo.color}12 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        )}

        {/* Top row: level badge + xp numbers */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* Level badge */}
            <div
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: `${levelInfo.color}18`,
                border: `1.5px solid ${levelInfo.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: levelInfo.color, fontFamily: 'var(--font-arabic, inherit)', lineHeight: 1 }}>
                مستوى
              </span>
              <span style={{ fontSize: 14, fontWeight: 900, color: levelInfo.color, lineHeight: 1.1, fontFamily: 'var(--font-sans, inherit)' }}>
                {levelInfo.level}
              </span>
            </div>
            <div>
              <p className="font-arabic text-sm font-bold" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {levelInfo.title}
              </p>
              <p className="font-arabic" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                نقاط الخبرة
              </p>
            </div>
          </div>

          {/* XP counter */}
          <div style={{ textAlign: 'left' }}>
            <div className="flex items-baseline gap-1">
              <span
                style={{
                  fontFamily: 'var(--font-sans, monospace)',
                  fontSize: 15, fontWeight: 800,
                  color: levelInfo.color,
                  animation: bonusXp > 0 ? 'xpPulse 0.6s ease 0.3s both' : 'none',
                }}
              >
                {toAr(xp)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-arabic, inherit)' }}>
                / {toAr(levelInfo.next.minXp)}
              </span>
            </div>
            {bonusXp > 0 && (
              <div
                style={{
                  fontSize: 10, color: levelInfo.color, fontFamily: 'var(--font-arabic, inherit)',
                  fontWeight: 700, textAlign: 'left',
                  animation: 'xpGainFade 0.5s ease 0.1s both',
                }}
              >
                +{toAr(bonusXp)} ⭐
              </div>
            )}
          </div>
        </div>

        {/* XP Progress bar */}
        <div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
            <div
              style={{
                height: '100%', borderRadius: 99,
                background: `linear-gradient(90deg, ${levelInfo.color}99, ${levelInfo.color})`,
                width: `${xpBarAnimated || bonusXp === 0 ? levelInfo.progress : getLevel(xp - bonusXp).progress}%`,
                transition: 'width 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: bonusXp > 0 ? `0 0 8px ${levelInfo.color}60` : 'none',
              }}
            />
          </div>
          {/* Bar label */}
          <div className="flex justify-between mt-1">
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-arabic, inherit)' }}>
              {levelInfo.title}
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-arabic, inherit)' }}>
              {levelInfo.next.title} ← {toAr(levelInfo.xpToNext - levelInfo.xpInLevel)} نقطة
            </span>
          </div>
        </div>

        <style>{`
          @keyframes xpPulse {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.18); color: #fff; }
            100% { transform: scale(1); }
          }
          @keyframes xpGainFade {
            from { opacity: 0; transform: translateY(4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>

      {/* ── Today's Focus ── */}
      <div className="px-4 mb-3">
        <p className="font-arabic text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>تركيز اليوم</p>
        <button
          onClick={() => onNavigate('lesson')}
          className="w-full rounded-2xl p-4 text-right transition-all active:scale-99"
          style={{
            background: `rgba(${hexToRgb(focus.color)},0.10)`,
            border: `1px solid ${focus.color}45`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{ background: `${focus.color}25`, color: focus.color }}
                >
                  {focus.initial}
                </div>
                <span className="font-arabic text-xs" style={{ color: focus.color }}>{focus.subjectAr}</span>
              </div>
              <p className="font-arabic text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {focus.lessonTitle}
              </p>
              <p className="font-arabic text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {focus.unitAr}
              </p>
            </div>
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${focus.color}18` }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focus.color} strokeWidth="1.8">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </div>
          </div>
          {/* Mini progress */}
          <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: `${focus.color}18` }}>
            <div className="h-full rounded-full" style={{ width: `${focus.progress}%`, background: focus.color }} />
          </div>
        </button>
      </div>

      {/* ── Subjects Grid ── */}
      <div className="px-4">
        <p className="font-arabic text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>موادك</p>
        <div className="grid grid-cols-2 gap-2">
          {subjects.map(s => (
            <SubjectCard key={s.id} subject={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LevelUpOverlay — dramatic but brief celebration
// ─────────────────────────────────────────────────────────────────────────────
export function LevelUpOverlay({ levelInfo, onDone }) {
  const [phase, setPhase] = useState('in'); // 'in' → 'show' → 'out'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 50);
    const t2 = setTimeout(() => setPhase('out'), 2800);
    const t3 = setTimeout(() => onDone(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const visible = phase !== 'out';

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(ellipse at center, ${levelInfo.color}22 0%, rgba(0,0,0,0.82) 100%)`,
        backdropFilter: 'blur(6px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.55s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      onClick={onDone}
    >
      {/* Particles */}
      <Particles color={levelInfo.color} />

      {/* Central medal */}
      <div
        style={{
          transform: phase === 'show' ? 'scale(1) translateY(0)' : 'scale(0.4) translateY(30px)',
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}
      >
        {/* Hex badge */}
        <div style={{ position: 'relative', width: 110, height: 110 }}>
          <svg viewBox="0 0 110 110" width="110" height="110" style={{ position: 'absolute', inset: 0 }}>
            <polygon
              points="55,4 100,27.5 100,82.5 55,106 10,82.5 10,27.5"
              fill={`${levelInfo.color}22`}
              stroke={levelInfo.color}
              strokeWidth="2"
            />
            {/* Animated ring */}
            <polygon
              points="55,4 100,27.5 100,82.5 55,106 10,82.5 10,27.5"
              fill="none"
              stroke={levelInfo.color}
              strokeWidth="2.5"
              strokeDasharray="280"
              strokeDashoffset={phase === 'show' ? '0' : '280'}
              style={{ transition: 'stroke-dashoffset 0.8s ease 0.2s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: levelInfo.color, fontFamily: 'var(--font-arabic, inherit)', letterSpacing: 1 }}>
              مستوى
            </span>
            <span style={{
              fontSize: 38, fontWeight: 900, color: levelInfo.color,
              fontFamily: 'var(--font-sans, monospace)', lineHeight: 1,
              textShadow: `0 0 24px ${levelInfo.color}80`,
            }}>
              {levelInfo.level}
            </span>
          </div>
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: 13, color: levelInfo.color, fontWeight: 700,
            letterSpacing: 2, textTransform: 'uppercase',
            opacity: phase === 'show' ? 1 : 0,
            transition: 'opacity 0.4s ease 0.5s',
            marginBottom: 4,
          }}>
            ارتقيت بمستواك! 🎉
          </p>
          <p style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: 26, fontWeight: 900, color: '#fff',
            textShadow: `0 2px 20px ${levelInfo.color}60`,
            opacity: phase === 'show' ? 1 : 0,
            transition: 'opacity 0.4s ease 0.65s',
          }}>
            {levelInfo.title}
          </p>
        </div>
      </div>

      {/* Tap to dismiss */}
      <p style={{
        position: 'absolute', bottom: 48,
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize: 11, color: 'rgba(255,255,255,0.35)',
        opacity: phase === 'show' ? 1 : 0,
        transition: 'opacity 0.4s ease 1.2s',
      }}>
        اضغط للمتابعة
      </p>
    </div>
  );
}

function Particles({ color }) {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 220,
    y: 60 + Math.random() * 380,
    size: 3 + Math.random() * 5,
    delay: Math.random() * 0.8,
    duration: 1.2 + Math.random() * 1.4,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x, top: p.y,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: p.id % 3 === 0 ? color : p.id % 3 === 1 ? '#fff' : `${color}80`,
            animation: `particlePop ${p.duration}s ease ${p.delay}s both`,
          }}
        />
      ))}
      <style>{`
        @keyframes particlePop {
          0%   { opacity: 0; transform: scale(0) translateY(0); }
          30%  { opacity: 1; transform: scale(1) translateY(-20px); }
          100% { opacity: 0; transform: scale(0.4) translateY(-80px); }
        }
      `}</style>
    </div>
  );
}

function SubjectCard({ subject }) {
  const color = SUBJECT_COLORS[subject.key] || '#4A90D9';
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center font-arabic text-xs font-bold"
          style={{ background: `${color}20`, color }}
        >
          {subject.initial}
        </div>
        <p className="font-arabic text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          {subject.nameAr}
        </p>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
        <div className="h-full rounded-full" style={{ width: `${subject.progress}%`, background: color }} />
      </div>
      <p className="font-arabic text-xs mt-1" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
        {subject.progress}% مكتمل
      </p>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}