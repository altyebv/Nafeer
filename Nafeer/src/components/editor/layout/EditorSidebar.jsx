'use client';
import { useState, useEffect } from 'react';
import Link                 from 'next/link';
import { useDataStore }    from '@/store/dataStore';
import { useMediaStore }   from '@/store/mediaStore';
import { useRouter }       from 'next/navigation';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

const SUBJECT_LABEL = Object.fromEntries(
  SUBJECTS_CATALOG.map((s) => [s.id, { ar: s.nameAr, en: s.nameEn }])
);

const RAIL_W     = 60;   // slightly wider rail for comfort
const EXPANDED_W = 260;  // slightly wider expanded for readability

// Export item removed from NAV — hidden for now
const NAV = [
  { id: 'dashboard', icon: '⌂', label: 'الرئيسية',  sub: 'Dashboard' },
  { id: 'lessons',   icon: '◈', label: 'الدروس',    sub: 'Lessons'   },
  { id: 'feeds',     icon: '▣', label: 'التغذية',   sub: 'Feed'      },
  { id: 'quizbank',  icon: '◎', label: 'الأسئلة',   sub: 'Quiz Bank' },
  { id: 'concepts',  icon: '✦', label: 'المفاهيم',  sub: 'Concepts'  },
  { id: 'media',     icon: '⬜', label: 'الوسائط',   sub: 'Media'     },
  // export hidden: { id: 'export', icon: '↑', label: 'تصدير', sub: 'Export' },
];

// ── Theme hook ─────────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const stored = localStorage.getItem('nafeer-theme') || 'dark';
    setTheme(stored);
    document.documentElement.dataset.theme = stored === 'light' ? 'light' : '';
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('nafeer-theme', next);
    document.documentElement.dataset.theme = next === 'light' ? 'light' : '';
  };
  return { theme, toggle };
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ contributor, size = 28 }) {
  const initials = (contributor?.name || 'م')
    .split(' ').slice(0, 2).map((w) => w[0]).join('');
  if (contributor?.avatarUrl) {
    return (
      <img src={contributor.avatarUrl} alt={contributor.name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, border: '2px solid rgba(212,137,30,0.45)' }}
      />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size, height: size,
        fontSize: size > 36 ? 16 : size > 24 ? 13 : 11,
        background: 'linear-gradient(135deg, rgba(212,137,30,0.9) 0%, rgba(146,79,18,0.65) 100%)',
        color: '#0e0c09',
        border: '2px solid rgba(212,137,30,0.35)',
        boxShadow: '0 2px 8px rgba(212,137,30,0.2)',
      }}>
      {initials}
    </div>
  );
}

// ── Sync dot ──────────────────────────────────────────────────────────────────
function SyncDot({ isSyncing, syncError, lastSynced }) {
  if (syncError)  return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#f87171' }} />;
  if (isSyncing)  return <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: '#fbbf24' }} />;
  if (lastSynced) return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#34d399' }} />;
  return null;
}

// ── Theme toggle icon ─────────────────────────────────────────────────────────
function ThemeToggle({ theme, toggle }) {
  const isDark = theme === 'dark';
  return (
    <button onClick={toggle}
      title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      className="shrink-0 rounded-lg flex items-center justify-center transition-all duration-150"
      style={{ width: 30, height: 30, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)', background: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? '#fcd34d' : '#92400e'; e.currentTarget.style.background = isDark ? 'rgba(252,211,77,0.08)' : 'rgba(146,64,14,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'; e.currentTarget.style.background = 'transparent'; }}
    >
      {isDark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      )}
    </button>
  );
}

// ── Sign-out icon ─────────────────────────────────────────────────────────────
function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP SIDEBAR (md+)
// ═══════════════════════════════════════════════════════════════════════════════
export function DesktopSidebar({
  currentPage, onNavigate, contributor,
  isSyncing, syncError, lastSynced,
  isOpen, onToggle,
}) {
  const { subject, lessons, concepts, feedItems, questions } = useDataStore();
  const { media } = useMediaStore();
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [annoCount, setAnnoCount] = useState(0);

  useEffect(() => {
    fetch('/api/contributors/announcements')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setAnnoCount(d.data.length); })
      .catch(() => {});
  }, []);

  const expanded = isOpen;
  const w        = expanded ? EXPANDED_W : RAIL_W;
  const isDark   = theme === 'dark';

  const sidebarBg     = isDark ? '#090806'                 : '#faf5eb';
  const sidebarBorder = isDark ? 'rgba(255,255,255,0.065)' : 'rgba(146,79,18,0.12)';
  const sidebarPanel  = isDark ? 'rgba(255,248,237,0.035)' : 'rgba(255,255,255,0.42)';
  const sidebarPanelHover = isDark ? 'rgba(212,137,30,0.08)' : 'rgba(154,85,15,0.09)';
  const sidebarShadow = expanded
    ? isDark ? '-8px 0 40px rgba(0,0,0,0.6)' : '-8px 0 40px rgba(0,0,0,0.10)'
    : 'none';

  const textDim    = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)';
  const textMid    = isDark ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.62)';
  const textActive = isDark ? '#e8d5a8'                : '#7c3c10';
  const accent     = '#d4891e';
  const profileHref = contributor?.username ? `/contributors/${encodeURIComponent(contributor.username)}` : null;

  const counts = {
    dashboard: annoCount,
    lessons:   lessons.length,
    feeds:     feedItems.length,
    quizbank:  questions.length,
    concepts:  concepts.length,
    media:     media.length,
  };

  const subjectInfo = contributor?.subject ? SUBJECT_LABEL[contributor.subject] : null;

  const syncLabel = syncError
    ? 'خطأ في الحفظ'
    : isSyncing ? 'جاري الحفظ…'
    : lastSynced
      ? `محفوظ · ${new Date(lastSynced).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <aside
      className="fixed right-0 top-0 h-screen flex flex-col z-30 overflow-hidden"
      style={{
        width: w, minWidth: w,
        transition: 'width 0.26s cubic-bezier(0.4,0,0.2,1)',
        background: sidebarBg,
        borderLeft: `1px solid ${sidebarBorder}`,
        boxShadow: sidebarShadow,
      }}
    >
      {/* ── Avatar / Identity block (top, expanded) ──────────────────── */}
      <div
        className="shrink-0 flex flex-col items-center overflow-hidden transition-all duration-300"
        style={{
          maxHeight: expanded ? 170 : 0,
          opacity: expanded ? 1 : 0,
          padding: expanded ? '20px 16px 16px' : '0 16px',
          borderBottom: expanded ? `1px solid ${sidebarBorder}` : 'none',
        }}
      >
        {/* Avatar + identity — clickable link to public profile */}
        <Link
          href={profileHref || '#'}
          aria-disabled={!profileHref}
          title="عرض الملف الشخصي"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
            textDecoration: 'none', width: '100%',
            borderRadius: 16, padding: '12px 10px 10px',
            transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
            cursor: profileHref ? 'pointer' : 'default',
            background: sidebarPanel,
            border: `1px solid ${sidebarBorder}`,
            boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.035)' : 'inset 0 1px 0 rgba(255,255,255,0.55)',
          }}
          onClick={(e) => { if (!profileHref) e.preventDefault(); }}
          onMouseEnter={(e) => {
            if (!profileHref) return;
            e.currentTarget.style.background = sidebarPanelHover;
            e.currentTarget.style.borderColor = 'rgba(212,137,30,0.24)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = sidebarPanel;
            e.currentTarget.style.borderColor = sidebarBorder;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Avatar contributor={contributor} size={52} />

          {contributor && (
            <div className="mt-3 text-center w-full">
              <p style={{
                fontSize: 14, fontWeight: 700,
                color: textMid,
                fontFamily: 'var(--font-arabic, serif)',
                lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {contributor.name || ''}
              </p>
              {contributor.username && (
                <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(212,137,30,0.55)', marginTop: 2 }}>
                  @{contributor.username}
                </p>
              )}
              {subjectInfo && (
                <div className="mt-2 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg mx-auto w-fit"
                  style={{ background: 'rgba(212,137,30,0.07)', border: '1px solid rgba(212,137,30,0.15)' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: accent, fontFamily: 'var(--font-arabic, serif)', lineHeight: 1.2 }}>
                    {subjectInfo.ar}
                  </span>
                  <span style={{ fontSize: 9, color: 'rgba(212,137,30,0.5)', fontFamily: 'monospace' }}>
                    {subjectInfo.en}
                  </span>
                </div>
              )}
              {profileHref && (
                <p style={{
                  marginTop: 10,
                  fontSize: 10,
                  color: textDim,
                  fontFamily: 'var(--font-arabic, serif)',
                }}>
                  عرض الملف العام
                </p>
              )}
            </div>
          )}
        </Link>
      </div>

      {/* ── Header (brand + toggle) ──────────────────────────────────── */}
      <div className="flex items-center shrink-0"
        style={{
          height: 52,
          padding: expanded ? '0 12px' : '0',
          borderBottom: `1px solid ${sidebarBorder}`,
          justifyContent: expanded ? 'flex-start' : 'center',
          gap: expanded ? 8 : 0,
        }}
      >
        {/* Toggle / logo button */}
        <button onClick={onToggle}
          title={expanded ? 'طي القائمة' : 'توسيع القائمة'}
          className="shrink-0 flex items-center justify-center rounded-lg transition-all duration-150"
          style={{
            width: 34, height: 34,
            background: expanded ? 'rgba(212,137,30,0.10)' : 'rgba(212,137,30,0.08)',
            border: '1px solid rgba(212,137,30,0.22)',
            color: accent,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,137,30,0.18)'; e.currentTarget.style.borderColor = 'rgba(212,137,30,0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = expanded ? 'rgba(212,137,30,0.10)' : 'rgba(212,137,30,0.08)'; e.currentTarget.style.borderColor = 'rgba(212,137,30,0.22)'; }}
        >
          {expanded ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="4,2 8,6 4,10" />
            </svg>
          ) : (
            <span style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-arabic, serif)', lineHeight: 1 }}>ن</span>
          )}
        </button>

        {/* Brand text — only when expanded */}
        <div className="flex flex-col min-w-0 flex-1 transition-all duration-200"
          style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? 160 : 0, overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
          <span style={{ fontSize: 14, fontWeight: 800, color: accent, fontFamily: 'var(--font-arabic, serif)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>نفير</span>
          <span style={{ fontSize: 10, color: textDim, fontFamily: 'monospace', letterSpacing: '0.12em' }}>EDITOR</span>
        </div>

        {expanded && <ThemeToggle theme={theme} toggle={toggleTheme} />}
      </div>

      {/* ── Collapsed avatar (rail mode) ────────────────────────────── */}
      {!expanded && contributor && (
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <Link
            href={profileHref || '#'}
            aria-disabled={!profileHref}
            title={contributor.name || 'الملف الشخصي'}
            style={{
              display: 'block',
              borderRadius: '50%',
              padding: 3,
              transition: 'background 0.15s ease, transform 0.15s ease',
              cursor: profileHref ? 'pointer' : 'default',
              background: sidebarPanel,
              border: `1px solid ${sidebarBorder}`,
            }}
            onClick={(e) => { if (!profileHref) e.preventDefault(); }}
            onMouseEnter={(e) => {
              if (!profileHref) return;
              e.currentTarget.style.background = sidebarPanelHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = sidebarPanel;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Avatar contributor={contributor} size={34} />
          </Link>
        </div>
      )}

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 flex flex-col py-2 w-full overflow-hidden">
        {NAV.map((item) => {
          const active = currentPage === item.id || (currentPage === 'editor' && item.id === 'lessons');
          const count  = counts[item.id];

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={!expanded ? item.label : undefined}
              className="relative flex items-center w-full transition-all duration-150 group"
              style={{
                height: 44,
                padding: expanded ? '0 14px' : '0',
                justifyContent: expanded ? 'flex-start' : 'center',
                gap: expanded ? 11 : 0,
                color: active ? textActive : textDim,
                background: active ? 'rgba(212,137,30,0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = textMid;
                e.currentTarget.style.background = active ? 'rgba(212,137,30,0.11)' : 'rgba(212,137,30,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = active ? textActive : textDim;
                e.currentTarget.style.background = active ? 'rgba(212,137,30,0.08)' : 'transparent';
              }}
            >
              {/* Active accent bar */}
              {active && (
                <span className="absolute right-0 rounded-l"
                  style={{ width: 3, height: 22, top: '50%', transform: 'translateY(-50%)', background: accent }}
                />
              )}
              {/* Icon */}
              <span className="shrink-0 transition-colors duration-150"
                style={{ fontSize: 14, fontFamily: 'monospace', lineHeight: 1, color: active ? accent : 'inherit' }}>
                {item.icon}
              </span>
              {/* Label */}
              <div className="flex flex-col min-w-0 text-right transition-all duration-200 flex-1"
                style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? 160 : 0, overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-arabic, serif)', lineHeight: 1.35, color: 'inherit' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: textDim, lineHeight: 1.2 }}>{item.sub}</span>
              </div>
              {/* Count badge */}
              {count != null && count > 0 && (
                <span className="shrink-0 transition-all duration-200"
                  style={{
                    fontSize: 10, fontFamily: 'monospace',
                    padding: '2px 6px', borderRadius: 6,
                    background: active ? 'rgba(212,137,30,0.18)' : 'rgba(128,128,128,0.08)',
                    color: active ? accent : textDim,
                    border: `1px solid ${active ? 'rgba(212,137,30,0.28)' : 'rgba(128,128,128,0.12)'}`,
                    opacity: expanded ? 1 : 0.85,
                    position: expanded ? 'static' : 'absolute',
                    top: expanded ? 'auto' : 4, left: expanded ? 'auto' : 3,
                  }}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Sync row ────────────────────────────────────────────────── */}
      {(isSyncing || syncError || lastSynced) && (
        <div className="shrink-0 overflow-hidden transition-all duration-300 flex items-center"
          style={{
            height: expanded ? 30 : 26,
            padding: expanded ? '0 14px' : '0',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: 7,
            borderTop: `1px solid ${sidebarBorder}`,
            background: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <SyncDot isSyncing={isSyncing} syncError={syncError} lastSynced={lastSynced} />
          {expanded && syncLabel && (
            <span style={{ fontSize: 11, fontFamily: 'var(--font-arabic, serif)', color: textDim, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {syncLabel}
            </span>
          )}
        </div>
      )}

      {/* ── Profile footer (sign out + theme, collapsed) ─────────────── */}
      <div className="shrink-0 flex items-center overflow-hidden"
        style={{
          height: expanded ? 52 : 48,
          padding: expanded ? '0 10px' : '0',
          borderTop: `1px solid ${sidebarBorder}`,
          justifyContent: expanded ? 'flex-end' : 'center',
          gap: expanded ? 6 : 0,
          transition: 'height 0.26s ease, padding 0.26s ease',
        }}
      >
        {/* In collapsed state: theme toggle above sign-out */}
        {!expanded && (
          <div style={{ position: 'absolute', bottom: 54, right: 0, width: RAIL_W, display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <ThemeToggle theme={theme} toggle={toggleTheme} />
          </div>
        )}

        {/* In expanded state: just sign-out (avatar+name are in the top block) */}
        {expanded && (
          <button
            onClick={async () => { await fetch('/api/auth/signout', { method: 'POST' }); router.push('/'); }}
            title="تسجيل الخروج"
            className="shrink-0 transition-all duration-150 rounded-lg flex items-center gap-2 px-3 py-1.5"
            style={{ color: textDim, background: 'transparent', fontSize: 11, fontFamily: 'var(--font-arabic, serif)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = textDim; e.currentTarget.style.background = 'transparent'; }}
          >
            <SignOutIcon />
            <span>خروج</span>
          </button>
        )}

        {/* Collapsed: just the icon */}
        {!expanded && (
          <button
            onClick={async () => { await fetch('/api/auth/signout', { method: 'POST' }); router.push('/'); }}
            title="تسجيل الخروج"
            className="flex items-center justify-center transition-colors"
            style={{ width: 30, height: 30, color: textDim }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = textDim)}
          >
            <SignOutIcon />
          </button>
        )}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE BOTTOM NAV (< md)
// ═══════════════════════════════════════════════════════════════════════════════
const MOBILE_PRIMARY = ['dashboard', 'lessons', 'quizbank', 'concepts', 'feeds'];

export function MobileBottomNav({
  currentPage, onNavigate, contributor,
  isSyncing, syncError, lastSynced,
  moreOpen, onToggleMore,
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const navBg      = isDark ? 'rgba(9,8,6,0.97)'      : 'rgba(250,245,235,0.97)';
  const border     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(146,79,18,0.12)';
  const textDim    = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)';
  const textActive = isDark ? '#e8d5a8'                : '#7c3c10';
  const accent     = '#d4891e';

  const primaryNav = NAV.filter((n) => MOBILE_PRIMARY.includes(n.id));

  return (
    <>
      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          height: 64,
          background: navBg,
          borderTop: `1px solid ${border}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {primaryNav.map((item) => {
          const active = currentPage === item.id || (currentPage === 'editor' && item.id === 'lessons');
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); if (moreOpen) onToggleMore(); }}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 relative"
              style={{ color: active ? textActive : textDim }}
            >
              {active && (
                <span className="absolute bottom-0 rounded-t-sm"
                  style={{ width: 24, height: 2.5, background: accent }}
                />
              )}
              <span style={{ fontSize: 15, fontFamily: 'monospace', lineHeight: 1, color: active ? accent : 'inherit' }}>
                {item.icon}
              </span>
              <span style={{ fontSize: 10.5, fontFamily: 'var(--font-arabic, serif)', fontWeight: active ? 700 : 400, lineHeight: 1 }}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={onToggleMore}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 relative"
          style={{ color: moreOpen ? textActive : textDim }}
        >
          {(isSyncing || syncError || lastSynced) && (
            <span className="absolute top-2 right-[calc(50%-10px)]">
              <SyncDot isSyncing={isSyncing} syncError={syncError} lastSynced={lastSynced} />
            </span>
          )}
          <span style={{ fontSize: 15, fontFamily: 'monospace', lineHeight: 1, color: moreOpen ? accent : 'inherit' }}>≡</span>
          <span style={{ fontSize: 10.5, fontFamily: 'var(--font-arabic, serif)', lineHeight: 1 }}>المزيد</span>
        </button>
      </nav>

      {/* More drawer */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
            onClick={onToggleMore}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
            style={{
              background: isDark ? '#100e0b' : '#f5ede0',
              border: `1px solid ${border}`,
              borderBottom: 'none',
              boxShadow: '0 -16px 48px rgba(0,0,0,0.4)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)' }} />
            </div>

            <div className="px-4 pb-5 space-y-1.5">
              {/* Non-primary nav items (export excluded since it's gone from NAV) */}
              {NAV.filter((n) => !MOBILE_PRIMARY.includes(n.id)).map((item) => {
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); onToggleMore(); }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-150"
                    style={{
                      background: active ? 'rgba(212,137,30,0.10)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? 'rgba(212,137,30,0.25)' : 'rgba(255,255,255,0.06)'}`,
                      color: active ? textActive : textDim,
                    }}
                  >
                    <span style={{ fontSize: 17, fontFamily: 'monospace', color: active ? accent : 'inherit' }}>{item.icon}</span>
                    <div className="flex flex-col text-right">
                      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-arabic, serif)', color: 'inherit' }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: textDim }}>{item.sub}</span>
                    </div>
                  </button>
                );
              })}

              <div className="h-px my-1" style={{ background: border }} />

              {/* Profile */}
              {contributor && (
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${border}` }}
                >
                  <Avatar contributor={contributor} size={40} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-arabic, serif)', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                      {contributor.name}
                    </p>
                    {contributor.username && (
                      <p style={{ fontSize: 11, fontFamily: 'monospace', color: textDim }}>@{contributor.username}</p>
                    )}
                  </div>
                  <button
                    onClick={async () => { await fetch('/api/auth/signout', { method: 'POST' }); router.push('/'); }}
                    className="flex items-center justify-center rounded-lg transition-colors"
                    style={{ width: 38, height: 38, color: textDim }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = textDim; }}
                  >
                    <SignOutIcon />
                  </button>
                </div>
              )}

              {/* Sync status */}
              {(isSyncing || syncError || lastSynced) && (
                <div className="flex items-center gap-2 px-4 py-2">
                  <SyncDot isSyncing={isSyncing} syncError={syncError} lastSynced={lastSynced} />
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-arabic, serif)', color: textDim }}>
                    {syncError ? 'خطأ في الحفظ' : isSyncing ? 'جاري الحفظ…' : lastSynced ? `محفوظ · ${new Date(lastSynced).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function EditorSidebar(props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (isMobile) {
    return (
      <MobileBottomNav
        {...props}
        moreOpen={moreOpen}
        onToggleMore={() => setMoreOpen((v) => !v)}
      />
    );
  }

  return <DesktopSidebar {...props} />;
}
