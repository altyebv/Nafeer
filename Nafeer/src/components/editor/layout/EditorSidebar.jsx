'use client';
import { useState, useEffect } from 'react';
import Link                 from 'next/link';
import { useDataStore }    from '@/store/dataStore';
import { useMediaStore }   from '@/store/mediaStore';
import { useThemeStore }   from '@/store/themeStore';
import { useRouter }       from 'next/navigation';
import { Menu }            from 'lucide-react';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';
import { NAV, MOBILE_PRIMARY } from '@/components/editor/layout/nav';
import { SyncDot, SyncPill }   from '@/components/editor/layout/SyncBanner';
import { useLayout }           from '@/hooks/useBreakpoint';

const SUBJECT_LABEL = Object.fromEntries(
  SUBJECTS_CATALOG.map((s) => [s.id, { ar: s.nameAr, en: s.nameEn }])
);

const RAIL_W     = 60;   // slightly wider rail for comfort
const EXPANDED_W = 260;  // slightly wider expanded for readability

// NAV lives in ./nav.js now, shared with the route tree. Each item carries the
// href it points at, so navigation is real <Link> traversal rather than an
// onNavigate(id) callback mutating state at a single URL.

// ── Theme ──────────────────────────────────────────────────────────────────────
// Was a local hook duplicated here and in MobileBottomNav, each with its own
// useState and each writing dataset.theme = '' for dark (inconsistent with
// layout.jsx, which writes 'dark'). Now a single shared store — see
// src/store/themeStore.js.
function useTheme() {
  const theme  = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggleTheme);
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

// SyncDot / SyncPill come from ./SyncBanner — they read editorStore directly,
// so sync state no longer needs threading down from the shell.

// ── Theme toggle icon ─────────────────────────────────────────────────────────
function ThemeToggle({ theme, toggle }) {
  const isDark = theme === 'dark';
  return (
    <button onClick={toggle}
      title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      className="shrink-0 rounded-lg flex items-center justify-center transition-all duration-150"
      style={{ width: 30, height: 30, color: 'var(--chrome-text-dim)', background: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--warn)'; e.currentTarget.style.background = 'var(--warn-surface)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--chrome-text-dim)'; e.currentTarget.style.background = 'transparent'; }}
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
export function DesktopSidebar({ currentPage, contributor, isOpen, onToggle }) {
  const { subject, lessons, concepts, feedItems, questions } = useDataStore();
  const { media } = useMediaStore();
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [annoCount, setAnnoCount] = useState(0);

  useEffect(() => {
    fetch('/api/contributors/announcement')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setAnnoCount(d.data.length); })
      .catch(() => {});
  }, []);

  const expanded = isOpen;
  const w        = expanded ? EXPANDED_W : RAIL_W;
  const isDark   = theme === 'dark';

  // Colours come from tokens now (globals.css → --chrome-*), not isDark
  // ternaries: one definition shared with MobileBottomNav, and the text values
  // inherit the ink ramp's audited contrast. `textDim` in particular used to be
  // rgba(…,0.38) in both themes, which measured 2.6:1 against the sidebar.
  const sidebarBg         = 'var(--chrome-bg)';
  const sidebarBorder     = 'var(--chrome-border)';
  const sidebarPanel      = 'var(--chrome-panel)';
  const sidebarPanelHover = 'var(--chrome-panel-hover)';
  const sidebarShadow = expanded
    ? isDark ? '-8px 0 40px rgba(0,0,0,0.6)' : '-8px 0 40px rgba(0,0,0,0.10)'
    : 'none';

  const textDim    = 'var(--chrome-text-dim)';
  const textMid    = 'var(--chrome-text-mid)';
  const textActive = 'var(--chrome-text-active)';
  const accent     = 'rgb(var(--sand-500))';
  const profileHref = contributor?.username ? `/contributor/${encodeURIComponent(contributor.username)}` : null;

  const counts = {
    dashboard: annoCount,
    lessons:   lessons.length,
    feeds:     feedItems.length,
    quizbank:  questions.length,
    concepts:  concepts.length,
    media:     media.length,
  };

  const subjectInfo = contributor?.subject ? SUBJECT_LABEL[contributor.subject] : null;

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
            boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.06)',
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
          const active = currentPage === item.id;
          const count  = counts[item.id];
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
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
              <Icon
                size={17}
                strokeWidth={1.9}
                className="shrink-0 transition-colors duration-150"
                style={{ color: active ? accent : 'inherit' }}
              />
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
            </Link>
          );
        })}
      </nav>

      {/* ── Sync row ──────────────────────────────────────────────────
          SyncPill/SyncDot render nothing when there is no sync state, so
          `empty:hidden` collapses the row rather than gating it on props. */}
      <div className="shrink-0 overflow-hidden transition-all duration-300 flex items-center empty:hidden"
        style={{
          height: expanded ? 30 : 26,
          padding: expanded ? '0 14px' : '0',
          justifyContent: expanded ? 'flex-start' : 'center',
          gap: 7,
          borderTop: `1px solid ${sidebarBorder}`,
          background: 'rgb(0 0 0 / 0.08)',
        }}
      >
        {expanded ? <SyncPill /> : <SyncDot />}
      </div>

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
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-surface)'; }}
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
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
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
// MOBILE_PRIMARY is imported from ./nav.js alongside NAV.

export function MobileBottomNav({ currentPage, contributor, moreOpen, onToggleMore }) {
  const router = useRouter();

  // Same tokens the desktop sidebar uses — these were a duplicated set of
  // isDark ternaries that could (and did) drift from their desktop twins.
  const navBg      = 'color-mix(in srgb, var(--chrome-bg) 97%, transparent)';
  const border     = 'var(--chrome-border)';
  const textDim    = 'var(--chrome-text-dim)';
  const textActive = 'var(--chrome-text-active)';
  const accent     = 'rgb(var(--sand-500))';

  const primaryNav = NAV.filter((n) => MOBILE_PRIMARY.includes(n.id));

  return (
    <>
      {/* Bottom bar — padded for the iOS home indicator, which the fixed
          64px bar used to sit underneath. */}
      <nav
        aria-label="التنقل الرئيسي"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: navBg,
          borderTop: `1px solid ${border}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {primaryNav.map((item) => {
          const active = currentPage === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => { if (moreOpen) onToggleMore(); }}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 relative"
              style={{ color: active ? textActive : textDim, minHeight: 44 }}
            >
              {active && (
                <span className="absolute bottom-0 rounded-t-sm"
                  style={{ width: 24, height: 2.5, background: accent }}
                />
              )}
              <Icon size={18} strokeWidth={1.9} style={{ color: active ? accent : 'inherit' }} />
              <span style={{ fontSize: 10.5, fontFamily: 'var(--font-arabic, serif)', fontWeight: active ? 700 : 400, lineHeight: 1 }}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={onToggleMore}
          aria-label="المزيد"
          aria-expanded={moreOpen}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 relative"
          style={{ color: moreOpen ? textActive : textDim, minHeight: 44 }}
        >
          <span className="absolute top-2 right-[calc(50%-10px)]">
            <SyncDot />
          </span>
          <Menu size={18} strokeWidth={2} style={{ color: moreOpen ? accent : 'inherit' }} />
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
              background: 'var(--chrome-bg)',
              border: `1px solid ${border}`,
              borderBottom: 'none',
              boxShadow: '0 -16px 48px rgba(0,0,0,0.4)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--chrome-text-dim)' }} />
            </div>

            <div className="px-4 pb-5 space-y-1.5">
              {/* Non-primary nav items (export excluded since it's gone from NAV) */}
              {NAV.filter((n) => !MOBILE_PRIMARY.includes(n.id)).map((item) => {
                const active = currentPage === item.id;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={onToggleMore}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-150"
                    style={{
                      background: active ? 'rgba(212,137,30,0.10)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? 'rgba(212,137,30,0.25)' : 'rgba(255,255,255,0.06)'}`,
                      color: active ? textActive : textDim,
                    }}
                  >
                    <Icon size={18} strokeWidth={1.9} style={{ color: active ? accent : 'inherit' }} />
                    <div className="flex flex-col text-right">
                      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-arabic, serif)', color: 'inherit' }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: textDim }}>{item.sub}</span>
                    </div>
                  </Link>
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
                    <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-arabic, serif)', color: 'var(--chrome-text-mid)' }}>
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
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = textDim; }}
                  >
                    <SignOutIcon />
                  </button>
                </div>
              )}

              {/* Sync status */}
              <div className="flex items-center gap-2 px-4 py-2 empty:hidden">
                <SyncPill />
              </div>
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
  // Was a local matchMedia + useState pair; the shared hook keeps this in step
  // with the rest of the layout and gives a stable server snapshot.
  const { isMobile } = useLayout();

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
