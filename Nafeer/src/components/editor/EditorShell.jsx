'use client';
import { useState, useEffect } from 'react';
import { useDataStore }        from '@/store/dataStore';
import EditorSidebar      from '@/components/editor/EditorSidebar';
import LessonsPage        from '@/components/editor/LessonsPage';
import LessonEditorPage   from '@/components/editor/LessonEditorPage';
import ConceptsPage       from '@/components/editor/ConceptsPage';
import FeedItemsPage      from '@/components/editor/FeedItemsPage';
import QuizBankPage       from '@/components/editor/QuizBankPage';
import ExportPage         from '@/components/editor/ExportPage';

export default function EditorShell({ contributor }) {
  const bootstrapFromSubject = useDataStore((s) => s.bootstrapFromSubject);

  const [currentPage,      setCurrentPage]      = useState('lessons');
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedUnitId,   setSelectedUnitId]   = useState(null);
  const [bootstrapped,     setBootstrapped]      = useState(false);

  // ── Auto-scaffold on first mount ────────────────────────────────────────────
  // contributor.subject is the subjectId string assigned by the admin (e.g. "PHYSICS").
  // bootstrapFromSubject is idempotent — safe to call every mount.
  useEffect(() => {
    if (!contributor?.subject) return;
    bootstrapFromSubject(contributor.subject);
    setBootstrapped(true);
  }, [contributor?.subject]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateTo = (page, params = {}) => {
    setCurrentPage(page);
    if (params.lessonId !== undefined) setSelectedLessonId(params.lessonId);
    if (params.unitId   !== undefined) setSelectedUnitId(params.unitId);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'lessons':
        return (
          <LessonsPage
            onEditLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })}
          />
        );
      case 'editor':
        return (
          <LessonEditorPage
            lessonId={selectedLessonId}
            unitId={selectedUnitId}
            onBack={() => navigateTo('lessons')}
            onBackToOverview={() => navigateTo('lessons')}
            onNavigateLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })}
            onOpenGlobal={(page) => navigateTo(page)}
          />
        );
      case 'concepts':
        return <ConceptsPage />;
      case 'feeds':
        return <FeedItemsPage />;
      case 'quizbank':
        return <QuizBankPage />;
      case 'export':
        return <ExportPage />;
      default:
        return (
          <LessonsPage
            onEditLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-ink-950" dir="rtl">
      <EditorSidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        contributor={contributor}
      />
      <main className="flex-1 mr-64 p-8">
        <div className="max-w-5xl">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}