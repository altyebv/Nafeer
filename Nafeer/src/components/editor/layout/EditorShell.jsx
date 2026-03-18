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

export default function EditorShell({ contributor }) {
  const bootstrapFromSubject = useDataStore((s) => s.bootstrapFromSubject);
  const { bootstrapSubject, isSyncing, syncError, lastSynced } = useAtlasSync();

  const [currentPage,      setCurrentPage]      = useState('lessons');
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedUnitId,   setSelectedUnitId]   = useState(null);
  const [atlasReady,       setAtlasReady]        = useState(false);

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
      default:          return <LessonsPage   onEditLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })} />;
    }
  };

  // Full-screen immersive mode — no sidebar, no wrapper padding
  if (currentPage === 'editor') {
    return (
      <div className="min-h-screen bg-ink-950" dir="rtl">
        {renderPage()}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink-950" dir="rtl">
      <EditorSidebar currentPage={currentPage} onNavigate={navigateTo} contributor={contributor} />
      <main className="flex-1 mr-12 flex flex-col">
        <SyncBar isSyncing={isSyncing} syncError={syncError} lastSynced={lastSynced} atlasReady={atlasReady} />
        <div className="flex-1 p-8">
          <div className="max-w-5xl">{renderPage()}</div>
        </div>
      </main>
    </div>
  );
}

// ─── SyncBar ─────────────────────────────────────────────────────────────────
export function SyncBar({ isSyncing, syncError, lastSynced }) {
  if (!isSyncing && !syncError && !lastSynced) return null;
  if (syncError) return (
    <div className="px-6 py-2 bg-red-900/20 border-b border-red-900/40 flex items-center justify-between">
      <span className="text-red-400 text-xs font-arabic">⚠ {syncError}</span>
      <span className="text-red-600 text-xs font-arabic">محفوظ محلياً</span>
    </div>
  );
  if (isSyncing) return (
    <div className="px-6 py-2 bg-ink-900/60 border-b border-ink-800 flex items-center gap-2">
      <span className="inline-block w-3 h-3 border-2 border-sand-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-ink-500 text-xs font-arabic">جاري الحفظ…</span>
    </div>
  );
  if (lastSynced) return (
    <div className="px-6 py-1.5 bg-emerald-900/10 border-b border-emerald-900/20 flex items-center gap-2">
      <span className="text-emerald-500 text-xs">✓</span>
      <span className="text-emerald-700 text-xs font-arabic">محفوظ · {new Date(lastSynced).toLocaleTimeString('ar-SD')}</span>
    </div>
  );
  return null;
}