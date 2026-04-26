'use client';

import { useEffect, useState } from 'react';
import { SyncBar } from '@/components/editor/layout/EditorShell';
import LessonsPage from '@/components/editor/pages/LessonsPage';
import LessonEditorPage from '@/components/editor/lesson/LessonEditorPage';
import ConceptsPage from '@/components/editor/pages/ConceptsPage';
import FeedItemsPage from '@/components/editor/pages/FeedItemsPage';
import QuizBankPage from '@/components/editor/pages/QuizBankPage';
import { useAtlasSync } from '@/hooks/useAtlasSync';
import { useSubjectStore } from '@/store/subjectStore';
import { useContentStore } from '@/store/contentStore';
import { useConceptStore } from '@/store/conceptStore';
import { useFeedStore } from '@/store/feedStore';
import { useQuizStore } from '@/store/quizStore';
import { useMediaStore } from '@/store/mediaStore';

// ─── PERSIST KEYS ─────────────────────────────────────────────────────────────
// Must match the `name` field in each store's persist() config.
const PERSIST_KEYS = ['basheer-subject', 'basheer-content', 'basheer-concepts', 'basheer-feed', 'basheer-quiz'];

const NAV_ITEMS = [
  { id: 'lessons',  label: 'الدروس',   hint: 'Lessons'  },
  { id: 'concepts', label: 'المفاهيم', hint: 'Concepts' },
  { id: 'feeds',    label: 'التغذية',  hint: 'Feed'     },
  { id: 'quizbank', label: 'الأسئلة',  hint: 'Quiz'     },
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

export function AdminEditorWorkspace({ subjectId, subjectMeta, onImported, onRemoteDeleted }) {
  // ── Reactive data: proper Zustand selectors ────────────────────────────────
  const storeSubject = useSubjectStore((s) => s.subject);
  const lessons      = useSubjectStore((s) => s.lessons);
  const concepts     = useConceptStore((s) => s.concepts);
  const feedItems    = useFeedStore((s) => s.feedItems);
  const questions    = useQuizStore((s) => s.questions);

  // ── Stable action refs (Zustand guarantees these never change reference) ───
  const importData = useDataStore((s) => s.importData);
  const resetSubject  = useSubjectStore((s) => s.resetSubject);
  const loadFromAtlas = useSubjectStore((s) => s.loadFromAtlas);
  const resetContent  = useContentStore((s) => s.resetContent);
  const loadContent   = useContentStore((s) => s.loadLessonContent);
  const resetConcepts = useConceptStore((s) => s.resetConcepts);
  const addConcept    = useConceptStore((s) => s.addConcept);
  const addTag        = useConceptStore((s) => s.addTag);
  const resetFeed     = useFeedStore((s) => s.resetFeed);
  const loadFeedItems = useFeedStore((s) => s.loadFeedItems);
  const resetQuiz     = useQuizStore((s) => s.resetQuiz);
  const loadQuestions = useQuizStore((s) => s.loadQuestions);
  const loadExams     = useQuizStore((s) => s.loadExams);
  const resetMedia    = useMediaStore((s) => s.resetMedia);

  const { isSyncing, syncError, lastSynced } = useAtlasSync();

  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [reloadKey,        setReloadKey]        = useState(0);
  const [origin,           setOrigin]           = useState('atlas');
  // importing = first-time import (remote-only state) OR re-sync (atlas state)
  const [importing,        setImporting]        = useState(false);
  const [importError,      setImportError]      = useState(null);
  const [importSuccess,    setImportSuccess]    = useState(false);
  const [deleteRemotePending, setDeleteRemotePending] = useState(false);
  const [deleteRemoteBusy, setDeleteRemoteBusy] = useState(false);
  const [deleteRemoteError, setDeleteRemoteError] = useState(null);
  const [currentPage,      setCurrentPage]      = useState('lessons');
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedUnitId,   setSelectedUnitId]   = useState(null);

  // ── Load workspace ─────────────────────────────────────────────────────────
  // deps: [subjectId, reloadKey] only — all store actions are stable Zustand
  // selectors that never change reference, so they're safe to omit from deps.
  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      if (!subjectId) return;

      setLoading(true);
      setError(null);
      setImportError(null);
      setImportSuccess(false);
      setDeleteRemotePending(false);
      setDeleteRemoteError(null);
      setCurrentPage('lessons');
      setSelectedLessonId(null);
      setSelectedUnitId(null);

      try {
        // includeAll=true → returns draft + approved content so seeded
        // lessons (status: 'draft') are not silently filtered out.
        const res  = await fetch(`/api/export?subjectId=${encodeURIComponent(subjectId)}&includeAll=true`);
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || 'فشل تحميل محتوى المادة');
        }

        if (cancelled) return;

        // Wipe stale localStorage so persist middleware hydration doesn't
        // overwrite the fresh data we're about to load.
        PERSIST_KEYS.forEach((key) => {
          try { localStorage.removeItem(key); } catch { /* SSR */ }
        });

        resetSubject();
        resetContent();
        resetConcepts();
        resetFeed();
        resetQuiz();
       const data = json.data;
        importData(data);

        setOrigin(json.origin || 'atlas');
      } catch (e) {
        if (!cancelled) setError(e.message || 'تعذّر تحميل محتوى المادة');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWorkspace();
    return () => { cancelled = true; };
  }, [subjectId, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Remote import / re-sync ────────────────────────────────────────────────
  // Used for both the first-time import (remoteOnly) and re-syncing an already-
  // imported subject from the latest published remote file (atlas mode).
  // force: true is always sent — the admin is explicitly choosing to overwrite.
  // Without force, a 409 is returned if the subject already exists in Atlas,
  // which blocks every re-sync attempt after the first import.
  const syncFromRemote = async () => {
    setImporting(true);
    setImportError(null);
    setDeleteRemoteError(null);
    setImportSuccess(false);
    try {
      const res  = await fetch('/api/admin/remote-subjects/import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subjectId, force: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'فشل استيراد المادة');
      setImportSuccess(true);
      setReloadKey((v) => v + 1); // re-fetch from Atlas (origin will flip to 'atlas')
      onImported?.();
    } catch (e) {
      setImportError(e.message || 'فشل استيراد المادة');
    } finally {
      setImporting(false);
    }
  };

  const deleteRemoteSubject = async () => {
    setDeleteRemoteBusy(true);
    setDeleteRemoteError(null);
    try {
      const res = await fetch(`/api/admin/remote-subjects/${encodeURIComponent(subjectId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'فشل حذف النسخة البعيدة');

      setDeleteRemotePending(false);
      onRemoteDeleted?.();
    } catch (e) {
      setDeleteRemoteError(e.message || 'فشل حذف النسخة البعيدة');
    } finally {
      setDeleteRemoteBusy(false);
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigateTo = (page, params = {}) => {
    setCurrentPage(page);
    if (params.lessonId !== undefined) setSelectedLessonId(params.lessonId);
    if (params.unitId   !== undefined) setSelectedUnitId(params.unitId);
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
      case 'concepts':  return <ConceptsPage  subjectId={subjectId} />;
      case 'feeds':     return <FeedItemsPage  subjectId={subjectId} />;
      case 'quizbank':  return <QuizBankPage   subjectId={subjectId} />;
      case 'lessons':
      default:
        return <LessonsPage onEditLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })} />;
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) {
    return <WorkspaceSpinner label="جارٍ تحميل محتوى المادة..." />;
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
    lessons:  lessons.length,
    concepts: concepts.length,
    feeds:    feedItems.length,
    quizbank: questions.length,
  };

  const remoteOnly = origin === 'remote';
  const hasRemoteVersion = remoteOnly || !!subjectMeta?.isPublished || !!subjectMeta?.downloadUrl;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'rgba(9,9,11,0.45)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
                : 'المحتوى محمّل من Atlas — يمكن تعديله ونشره، أو سحب آخر نسخة منشورة عن بُعد.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 shrink-0 text-center">
            <StatMini label="دروس"   value={counts.lessons}  />
            <StatMini label="مفاهيم" value={counts.concepts} />
            <StatMini label="تغذية"  value={counts.feeds}    />
            <StatMini label="أسئلة"  value={counts.quizbank} />
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id || (currentPage === 'editor' && item.id === 'lessons');
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className="px-3 py-2 rounded-xl border text-right transition-all"
                style={{
                  background:  active ? 'rgba(212,137,30,0.10)' : 'rgba(255,255,255,0.02)',
                  borderColor: active ? 'rgba(212,137,30,0.28)' : 'rgba(255,255,255,0.07)',
                }}
              >
                <p className={`font-arabic text-sm ${active ? 'text-sand-300' : 'text-ink-300'}`}>{item.label}</p>
                <p className="text-[10px] font-mono text-ink-600">{item.hint}</p>
              </button>
            );
          })}
        </div>

        {/* ── Remote-only: first-time import banner ──────────────────────── */}
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
              onClick={syncFromRemote}
              disabled={importing}
              className="px-4 py-2 rounded-xl border text-sm font-arabic shrink-0"
              style={{
                background:  'rgba(212,137,30,0.10)',
                borderColor: 'rgba(212,137,30,0.28)',
                color:       'var(--accent)',
                opacity:     importing ? 0.6 : 1,
              }}
            >
              {importing ? 'جارٍ الاستيراد...' : 'استيراد للتحرير'}
            </button>
          </div>
        )}

        {/* ── Atlas mode: re-sync strip (always visible after import) ────── */}
        {/* Lets you pull a fresh remote version to test the update sync flow */}
        {!remoteOnly && (
          <div
            className="mt-4 rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-mono text-ink-500">
                مزامنة من Remote — يستبدل محتوى Atlas الحالي بآخر نسخة منشورة
              </p>
              {importError   && <p className="text-[11px] font-arabic text-red-400 mt-0.5">{importError}</p>}
              {importSuccess && <p className="text-[11px] font-arabic text-green-400 mt-0.5">✓ تم الاستيراد — تم إعادة تحميل المحتوى</p>}
              {deleteRemoteError && <p className="text-[11px] font-arabic text-red-400 mt-0.5">{deleteRemoteError}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasRemoteVersion && (
                deleteRemotePending ? (
                  <>
                    <button
                      onClick={deleteRemoteSubject}
                      disabled={deleteRemoteBusy || importing}
                      className="px-3 py-1.5 rounded-lg border text-xs font-arabic transition-all"
                      style={{
                        background: 'rgba(239,68,68,0.10)',
                        borderColor: 'rgba(239,68,68,0.30)',
                        color: '#f87171',
                        opacity: deleteRemoteBusy || importing ? 0.6 : 1,
                      }}
                    >
                      {deleteRemoteBusy ? 'جارٍ الحذف...' : 'تأكيد حذف Remote'}
                    </button>
                    <button
                      onClick={() => setDeleteRemotePending(false)}
                      disabled={deleteRemoteBusy}
                      className="px-3 py-1.5 rounded-lg border text-xs font-arabic transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderColor: 'rgba(255,255,255,0.10)',
                        color: 'var(--ink-400)',
                        opacity: deleteRemoteBusy ? 0.6 : 1,
                      }}
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setDeleteRemotePending(true);
                      setDeleteRemoteError(null);
                    }}
                    disabled={deleteRemoteBusy || importing}
                    className="px-3 py-1.5 rounded-lg border text-xs font-mono transition-all"
                    style={{
                      background: 'rgba(239,68,68,0.06)',
                      borderColor: 'rgba(239,68,68,0.22)',
                      color: '#f87171',
                      opacity: deleteRemoteBusy || importing ? 0.6 : 1,
                    }}
                  >
                    ✕ حذف من Remote
                  </button>
                )
              )}

              <button
                onClick={syncFromRemote}
                disabled={importing || deleteRemoteBusy}
                className="shrink-0 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all"
                style={{
                  background:  importing ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.10)',
                  color:       importing ? 'var(--ink-600)' : 'var(--ink-300)',
                }}
              >
                {importing
                  ? <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> جارٍ المزامنة...</span>
                  : '↓ سحب من Remote'}
              </button>
            </div>
          </div>
        )}

        {remoteOnly && hasRemoteVersion && (
          <div
            className="mt-4 rounded-xl border px-4 py-3 flex items-center justify-between gap-4"
            style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.18)' }}
          >
            <div>
              <p className="font-arabic text-sm text-red-300">حذف هذه المادة من Remote</p>
              <p className="text-[11px] font-arabic text-red-200/70">
                يحذف سجل Firebase والملف المنشور من التخزين البعيد. هذا مناسب للمواد التجريبية.
              </p>
              {deleteRemoteError && <p className="text-[11px] font-arabic text-red-400 mt-1">{deleteRemoteError}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {deleteRemotePending ? (
                <>
                  <button
                    onClick={deleteRemoteSubject}
                    disabled={deleteRemoteBusy || importing}
                    className="px-4 py-2 rounded-xl border text-sm font-arabic"
                    style={{
                      background: 'rgba(239,68,68,0.10)',
                      borderColor: 'rgba(239,68,68,0.30)',
                      color: '#f87171',
                      opacity: deleteRemoteBusy || importing ? 0.6 : 1,
                    }}
                  >
                    {deleteRemoteBusy ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
                  </button>
                  <button
                    onClick={() => setDeleteRemotePending(false)}
                    disabled={deleteRemoteBusy}
                    className="px-4 py-2 rounded-xl border text-sm font-arabic"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderColor: 'rgba(255,255,255,0.10)',
                      color: 'var(--ink-400)',
                      opacity: deleteRemoteBusy ? 0.6 : 1,
                    }}
                  >
                    إلغاء
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setDeleteRemotePending(true);
                    setDeleteRemoteError(null);
                  }}
                  disabled={deleteRemoteBusy || importing}
                  className="px-4 py-2 rounded-xl border text-sm font-arabic"
                  style={{
                    background: 'rgba(239,68,68,0.10)',
                    borderColor: 'rgba(239,68,68,0.28)',
                    color: '#f87171',
                    opacity: deleteRemoteBusy || importing ? 0.6 : 1,
                  }}
                >
                  حذف من Remote
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <SyncBar isSyncing={isSyncing} syncError={syncError} lastSynced={lastSynced} />

      {/* ── Body ───────────────────────────────────────────────────────────── */}
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