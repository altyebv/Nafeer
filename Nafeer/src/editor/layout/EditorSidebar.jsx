'use client';
import { useState, useEffect } from 'react';
import { useDataStore }    from '@/store/dataStore';
import { useMediaStore }   from '@/store/mediaStore';
import { useRouter }       from 'next/navigation';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

const SUBJECT_LABEL = Object.fromEntries(
  SUBJECTS_CATALOG.map((s) => [s.id, { ar: s.nameAr, en: s.nameEn }])
);

const COLLAPSED_W = 52;
const EXPANDED_W  = 240;

const NAV = [
  { id: 'lessons',  icon: '◈', label: 'الدروس',   sub: 'Lessons'   },
  { id: 'feeds',    icon: '▣', label: 'التغذية',   sub: 'Feed'      },
  { id: 'quizbank', icon: '◎', label: 'الأسئلة',   sub: 'Quiz Bank' },
  { id: 'concepts', icon: '✦', label: 'المفاهيم',  sub: 'Concepts'  },
  { id: 'media',    icon: '⬜', label: 'الوسائط',   sub: 'Media'     },
  { id: 'export',   icon: '↑', label: 'تصدير',     sub: 'Export'    },
];

// ── Theme hook ────────────────────────────────────────────────────────────────
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
function Avatar({ contributor, size = 28, expanded = false }) {
  const initials = (contributor?.name || 'م')
    .split(' ').slice(0, 2).map((w) => w[0]).join('');

  const avatarSize = expanded ? 34 : size;

  if (contributor?.avatarUrl) {
    return (
      <img
        src={contributor.avatarUrl}
        alt={contributor.name}
        className="rounded-full object-cover shrink-0 transition-all duration-300"
        style={{
          width: avatarSize,
          height: avatarSize,
          border: '1.5px solid rgba(212,137,30,0.45)',
        }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300"
      style={{
        width:      avatarSize,
        height:     avatarSize,
        fontSize:   expanded ? 13 : 11,
        background: 'linear-gradient(135deg, rgba(212,137,30,0.9) 0%, rgba(146,79,18,0.65) 100%)',
        color:      '#0e0c09',
        border:     '1.5px solid rgba(212,137,30,0.3)',
      }}
    >
      {initials}
    </div>
  );
}

// ── Sync dot ──────────────────────────────────────────────────────────────────
function SyncDot({ isSyncing, syncError, lastSynced }) {
  if (syncError)  return <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#f87171' }} title="خطأ في الحفظ" />;
  if (isSyncing)  return <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: '#fbbf24' }} title="جاري الحفظ" />;
  if (lastSynced) return <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#34d399' }} title="محفوظ" />;
  return null;
}

// ── ThemeToggle ───────────────────────────────────────────────────────────────
function ThemeToggle({ theme, toggle, expanded }) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      title={isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
      className="shrink-0 rounded-lg flex items-center justify-center transition-all duration-150"
      style={{
        width:      28,
        height:     28,
        color:      isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color      = isDark ? '#fcd34d' : '#92400e';
        e.currentTarget.style.background = isDark ? 'rgba(252,211,77,0.08)' : 'rgba(146,64,14,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color      = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {isDark ? (
        /* Moon icon */
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      ) : (
        /* Sun icon */
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      )}
    </button>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────────────
export default function EditorSidebar({
  currentPage,
  onNavigate,
  contributor,
  isSyncing,
  syncError,
  lastSynced,
  isOpen,
  onToggle,
}) {
  const { subject, lessons, concepts, feedItems, questions } = useDataStore();
  const { media }  = useMediaStore();
  const router     = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();

  const expanded = isOpen;
  const w        = expanded ? EXPANDED_W : COLLAPSED_W;

  const isDark = theme === 'dark';

  // Sidebar surface colors — theme-aware
  const sidebarBg      = isDark ? '#0a0906'             : '#faf5eb';
  const sidebarBorder  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(146,79,18,0.12)';
  const sidebarShadow  = expanded
    ? isDark
      ? '-6px 0 32px rgba(0,0,0,0.55)'
      : '-6px 0 32px rgba(0,0,0,0.12)'
    : 'none';

  const textDim     = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)';
  const textMid     = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const textActive  = isDark ? '#e8d5a8'                : '#7c3c10';
  const activeAccent = '#d4891e';

  const counts = {
    lessons:  lessons.length,
    feeds:    feedItems.length,
    quizbank: questions.length,
    concepts: concepts.length,
    media:    media.length,
    export:   null,
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  };

  const subjectInfo = contributor?.subject
    ? SUBJECT_LABEL[contributor.subject]
    : null;

  const syncLabel = syncError
    ? 'خطأ في الحفظ'
    : isSyncing
    ? 'جاري الحفظ…'
    : lastSynced
    ? `محفوظ · ${new Date(lastSynced).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <aside
      className="fixed right-0 top-0 h-screen flex flex-col z-30 overflow-hidden"
      style={{
        width:      w,
        minWidth:   w,
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        background: sidebarBg,
        borderLeft: `1px solid ${sidebarBorder}`,
        boxShadow:  sidebarShadow,
      }}
    >

      {/* ── Header / Logo + toggle ───────────────────────────────────────── */}
      <div
        className="flex items-center shrink-0"
        style={{
          height: 52,
          padding: expanded ? '0 12px' : '0',
          borderBottom: `1px solid ${sidebarBorder}`,
          justifyContent: expanded ? 'flex-start' : 'center',
          gap: expanded ? 8 : 0,
        }}
      >
        {/* Toggle button — acts as logo when collapsed */}
        <button
          onClick={onToggle}
          title={expanded ? 'طي القائمة' : 'توسيع القائمة'}
          className="shrink-0 flex items-center justify-center rounded-lg transition-all duration-150"
          style={{
            width: 30,
            height: 30,
            background: expanded ? 'rgba(212,137,30,0.1)' : 'rgba(212,137,30,0.08)',
            border: '1px solid rgba(212,137,30,0.2)',
            color: '#d4891e',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,137,30,0.16)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = expanded ? 'rgba(212,137,30,0.1)' : 'rgba(212,137,30,0.08)'; }}
        >
          {expanded ? (
            /* Collapse chevron (→ in RTL, closes sidebar toward right) */
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="4,2 8,6 4,10" />
            </svg>
          ) : (
            /* Logo glyph */
            <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-arabic, serif)', lineHeight: 1 }}>
              ن
            </span>
          )}
        </button>

        {/* Brand text — only when expanded */}
        <div
          className="flex flex-col min-w-0 flex-1 transition-all duration-200"
          style={{
            opacity:    expanded ? 1 : 0,
            maxWidth:   expanded ? 140 : 0,
            overflow:   'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: '#d4891e',
            fontFamily: 'var(--font-arabic, serif)',
            lineHeight: 1.2,
          }}>
            نفير
          </span>
          <span style={{ fontSize: 9, color: textDim, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            EDITOR
          </span>
        </div>

        {/* Theme toggle — only when expanded */}
        {expanded && (
          <ThemeToggle theme={theme} toggle={toggleTheme} expanded={expanded} />
        )}
      </div>

      {/* ── Subject chip ──────────────────────────────────────────────────── */}
      {subjectInfo && (
        <div
          className="shrink-0 overflow-hidden transition-all duration-300"
          style={{
            maxHeight:    expanded ? 48 : 0,
            opacity:      expanded ? 1  : 0,
            padding:      expanded ? '8px 12px' : '0 12px',
            borderBottom: expanded ? `1px solid ${sidebarBorder}` : 'none',
          }}
        >
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(212,137,30,0.07)', border: '1px solid rgba(212,137,30,0.15)' }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#d4891e', fontFamily: 'var(--font-arabic, serif)', lineHeight: 1.2 }}>
              {subjectInfo.ar}
            </span>
            <span style={{ fontSize: 9, color: 'rgba(212,137,30,0.5)', fontFamily: 'monospace' }}>
              {subjectInfo.en}
            </span>
          </div>
        </div>
      )}

      {/* ── Nav items ─────────────────────────────────────────────────────── */}
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
                height:         42,
                padding:        expanded ? '0 12px' : '0',
                justifyContent: expanded ? 'flex-start' : 'center',
                gap:            expanded ? 10 : 0,
                color:          active ? textActive : textDim,
                background:     active ? 'rgba(212,137,30,0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = textMid;
                e.currentTarget.style.background = active ? 'rgba(212,137,30,0.10)' : 'rgba(212,137,30,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color      = active ? textActive : textDim;
                e.currentTarget.style.background = active ? 'rgba(212,137,30,0.08)' : 'transparent';
              }}
            >
              {/* Active bar — right edge in RTL */}
              {active && (
                <span
                  className="absolute right-0 rounded-l"
                  style={{ width: 2.5, height: 22, top: '50%', transform: 'translateY(-50%)', background: activeAccent }}
                />
              )}

              {/* Icon */}
              <span
                className="shrink-0 transition-colors duration-150"
                style={{ fontSize: 13, fontFamily: 'monospace', lineHeight: 1, color: active ? activeAccent : 'inherit' }}
              >
                {item.icon}
              </span>

              {/* Label + sub — expanded only */}
              <div
                className="flex flex-col min-w-0 text-right transition-all duration-200 flex-1"
                style={{
                  opacity:    expanded ? 1 : 0,
                  maxWidth:   expanded ? 130 : 0,
                  overflow:   'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-arabic, serif)', lineHeight: 1.3, color: 'inherit' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: textDim, lineHeight: 1.2 }}>
                  {item.sub}
                </span>
              </div>

              {/* Count badge */}
              {count != null && count > 0 && (
                <span
                  className="shrink-0 transition-all duration-200"
                  style={{
                    fontSize:     9,
                    fontFamily:   'monospace',
                    padding:      '1px 5px',
                    borderRadius: 6,
                    background:   active ? 'rgba(212,137,30,0.18)' : 'rgba(128,128,128,0.08)',
                    color:        active ? '#d4891e' : textDim,
                    border:       `1px solid ${active ? 'rgba(212,137,30,0.28)' : 'rgba(128,128,128,0.12)'}`,
                    opacity:      expanded ? 1 : 0.8,
                    position:     expanded ? 'static' : 'absolute',
                    top:          expanded ? 'auto' : 5,
                    left:         expanded ? 'auto' : 4,
                  }}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Sync status ───────────────────────────────────────────────────── */}
      {(isSyncing || syncError || lastSynced) && (
        <div
          className="shrink-0 overflow-hidden transition-all duration-300 flex items-center"
          style={{
            height:         expanded ? 30 : 26,
            padding:        expanded ? '0 12px' : '0',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap:            6,
            borderTop:      `1px solid ${sidebarBorder}`,
            background:     isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <SyncDot isSyncing={isSyncing} syncError={syncError} lastSynced={lastSynced} />
          {expanded && syncLabel && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-arabic, serif)', color: textDim, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {syncLabel}
            </span>
          )}
        </div>
      )}

      {/* ── Profile + theme (collapsed) + sign out ────────────────────────── */}
      <div
        className="shrink-0 flex items-center overflow-hidden"
        style={{
          height:         expanded ? 58 : 52,
          padding:        expanded ? '0 10px' : '0',
          borderTop:      `1px solid ${sidebarBorder}`,
          justifyContent: expanded ? 'flex-start' : 'center',
          gap:            expanded ? 8 : 0,
          transition:     'height 0.28s ease, padding 0.28s ease',
        }}
      >
        {/* Theme toggle in collapsed state — lives here */}
        {!expanded && (
          <div style={{ position: 'absolute', bottom: 60, right: 0, width: COLLAPSED_W, display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <ThemeToggle theme={theme} toggle={toggleTheme} expanded={false} />
          </div>
        )}

        {contributor ? (
          <>
            <Avatar contributor={contributor} size={26} expanded={expanded} />

            {/* Name + username — expanded only */}
            <div
              className="flex flex-col min-w-0 flex-1 transition-all duration-200"
              style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? 110 : 0, overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: textMid, fontFamily: 'var(--font-arabic, serif)', lineHeight: 1.3 }}>
                {(contributor.name || '').split(' ')[0]}
              </span>
              {contributor.username && (
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: textDim }}>
                  @{contributor.username}
                </span>
              )}
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              title="تسجيل الخروج"
              className="shrink-0 transition-all duration-150 rounded-lg flex items-center justify-center"
              style={{ width: 28, height: 28, color: textDim, background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = textDim; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={handleSignOut}
            title="تسجيل الخروج"
            className="flex items-center justify-center transition-colors"
            style={{ width: 28, height: 28, color: textDim, background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = textDim)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}