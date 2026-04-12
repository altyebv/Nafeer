'use client';
import { DEMO_USER, SUBJECTS_BY_PATH, FOCUS_BY_PATH, SUBJECT_COLORS } from '../demoData';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen — accepts optional userProfile from onboarding
// Falls back to DEMO_USER / SCIENCE defaults if not provided
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen({ onNavigate, userProfile, bonusXp = 0 }) {
  const path       = userProfile?.path  || 'SCIENCE';
  const nameAr     = userProfile?.name  || DEMO_USER.nameAr;
  const grade      = userProfile?.grade;

  const { streak, dailyGoalDone, dailyGoalTotal } = DEMO_USER;
  const xp         = DEMO_USER.xp + bonusXp;
  const xpToNext   = DEMO_USER.xpToNext;
  const goalProgress = Math.round((dailyGoalDone / dailyGoalTotal) * 100);
  const xpProgress   = Math.round((xp / xpToNext) * 100);
  const subjects     = SUBJECTS_BY_PATH[path] || SUBJECTS_BY_PATH.SCIENCE;
  const focus        = FOCUS_BY_PATH[path]    || FOCUS_BY_PATH.SCIENCE;
  const gradeLabel   = grade === '3' ? 'الثالث ثانوي' : 'الثاني ثانوي';

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

      {/* ── XP Bar ── */}
      <div
        className="mx-4 mb-4 rounded-2xl p-3.5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '14px' }}>⭐</span>
            <p className="font-arabic text-xs font-bold" style={{ color: 'var(--text-primary)' }}>نقاط XP</p>
          </div>
          <p className="font-arabic text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {toAr(xp)} / {toAr(xpToNext)}
          </p>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg, #9B59B6, #d4891e)' }}
          />
        </div>
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