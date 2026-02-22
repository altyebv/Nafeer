'use client';
import { useState } from 'react';
import EditorSidebar from '@/components/editor/EditorSidebar';
import LessonsPage from '@/components/editor/LessonsPage';
import LessonEditorPage from '@/components/editor/LessonEditorPage';
import ConceptsPage from '@/components/editor/ConceptsPage';
import FeedItemsPage from '@/components/editor/FeedItemsPage';
import ExportPage from '@/components/editor/ExportPage';

export default function EditorShell({ contributor }) {
  const [currentPage, setCurrentPage] = useState('lessons');
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  const navigateTo = (page, params = {}) => {
    setCurrentPage(page);
    if (params.lessonId !== undefined) setSelectedLessonId(params.lessonId);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'lessons':
        return (
          <LessonsPage
            onEditLesson={(lessonId) => navigateTo('editor', { lessonId })}
          />
        );
      case 'editor':
        return (
          <LessonEditorPage
            lessonId={selectedLessonId}
            onBack={() => navigateTo('lessons')}
          />
        );
      case 'concepts':
        return <ConceptsPage />;
      case 'feeds':
        return <FeedItemsPage />;
      case 'export':
        return <ExportPage />;
      default:
        return (
          <LessonsPage
            onEditLesson={(lessonId) => navigateTo('editor', { lessonId })}
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
