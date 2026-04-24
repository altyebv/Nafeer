'use client';

import { useEffect, useState } from 'react';
import { SyncBar } from '@/components/editor/layout/EditorShell';
import LessonsPage from '@/components/editor/pages/LessonsPage';
import LessonEditorPage from '@/components/editor/lesson/LessonEditorPage';
import ConceptsPage from '@/components/editor/pages/ConceptsPage';
import FeedItemsPage from '@/components/editor/pages/FeedItemsPage';
import QuizBankPage from '@/components/editor/pages/QuizBankPage';
import { useAtlasSync } from '@/hooks/useAtlasSync';
import { useDataStore } from '@/store/dataStore';
import { useMediaStore } from '@/store/mediaStore';

const NAV_ITEMS = [
  { id: 'lessons', label: 'الدروس', hint: 'Lessons' },
  { id: 'concepts', label: 'المفاهيم', hint: 'Concepts' },
  { id: 'feeds', label: 'التغذية', hint: 'Feed' },
  { id: 'quizbank', label: 'الأسئلة', hint: 'Quiz' },
];

function WorkspaceSpinner({ label }) {
  return (
    <div className="rounded-xl border px-6 py-10 flex flex-col items-center gap-3 text-center"
      style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.05)' }}>
      <span className="inline-block w-5 h-5 border-2 border-sand-700 border-t-transparent rounded-full animate-spin" />
      <p className="font-arabic text-sm text-ink-500">{label}</p>
    </div>
  );
}

export function AdminEditorWorkspace({ subjectId, subjectMeta, onImported }) {
  const importData = useDataStore((s) => s.importData);
  const resetAll = useDataStore((s) => s.resetAll);
  const storeSubject = useDataStore((s) => s.subject);
  const lessons = useDataStore((s) => s.lessons);
  const concepts = useDataStore((s) => s.concepts);
  const feedItems = useDataStore((s) => s.feedItems);
  const questions = useDataStore((s) => s.questions);
  const resetMedia = useMediaStore((s) => s.resetMedia);
  const { isSyncing, syncError, lastSynced } = useAtlasSync();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [origin, setOrigin] = useState('atlas');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [currentPage, setCurrentPage] = useState('lessons');
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      if (!subjectId) return;

      setLoading(true);
      setError(null);
      setImportError(null);
      setCurrentPage('lessons');
      setSelectedLessonId(null);
      setSelectedUnitId(null);

      try {
        const res = await fetch(`/api/export?subjectId=${encodeURIComponent(subjectId)}`);
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || 'فشل تحميل محتوى المادة');
        }

        if (cancelled) return;

        setOrigin(json.origin || 'atlas');
        resetAll();
        resetMedia();
        importData(json.data);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'تعذّر تحميل محتوى المادة');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [subjectId, importData, reloadKey, resetAll, resetMedia]);

  const navigateTo = (page, params = {}) => {
    setCurrentPage(page);
    if (params.lessonId !== undefined) setSelectedLessonId(params.lessonId);
    if (params.unitId !== undefined) setSelectedUnitId(params.unitId);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'editor':
        return (
          <LessonEditorPage
            lessonId={selectedLessonId}
            unitId={selectedUnitId}
            subjectId={subjectId}
            currentUser={{ role: 'admin' }}
            onBack={() => navigateTo('lessons')}
            onBackToOverview={() => navigateTo('lessons')}
            onNavigateLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })}
            onOpenGlobal={(page) => navigateTo(page)}
            isSyncing={isSyncing}
            syncError={syncError}
            lastSynced={lastSynced}
          />
        );
      case 'concepts':
        return <ConceptsPage subjectId={subjectId} />;
      case 'feeds':
        return <FeedItemsPage subjectId={subjectId} />;
      case 'quizbank':
        return <QuizBankPage subjectId={subjectId} />;
      case 'lessons':
      default:
        return <LessonsPage onEditLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })} />;
    }
  };

  if (loading) {
    return <WorkspaceSpinner label="جارٍ تحميل محتوى المادة المعتمد..." />;
  }

  if (error) {
    return (
      <div className="rounded-xl border px-6 py-10 text-center"
        style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.18)' }}>
        <p className="font-arabic text-sm text-red-400 mb-3">{error}</p>
        <button
          onClick={() => setReloadKey((v) => v + 1)}
          className="text-xs font-mono text-ink-400 hover:text-ink-200 px-4 py-2 rounded-lg border border-ink-800/70"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const activeSubject = storeSubject || { id: subjectId, nameAr: subjectMeta?.nameAr };
  const counts = {
    lessons: lessons.length,
    concepts: concepts.length,
    feeds: feedItems.length,
    quizbank: questions.length,
  };

  const remoteOnly = origin === 'remote';

  const importRemoteSubject = async () => {
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch('/api/admin/remote-subjects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'فشل استيراد المادة');
      }
      setReloadKey((v) => v + 1);
      onImported?.();
    } catch (e) {
      setImportError(e.message || 'فشل استيراد المادة');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'rgba(9,9,11,0.45)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-mono text-ink-600 uppercase tracking-widest mb-1">Remote Content Workspace</p>
            <h3 className="font-arabic text-lg text-ink-100">{activeSubject?.nameAr || subjectId}</h3>
            <p className="text-[11px] font-arabic text-ink-500">
              {remoteOnly
                ? 'تم تحميل النسخة المنشورة من التخزين البعيد. استوردها إلى Atlas أولاً لتفعيل التعديل الفعلي.'
                : 'تم تحميل النسخة المعتمدة داخل المحرر لاختبار العرض والتعديل ثم النشر.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 shrink-0 text-center">
            <StatMini label="دروس" value={counts.lessons} />
            <StatMini label="مفاهيم" value={counts.concepts} />
            <StatMini label="تغذية" value={counts.feeds} />
            <StatMini label="أسئلة" value={counts.quizbank} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id || (currentPage === 'editor' && item.id === 'lessons');
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className="px-3 py-2 rounded-xl border text-right transition-all"
                style={{
                  background: active ? 'rgba(212,137,30,0.10)' : 'rgba(255,255,255,0.02)',
                  borderColor: active ? 'rgba(212,137,30,0.28)' : 'rgba(255,255,255,0.07)',
                }}
              >
                <p className={`font-arabic text-sm ${active ? 'text-sand-300' : 'text-ink-300'}`}>{item.label}</p>
                <p className="text-[10px] font-mono text-ink-600">{item.hint}</p>
              </button>
            );
          })}
        </div>

        {remoteOnly && (
          <div
            className="mt-4 rounded-xl border px-4 py-3 flex items-center justify-between gap-4"
            style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
          >
            <div>
              <p className="font-arabic text-sm text-amber-300">هذه مادة منشورة عن بُعد فقط</p>
              <p className="text-[11px] font-arabic text-amber-200/70">
                الاستيراد سيحوّلها إلى بيانات Atlas محلية قابلة للتحرير ثم النشر من نفس المسار.
              </p>
              {importError && <p className="text-[11px] font-arabic text-red-400 mt-1">{importError}</p>}
            </div>
            <button
              onClick={importRemoteSubject}
              disabled={importing}
              className="px-4 py-2 rounded-xl border text-sm font-arabic"
              style={{
                background: 'rgba(212,137,30,0.10)',
                borderColor: 'rgba(212,137,30,0.28)',
                color: 'var(--accent)',
                opacity: importing ? 0.6 : 1,
              }}
            >
              {importing ? 'جارٍ الاستيراد...' : 'استيراد للتحرير'}
            </button>
          </div>
        )}
      </div>

      <SyncBar isSyncing={isSyncing} syncError={syncError} lastSynced={lastSynced} />

      <div className="p-5">
        {remoteOnly ? (
          <div
            className="rounded-xl border px-6 py-10 text-center"
            style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <p className="font-arabic text-base text-ink-200 mb-2">المادة جاهزة للاستيراد</p>
            <p className="text-[12px] font-arabic text-ink-500 max-w-xl mx-auto">
              هذه النسخة قادمة من الملف المنشور عن بُعد. بعد الاستيراد إلى Atlas سنفتح نفس المحرر الحالي
              للدروس والمفاهيم والتغذية والأسئلة مع حفظ ونشر فعليين.
            </p>
          </div>
        ) : (
          renderPage()
        )}
      </div>
    </div>
  );
}

function StatMini({ label, value }) {
  return (
    <div
      className="rounded-lg border px-3 py-2 min-w-16"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <p className="text-sm font-mono text-sand-400">{value}</p>
      <p className="text-[10px] font-arabic text-ink-600">{label}</p>
    </div>
  );
}
