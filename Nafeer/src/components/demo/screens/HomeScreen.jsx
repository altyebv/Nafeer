'use client';
import { useEffect, useRef, useState } from 'react';
import { DEMO_USER, SUBJECTS_BY_PATH, FOCUS_BY_PATH, SUBJECT_COLORS } from '../demoData';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen({
  onNavigate,
  userProfile,
  bonusXp    = 0,
  xpFlash    = false,
  leveledUp  = false,
  currentLevelLabel = 'طالب مبتدئ',
  level      = 1,
}) {
  const path       = userProfile?.path  || 'SCIENCE';
  const nameAr     = userProfile?.name  || DEMO_USER.nameAr;
  const grade      = userProfile?.grade;

  const { streak, dailyGoalDone, dailyGoalTotal } = DEMO_USER;
  const xp           = DEMO_USER.xp + bonusXp;
  const xpToNext     = DEMO_USER.xpToNext;
  const goalProgress = Math.round((dailyGoalDone / dailyGoalTotal) * 100);
  // Cap bar at 100% after level-up so it looks full/satisfied
  const xpProgress   = Math.min(100, Math.round((xp / xpToNext) * 100));
  const subjects     = SUBJECTS_BY_PATH[path] || SUBJECTS_BY_PATH.SCIENCE;
  const focus        = FOCUS_BY_PATH[path]    || FOCUS_BY_PATH.SCIENCE;
  const gradeLabel   = grade === '3' ? 'الثالث ثانوي' : 'الثاني ثانوي';

  // XP count-up animation
  const [displayXp, setDisplayXp] = useState(DEMO_USER.xp);
  const animRef = useRef(null);

  useEffect(() => {
    const target = xp;
    const start  = displayXp;
    if (target === start) return;
    const diff     = target - start;
    const duration = Math.min(900, Math.abs(diff) * 6);
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplayXp(Math.round(start + diff * eased));
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp]);

  return (
    <div className="pb-6" dir="rtl">

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

      {/* ── XP / Level Card (polished) ── */}
      <XpLevelCard
        xp={displayXp}
        xpToNext={xpToNext}
        xpProgress={xpProgress}
        level={level}
        levelLabel={currentLevelLabel}
        xpFlash={xpFlash}
        leveledUp={leveledUp}
      />

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
// XpLevelCard — the polished gamification card
// ─────────────────────────────────────────────────────────────────────────────
function XpLevelCard({ xp, xpToNext, xpProgress, level, levelLabel, xpFlash, leveledUp }) {
  function toAr(n) {
    return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  }

  const CIRCUMFERENCE = 2 * Math.PI * 20; // small ring r=20

  return (
    <div
      className="mx-4 mb-4 rounded-2xl p-4"
      style={{
        background:  'var(--bg-card)',
        border:      `1px solid ${leveledUp ? 'rgba(212,137,30,0.55)' : 'var(--border-subtle)'}`,
        position:    'relative',
        overflow:    'hidden',
        transition:  'border-color 0.6s ease',
        boxShadow:   leveledUp
          ? '0 0 0 1px rgba(212,137,30,0.20), 0 4px 24px rgba(212,137,30,0.18)'
          : 'none',
      }}
    >
      {/* Pulsing ember shimmer on xpFlash */}
      {xpFlash && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(212,137,30,0.16) 0%, transparent 70%)',
            animation: 'xpCardShimmer 1.6s ease-out forwards',
            pointerEvents: 'none',
            borderRadius: '16px',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

        {/* Level ring — small circular progress */}
        <div style={{ position: 'relative', flexShrink: 0, width: 52, height: 52 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(212,137,30,0.12)" strokeWidth="3.5" />
            {/* Progress */}
            <circle
              cx="26" cy="26" r="20"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - xpProgress / 100)}
              style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          {/* Level number */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'var(--font-arabic, inherit)',
              fontSize: '7px', fontWeight: 600,
              color: 'rgba(212,137,30,0.65)',
              lineHeight: 1,
            }}>
              Lv.
            </span>
            <span style={{
              fontFamily: 'var(--font-arabic, inherit)',
              fontSize: '18px', fontWeight: 900, lineHeight: 1,
              color: 'var(--accent)',
            }}>
              {toAr(level)}
            </span>
          </div>
        </div>

        {/* Right side — label + bar + XP count */}
        <div style={{ flex: 1 }}>
          {/* Top row: label + XP numbers */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px' }}>⭐</span>
              <span style={{
                fontFamily: 'var(--font-arabic, inherit)',
                fontSize: '12px', fontWeight: 700,
                color: leveledUp ? 'var(--accent)' : 'var(--text-primary)',
                transition: 'color 0.5s ease',
              }}>
                {levelLabel}
              </span>
              {leveledUp && (
                <span style={{
                  fontFamily: 'var(--font-arabic, inherit)',
                  fontSize: '10px', fontWeight: 700,
                  color: '#fff',
                  background: 'var(--accent)',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  animation: 'xpBadgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
                }}>
                  جديد!
                </span>
              )}
            </div>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              color: 'var(--text-muted)',
              direction: 'ltr',
            }}>
              {toAr(Math.min(xp, xpToNext))} / {toAr(xpToNext)}
            </span>
          </div>

          {/* XP bar */}
          <div style={{
            height: '6px', borderRadius: '3px', overflow: 'hidden',
            background: 'var(--border-subtle)',
            position: 'relative',
          }}>
            <div
              style={{
                height: '100%', borderRadius: '3px',
                width: `${xpProgress}%`,
                background: leveledUp
                  ? 'linear-gradient(90deg, var(--accent), #f0a830)'
                  : 'linear-gradient(90deg, #9B59B6, var(--accent))',
                transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1), background 0.6s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Shine sweep on flash */}
              {xpFlash && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                  animation: 'xpBarShine 0.9s ease-out forwards',
                  borderRadius: '3px',
                }} />
              )}
            </div>
          </div>

          {/* Subtext */}
          <p style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            marginTop: '5px',
          }}>
            {leveledUp
              ? `🎉 مبروك! انتقلت إلى المستوى ${toAr(level)}`
              : `${toAr(xpToNext - Math.min(xp, xpToNext))} نقطة للمستوى التالي`
            }
          </p>
        </div>
      </div>

      <style>{`
        @keyframes xpCardShimmer {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes xpBarShine {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
        @keyframes xpBadgePop {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubjectCard
// ─────────────────────────────────────────────────────────────────────────────
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

// Convert hex color to "r,g,b" string for rgba()
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}