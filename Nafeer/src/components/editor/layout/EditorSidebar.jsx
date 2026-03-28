'use client';
import { useState }        from 'react';
import { useDataStore }    from '@/store/dataStore';
import { useMediaStore }   from '@/store/mediaStore';
import { useRouter }       from 'next/navigation';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

// ── Build subject label map ───────────────────────────────────────────────────
const SUBJECT_LABEL = Object.fromEntries(
  SUBJECTS_CATALOG.map((s) => [s.id, { ar: s.nameAr, en: s.nameEn }])
);

const COLLAPSED_W = 48;   // px
const EXPANDED_W  = 200;  // px

const NAV = [
  { id: 'lessons',  icon: '◈', label: 'الدروس',   sub: 'Lessons'   },
  { id: 'feeds',    icon: '▣', label: 'التغذية',   sub: 'Feed'      },
  { id: 'quizbank', icon: '◎', label: 'الأسئلة',   sub: 'Quiz Bank' },
  { id: 'concepts', icon: '✦', label: 'المفاهيم',  sub: 'Concepts'  },
  { id: 'media',    icon: '⬜', label: 'الوسائط',   sub: 'Media'     },
  { id: 'export',   icon: '↑', label: 'تصدير',     sub: 'Export'    },
];

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ contributor, size = 28, expanded = false }) {
  const initials = (contributor?.name || 'م')
    .split(' ').slice(0, 2).map((w) => w[0]).join('');

  if (contributor?.avatarUrl) {
    return (
      <img
        src={contributor.avatarUrl}
        alt={contributor.name}
        className="rounded-full object-cover shrink-0 transition-all duration-300"
        style={{
          width: expanded ? 36 : size,
          height: expanded ? 36 : size,
          border: '1.5px solid rgba(212,137,30,0.5)',
        }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300"
      style={{
        width:      expanded ? 36 : size,
        height:     expanded ? 36 : size,
        fontSize:   expanded ? 13 : 11,
        background: 'linear-gradient(135deg, rgba(212,137,30,0.85) 0%, rgba(146,79,18,0.6) 100%)',
        color:      '#0e0c09',
        border:     '1.5px solid rgba(212,137,30,0.35)',
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

// ── Main sidebar ──────────────────────────────────────────────────────────────
export default function EditorSidebar({
  currentPage,
  onNavigate,
  contributor,
  isSyncing,
  syncError,
  lastSynced,
}) {
  const { subject, lessons, concepts, feedItems, questions } = useDataStore();
  const { media }  = useMediaStore();
  const router     = useRouter();
  const [hovered, setHovered] = useState(false);

  const expanded = hovered;
  const w        = expanded ? EXPANDED_W : COLLAPSED_W;

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

  // Sync status text for expanded state
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
        background: '#0c0a07',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        boxShadow:  expanded
          ? '-6px 0 32px rgba(0,0,0,0.5), -1px 0 0 rgba(255,255,255,0.03)'
          : '-1px 0 0 rgba(255,255,255,0.03)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >

      {/* ── Header / Logo ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center overflow-hidden shrink-0"
        style={{
          height: 52,
          padding: expanded ? '0 14px' : '0',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          justifyContent: expanded ? 'flex-start' : 'center',
          gap: expanded ? 10 : 0,
        }}
      >
        {/* Logo glyph */}
        <div
          className="shrink-0 flex items-center justify-center rounded-lg transition-all duration-300"
          style={{
            width: 28, height: 28,
            background:   'rgba(212,137,30,0.1)',
            border:       '1px solid rgba(212,137,30,0.2)',
            color:        '#d4891e',
            fontWeight:   700,
            fontSize:     14,
            fontFamily:   'var(--font-arabic, serif)',
          }}
        >
          ن
        </div>

        {/* Brand text — only when expanded */}
        <div
          className="flex flex-col min-w-0 transition-all duration-200"
          style={{
            opacity:   expanded ? 1 : 0,
            maxWidth:  expanded ? 120 : 0,
            overflow:  'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontSize: 13, fontWeight: 700,
              color: '#d4891e',
              fontFamily: 'var(--font-arabic, serif)',
              lineHeight: 1.2,
            }}
          >
            نفير
          </span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
            EDITOR
          </span>
        </div>
      </div>

      {/* ── Subject chip ──────────────────────────────────────────────────── */}
      {subjectInfo && (
        <div
          className="shrink-0 overflow-hidden transition-all duration-300"
          style={{
            maxHeight:    expanded ? 44 : 0,
            opacity:      expanded ? 1  : 0,
            padding:      expanded ? '8px 14px' : '0 14px',
            borderBottom: expanded ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
        >
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(212,137,30,0.07)', border: '1px solid rgba(212,137,30,0.15)' }}
          >
            <span
              style={{ fontSize: 11, fontWeight: 700, color: '#d4891e', fontFamily: 'var(--font-arabic, serif)', lineHeight: 1.2 }}
            >
              {subjectInfo.ar}
            </span>
            <span style={{ fontSize: 9, color: 'rgba(212,137,30,0.4)', fontFamily: 'monospace' }}>
              {subjectInfo.en}
            </span>
          </div>
        </div>
      )}

      {/* ── Nav items ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 flex flex-col py-3 w-full overflow-hidden">
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
                height:     44,
                padding:    expanded ? '0 14px' : '0',
                justifyContent: expanded ? 'flex-start' : 'center',
                gap:        expanded ? 12 : 0,
                color:      active ? '#e2c98a' : 'rgba(255,255,255,0.25)',
                background: active
                  ? 'rgba(212,137,30,0.07)'
                  : 'transparent',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = active ? 'rgba(212,137,30,0.07)' : 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = active ? '#e2c98a' : 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = active ? 'rgba(212,137,30,0.07)' : 'transparent'; }}
            >
              {/* Active bar */}
              {active && (
                <span
                  className="absolute right-0 rounded-l"
                  style={{ width: 2, height: 20, top: '50%', transform: 'translateY(-50%)', background: '#d4891e' }}
                />
              )}

              {/* Icon */}
              <span
                className="shrink-0 transition-colors duration-150"
                style={{ fontSize: 14, fontFamily: 'monospace', lineHeight: 1, color: active ? '#d4891e' : 'inherit' }}
              >
                {item.icon}
              </span>

              {/* Label + sub — expanded only */}
              <div
                className="flex flex-col min-w-0 text-right transition-all duration-200"
                style={{
                  opacity:   expanded ? 1 : 0,
                  maxWidth:  expanded ? 120 : 0,
                  overflow:  'hidden',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-arabic, serif)', lineHeight: 1.3, color: 'inherit' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', lineHeight: 1.2 }}>
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
                    background:   active ? 'rgba(212,137,30,0.2)' : 'rgba(255,255,255,0.05)',
                    color:        active ? '#d4891e' : 'rgba(255,255,255,0.2)',
                    border:       `1px solid ${active ? 'rgba(212,137,30,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    marginRight:  expanded ? 0 : -4,
                    // collapsed: tiny dot-like; expanded: full pill
                    opacity: expanded ? 1 : 0.7,
                    position: expanded ? 'static' : 'absolute',
                    top:  expanded ? 'auto' : 6,
                    left: expanded ? 'auto' : 4,
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
            height:       expanded ? 32 : 28,
            padding:      expanded ? '0 14px' : '0',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap:          6,
            borderTop:    '1px solid rgba(255,255,255,0.04)',
            background:   'rgba(0,0,0,0.2)',
          }}
        >
          <SyncDot isSyncing={isSyncing} syncError={syncError} lastSynced={lastSynced} />
          {expanded && syncLabel && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-arabic, serif)', color: 'rgba(255,255,255,0.22)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {syncLabel}
            </span>
          )}
        </div>
      )}

      {/* ── Profile + sign out ────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center overflow-hidden"
        style={{
          height:         expanded ? 60 : 52,
          padding:        expanded ? '0 12px' : '0',
          borderTop:      '1px solid rgba(255,255,255,0.05)',
          justifyContent: expanded ? 'flex-start' : 'center',
          gap:            expanded ? 10 : 0,
          transition:     'height 0.28s ease, padding 0.28s ease',
        }}
      >
        {contributor ? (
          <>
            <Avatar contributor={contributor} size={26} expanded={expanded} />

            {/* Name + subject — expanded only */}
            <div
              className="flex flex-col min-w-0 flex-1 transition-all duration-200"
              style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? 100 : 0, overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-arabic, serif)', lineHeight: 1.3 }}>
                {(contributor.name || '').split(' ')[0]}
              </span>
              {contributor.username && (
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)' }}>
                  @{contributor.username}
                </span>
              )}
            </div>

            {/* Sign out — expanded: text button; collapsed: icon only */}
            <button
              onClick={handleSignOut}
              title="تسجيل الخروج"
              className="shrink-0 transition-all duration-150 rounded-lg flex items-center justify-center"
              style={{
                width:      28, height: 28,
                color:      'rgba(255,255,255,0.18)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </>
        ) : (
          /* No contributor — just sign out */
          <button
            onClick={handleSignOut}
            title="تسجيل الخروج"
            className="flex items-center justify-center w-full py-2 transition-colors"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
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