'use client';
import { DEMO_PROFILE } from '../demoData';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

const DAYS_AR = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];

// ─────────────────────────────────────────────────────────────────────────────
// ProfileScreen — displays user profile, stats, and weekly activity
// Accepts optional userProfile from onboarding
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ userProfile }) {
  const name   = userProfile?.name  || DEMO_PROFILE.nameAr;
  const path   = userProfile?.path  || 'SCIENCE';
  const grade  = userProfile?.grade;

  const pathLabel  = path === 'SCIENCE' ? 'مسار علمي' : 'مسار أدبي';
  const gradeLabel = grade === '3' ? 'الثالث ثانوي' : 'الثاني ثانوي';
  const roleAr     = grade ? `${gradeLabel} · ${pathLabel}` : DEMO_PROFILE.roleAr;

  // Avatar: first letter of name
  const avatarInitial = name?.charAt(0) || 'ط';

  const { stats, activityWeek } = DEMO_PROFILE;
  const maxActivity = Math.max(...activityWeek);

  return (
    <div className="w-full pb-6" dir="rtl">
      {/* ── Hero header ── */}
      <div className="px-4 pt-4 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-arabic text-xl font-bold flex-shrink-0"
            style={{
              background: 'rgba(212,137,30,0.15)',
              border: '1px solid rgba(212,137,30,0.28)',
              color: 'var(--accent)',
            }}
          >
            {avatarInitial}
          </div>
          <div>
            <h2 className="font-arabic text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {name}
            </h2>
            <p className="font-arabic text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{roleAr}</p>
            <p className="font-arabic text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
              {DEMO_PROFILE.joinedAr}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-4 pb-3">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="font-arabic text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="font-arabic text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Weekly activity ── */}
      <div
        className="mx-4 mb-4 rounded-xl p-3.5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="font-arabic text-xs font-bold mb-3" style={{ color: 'var(--text-primary)' }}>نشاط الأسبوع</p>
        <div className="flex items-end justify-between gap-1.5">
          {activityWeek.map((count, i) => {
            const heightPct = maxActivity > 0 ? (count / maxActivity) : 0;
            const isToday = i === 6;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${Math.max(heightPct * 48, 4)}px`,
                    background: isToday ? 'var(--accent)' : 'rgba(212,137,30,0.25)',
                    transition: 'height 0.5s ease',
                  }}
                />
                <span
                  className="font-arabic"
                  style={{ fontSize: '9px', color: isToday ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  {DAYS_AR[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="px-4 flex flex-col gap-2">
        {[
          { icon: '📊', label: 'إحصائياتي التفصيلية', note: 'قريباً' },
          { icon: '🏆', label: 'شاراتي وإنجازاتي',   note: 'قريباً' },
          { icon: '⚙️', label: 'الإعدادات',           note: '' },
        ].map(({ icon, label, note }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              opacity: note ? 0.55 : 1,
            }}
          >
            <span style={{ fontSize: '16px' }}>{icon}</span>
            <p className="font-arabic text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
            {note && (
              <span
                className="font-arabic text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(212,137,30,0.10)', color: 'var(--accent)', fontSize: '10px' }}
              >
                {note}
              </span>
            )}
            {!note && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}