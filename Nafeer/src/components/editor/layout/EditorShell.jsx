'use client';
import { useState, useEffect } from 'react';
import { useDataStore }   from '@/store/dataStore';
import { useAtlasSync }   from '@/hooks/useAtlasSync';
import EditorSidebar      from '@/components/editor/layout/EditorSidebar';
import DashboardPage      from '@/components/editor/pages/DashboardPage';
import LessonsPage        from '@/components/editor/pages/LessonsPage';
import LessonEditorPage   from '@/components/editor/lesson/LessonEditorPage';
import ConceptsPage       from '@/components/editor/pages/ConceptsPage';
import FeedItemsPage      from '@/components/editor/pages/FeedItemsPage';
import QuizBankPage       from '@/components/editor/pages/QuizBankPage';
import ExportPage         from '@/components/editor/pages/ExportPage';
import MediaPage          from '@/components/editor/pages/MediaPage';

// Sidebar widths — must match EditorSidebar constants
const RAIL_W     = 56;
const EXPANDED_W = 244;

// ─── useBreakpoint ────────────────────────────────────────────────────────────
// Returns 'mobile' | 'tablet' | 'desktop'
function useBreakpoint() {
  const [bp, setBp] = useState('desktop');
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 768)  setBp('mobile');
      else          setBp('desktop');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return bp;
}

// ─── EditorShell ──────────────────────────────────────────────────────────────
export default function EditorShell({ contributor }) {
  const bootstrapFromSubject = useDataStore((s) => s.bootstrapFromSubject);
  const { bootstrapSubject, isSyncing, syncError, lastSynced } = useAtlasSync();

  const [currentPage,      setCurrentPage]      = useState('dashboard');
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedUnitId,   setSelectedUnitId]   = useState(null);
  const [atlasReady,       setAtlasReady]        = useState(false);
  const [sidebarOpen,      setSidebarOpen]       = useState(false);

  const breakpoint = useBreakpoint();
  const isMobile   = breakpoint === 'mobile';

  useEffect(() => {
    if (!contributor?.subject) return;
    bootstrapFromSubject(contributor.subject);
    bootstrapSubject(contributor.subject).then(() => setAtlasReady(true));
  }, [contributor?.subject]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateTo = (page, params = {}) => {
    setCurrentPage(page);
    if (params.lessonId !== undefined) setSelectedLessonId(params.lessonId);
    if (params.unitId   !== undefined) setSelectedUnitId(params.unitId);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage contributor={contributor} />;
      case 'lessons':
        return <LessonsPage onEditLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })} />;
      case 'editor':
        return (
          <LessonEditorPage
            lessonId={selectedLessonId}
            unitId={selectedUnitId}
            subjectId={contributor?.subject}
            onBack={() => navigateTo('lessons')}
            onBackToOverview={() => navigateTo('lessons')}
            onNavigateLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })}
            onOpenGlobal={(page) => navigateTo(page)}
            isSyncing={isSyncing}
            syncError={syncError}
            lastSynced={lastSynced}
          />
        );
      case 'concepts':  return <ConceptsPage  subjectId={contributor?.subject} />;
      case 'feeds':     return <FeedItemsPage subjectId={contributor?.subject} />;
      case 'quizbank':  return <QuizBankPage  subjectId={contributor?.subject} />;
      case 'media':     return <MediaPage     subjectId={contributor?.subject} contributor={contributor} />;
      case 'export':    return <ExportPage    subjectId={contributor?.subject} />;
      default:          return <DashboardPage contributor={contributor} />;
    }
  };

  // ── Full-screen immersive mode (lesson editor) — no sidebar on any breakpoint
  if (currentPage === 'editor') {
    return (
      <div className="min-h-screen bg-ink-950" dir="rtl">
        {isMobile && (
          // Back button replaces sidebar on mobile in editor mode
          <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4"
            style={{
              height: 52,
              background: 'rgba(9,8,6,0.92)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <button
              onClick={() => navigateTo('lessons')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="8,2 4,6 8,10" />
              </svg>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-arabic, serif)' }}>الدروس</span>
            </button>
            <SyncBar isSyncing={isSyncing} syncError={syncError} lastSynced={lastSynced} inline />
          </div>
        )}
        <div style={{ paddingTop: isMobile ? 52 : 0 }}>
          {renderPage()}
        </div>
      </div>
    );
  }

  // ── Sidebar width for desktop margin calculation ───────────────────────────
  const sidebarW = sidebarOpen ? EXPANDED_W : RAIL_W;

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
      dir="rtl"
    >
      {/* Sidebar — renders desktop rail or mobile bottom nav internally */}
      <EditorSidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        contributor={contributor}
        isSyncing={isSyncing}
        syncError={syncError}
        lastSynced={lastSynced}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      {/*
        Main content area.
        - Desktop: offset by sidebar width with matching transition
        - Mobile:  full width, padded at bottom to clear the bottom nav bar
      */}
      <main
        className="flex-1 min-w-0 flex flex-col"
        style={
          isMobile
            ? { marginRight: 0, paddingBottom: 68 }
            : {
                marginRight: sidebarW,
                transition: 'margin-right 0.26s cubic-bezier(0.4,0,0.2,1)',
              }
        }
      >
        {/* Sync status bar — desktop only (mobile shows in More drawer) */}
        {!isMobile && (
          <SyncBar
            isSyncing={isSyncing}
            syncError={syncError}
            lastSynced={lastSynced}
            atlasReady={atlasReady}
          />
        )}

        {/* Page content */}
        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

// ─── SyncBar ──────────────────────────────────────────────────────────────────
// `inline` prop renders a compact version for the mobile editor topbar.
export function SyncBar({ isSyncing, syncError, lastSynced, inline = false }) {
  if (!isSyncing && !syncError && !lastSynced) return null;

  if (inline) {
    // Compact inline variant for the mobile editor topbar
    return (
      <div className="flex items-center gap-1.5">
        {syncError  && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#f87171' }} />}
        {isSyncing  && <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: '#fbbf24' }} />}
        {!syncError && !isSyncing && lastSynced && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#34d399' }} />}
        <span style={{ fontSize: 10, fontFamily: 'var(--font-arabic, serif)', color: 'rgba(255,255,255,0.4)' }}>
          {syncError ? 'خطأ في الحفظ' : isSyncing ? 'جاري الحفظ…' : 'محفوظ'}
        </span>
      </div>
    );
  }

  if (syncError) return (
    <div
      className="px-6 py-2 flex items-center justify-between shrink-0"
      style={{ background: 'rgba(127,29,29,0.12)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}
    >
      <span className="text-red-400 text-xs font-arabic">⚠ {syncError}</span>
      <span className="text-red-500 text-xs font-arabic opacity-70">محفوظ محلياً</span>
    </div>
  );

  if (isSyncing) return (
    <div
      className="px-6 py-2 flex items-center gap-2 shrink-0"
      style={{ background: 'rgba(212,137,30,0.04)', borderBottom: '1px solid var(--border-subtle)' }}
    >
      <span className="inline-block w-3 h-3 border-2 border-sand-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sand-500 text-xs font-arabic">جاري الحفظ…</span>
    </div>
  );

  if (lastSynced) return (
    <div
      className="px-6 py-1.5 flex items-center gap-2 shrink-0"
      style={{ background: 'rgba(16,185,129,0.03)', borderBottom: '1px solid rgba(16,185,129,0.08)' }}
    >
      <span className="text-emerald-500 text-xs">✓</span>
      <span className="text-emerald-600 text-xs font-arabic">
        محفوظ · {new Date(lastSynced).toLocaleTimeString('ar-SD')}
      </span>
    </div>
  );

  return null;
}