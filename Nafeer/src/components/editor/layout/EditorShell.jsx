'use client';
import { useState, useEffect } from 'react';
import { useDataStore }   from '@/store/dataStore';
import { useAtlasSync }   from '@/hooks/useAtlasSync';
import EditorSidebar    from '@/components/editor/layout/EditorSidebar';
import LessonsPage      from '@/components/editor/pages/LessonsPage';
import LessonEditorPage from '@/components/editor/lesson/LessonEditorPage';
import ConceptsPage     from '@/components/editor/pages/ConceptsPage';
import FeedItemsPage    from '@/components/editor/pages/FeedItemsPage';
import QuizBankPage     from '@/components/editor/pages/QuizBankPage';
import ExportPage       from '@/components/editor/pages/ExportPage';
import MediaPage        from '@/components/editor/pages/MediaPage';
import DashboardPage    from '@/components/editor/pages/DashboardPage';

const SIDEBAR_COLLAPSED = 52;
const SIDEBAR_EXPANDED  = 240;

export default function EditorShell({ contributor }) {
  const bootstrapFromSubject = useDataStore((s) => s.bootstrapFromSubject);
  const { bootstrapSubject, isSyncing, syncError, lastSynced } = useAtlasSync();

  const [currentPage,      setCurrentPage]      = useState('lessons');
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedUnitId,   setSelectedUnitId]   = useState(null);
  const [atlasReady,       setAtlasReady]        = useState(false);
  // ── Sidebar open/close state lifted here so main can respond ──────────────
  const [sidebarOpen,      setSidebarOpen]       = useState(false);

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
      case 'dashboard': return <DashboardPage />;
      default:          return <LessonsPage   onEditLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })} />;
    }
  };

  // Full-screen immersive mode — no sidebar
  if (currentPage === 'editor') {
    return (
      <div className="min-h-screen bg-ink-950" dir="rtl">
        {renderPage()}
      </div>
    );
  }

  const sidebarW = sidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
      dir="rtl"
    >
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
        marginRight follows sidebarW with matching transition.
        This prevents the sidebar from ever overlapping content.
      */}
      <main
        className="flex-1 min-w-0 flex flex-col"
        style={{
          marginRight: sidebarW,
          transition: 'margin-right 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <SyncBar
          isSyncing={isSyncing}
          syncError={syncError}
          lastSynced={lastSynced}
          atlasReady={atlasReady}
        />
        <div className="flex-1 px-6 py-6 lg:px-8 lg:py-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

// ─── SyncBar ─────────────────────────────────────────────────────────────────
export function SyncBar({ isSyncing, syncError, lastSynced }) {
  if (!isSyncing && !syncError && !lastSynced) return null;

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