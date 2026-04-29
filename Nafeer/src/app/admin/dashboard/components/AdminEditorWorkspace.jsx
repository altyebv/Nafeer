'use client';

import { useEffect, useState } from 'react';
import { SyncBar } from '@/components/editor/layout/EditorShell';
import LessonsPage from '@/components/editor/pages/LessonsPage';
import LessonEditorPage from '@/components/editor/lesson/LessonEditorPage';
import ConceptsPage from '@/components/editor/pages/ConceptsPage';
import FeedItemsPage from '@/components/editor/pages/FeedItemsPage';
import QuizBankPage from '@/components/editor/pages/QuizBankPage';
import { useAtlasSync } from '@/hooks/useAtlasSync';
import { useDataStore } from '@/store';            // ← composite hook: importData lives here
import { useEditorStore } from '@/store/editorStore';
import { useSubjectStore } from '@/store/subjectStore';
import { useContentStore } from '@/store/contentStore';
import { useConceptStore } from '@/store/conceptStore';
import { useFeedStore }    from '@/store/feedStore';
import { useQuizStore }    from '@/store/quizStore';
import { useMediaStore }   from '@/store/mediaStore';

// ─── PERSIST KEYS ─────────────────────────────────────────────────────────────
const PERSIST_KEYS = ['basheer-subject', 'basheer-content', 'basheer-concepts', 'basheer-feed', 'basheer-quiz'];

const NAV_ITEMS = [
  { id: 'lessons',  labelAr: 'الدروس',   labelEn: 'Lessons',   icon: '📖' },
  { id: 'concepts', labelAr: 'المفاهيم', labelEn: 'Concepts',  icon: '💡' },
  { id: 'feeds',    labelAr: 'التغذية',  labelEn: 'Feed',      icon: '⚡' },
  { id: 'quizbank', labelAr: 'الأسئلة',  labelEn: 'Quiz Bank', icon: '🎯' },
];

// ─── Primitives ───────────────────────────────────────────────────────────────

function Spinner({ size = 4 }) {
  return (
    <span
      className={`inline-block w-${size} h-${size} rounded-full border-2 border-current border-t-transparent animate-spin`}
      style={{ borderTopColor: 'transparent' }}
    />
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
      style={{
        background:   accent ? 'rgba(212,137,30,0.08)' : 'rgba(255,255,255,0.03)',
        borderColor:  accent ? 'rgba(212,137,30,0.22)' : 'rgba(255,255,255,0.08)',
      }}
    >
      <span className="font-mono text-sm font-semibold" style={{ color: accent ? 'var(--accent, #d4891e)' : 'var(--ink-300, #ccc)' }}>
        {value}
      </span>
      <span className="text-[10px] font-arabic" style={{ color: 'var(--ink-500, #888)' }}>
        {label}
      </span>
    </div>
  );
}

function Tag({ children, color = 'default' }) {
  const colors = {
    default: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)', text: 'var(--ink-500, #888)' },
    amber:   { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  text: '#f59e0b' },
    green:   { bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.22)',   text: '#4ade80' },
    red:     { bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.22)',   text: '#f87171' },
    blue:    { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.22)',  text: '#818cf8' },
  };
  const c = colors[color] || colors.default;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono border"
      style={{ background: c.bg, borderColor: c.border, color: c.text }}
    >
      {children}
    </span>
  );
}

function ActionBtn({ onClick, loading, disabled, variant = 'ghost', children }) {
  const variants = {
    primary: {
      bg:     'rgba(212,137,30,0.10)',
      border: 'rgba(212,137,30,0.30)',
      color:  'var(--accent, #d4891e)',
    },
    danger: {
      bg:     'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.28)',
      color:  '#f87171',
    },
    dangerSolid: {
      bg:     'rgba(239,68,68,0.14)',
      border: 'rgba(239,68,68,0.40)',
      color:  '#fca5a5',
    },
    ghost: {
      bg:     'rgba(255,255,255,0.03)',
      border: 'rgba(255,255,255,0.10)',
      color:  'var(--ink-300, #ccc)',
    },
  };
  const v = variants[variant] || variants.ghost;
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic border transition-all"
      style={{
        background:  v.bg,
        borderColor: v.border,
        color:       v.color,
        opacity:     (loading || disabled) ? 0.45 : 1,
        cursor:      (loading || disabled) ? 'not-allowed' : 'pointer',
      }}
    >
      {loading && <Spinner size={3} />}
      {children}
    </button>
  );
}

// ─── Loading / Error states ───────────────────────────────────────────────────

function SkeletonBlock({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.045), rgba(255,255,255,0.085), rgba(255,255,255,0.045))',
        ...style,
      }}
    />
  );
}

function WorkspaceLoading() {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'rgba(9,9,11,0.45)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="px-5 py-4 border-b space-y-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <SkeletonBlock className="h-2 w-40" />
            <SkeletonBlock className="h-6 w-64 max-w-full" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-8 w-20 rounded-lg" />)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-10 w-24 rounded-t-xl" />)}
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sand-400">
          <Spinner size={3} />
          <span className="text-[11px] font-mono text-ink-500">loading workspace...</span>
        </div>
        <SkeletonBlock className="h-8 w-48" />
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <SkeletonBlock className="h-4 w-56 max-w-full" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkspaceError({ message, onRetry }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'rgba(9,9,11,0.45)', borderColor: 'rgba(239,68,68,0.15)' }}
    >
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}
        >
          ✕
        </div>
        <div>
          <p className="font-arabic text-sm text-red-400">{message}</p>
          <p className="text-[11px] font-mono text-ink-600 mt-1">workspace failed to load</p>
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl border text-xs font-mono transition-all hover:border-ink-600"
          style={{
            background:   'rgba(255,255,255,0.03)',
            borderColor:  'rgba(255,255,255,0.10)',
            color:        'var(--ink-400, #aaa)',
          }}
        >
          ↺ إعادة المحاولة
        </button>
      </div>
    </div>
  );
}

// ─── Remote-only: import / delete panel ──────────────────────────────────────

function WorkspaceRefreshBanner({ refreshing, error, onRetry, onDismiss }) {
  if (!refreshing && !error) return null;

  return (
    <div
      className="px-5 py-2.5 border-b flex items-center justify-between gap-3"
      style={{
        background: error ? 'rgba(239,68,68,0.05)' : 'rgba(212,137,30,0.05)',
        borderColor: error ? 'rgba(239,68,68,0.14)' : 'rgba(212,137,30,0.16)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {refreshing ? (
          <Spinner size={3} />
        ) : (
          <span className="text-red-400 text-xs">!</span>
        )}
        <span className={`text-[11px] font-arabic truncate ${error ? 'text-red-300' : 'text-sand-300'}`}>
          {error || 'جار تحديث مساحة العمل في الخلفية...'}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {error && (
          <button
            onClick={onRetry}
            className="text-[10px] font-mono text-red-300/80 hover:text-red-200 transition-colors"
          >
            retry
          </button>
        )}
        {error && (
          <button
            onClick={onDismiss}
            className="text-[10px] font-mono text-ink-600 hover:text-ink-400 transition-colors"
          >
            dismiss
          </button>
        )}
      </div>
    </div>
  );
}

function RemoteOnlyPanel({ subjectId, onImported, onRemoteDeleted }) {
  const [importing,     setImporting]     = useState(false);
  const [importError,   setImportError]   = useState(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteBusy,    setDeleteBusy]    = useState(false);
  const [deleteError,   setDeleteError]   = useState(null);

  const doImport = async () => {
    setImporting(true);
    setImportError(null);
    try {
      const res  = await fetch('/api/admin/remote-subjects/import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subjectId, force: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'فشل الاستيراد');
      onImported?.();
    } catch (e) {
      setImportError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const doDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const res  = await fetch(`/api/admin/remote-subjects/${encodeURIComponent(subjectId)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'فشل الحذف');
      onRemoteDeleted?.();
    } catch (e) {
      setDeleteError(e.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Import card */}
      <div
        className="rounded-xl border p-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.18)' }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Tag color="amber">remote-only</Tag>
            <span className="text-[11px] font-mono text-ink-600">not in Atlas</span>
          </div>
          <p className="font-arabic text-sm text-amber-300/90">استيراد للتحرير</p>
          <p className="text-[11px] font-arabic text-ink-500 mt-0.5">
            يحوّل هذه المادة إلى بيانات Atlas محلية قابلة للتعديل والنشر.
          </p>
          {importError && <p className="text-[11px] font-arabic text-red-400 mt-1">{importError}</p>}
        </div>
        <ActionBtn onClick={doImport} loading={importing} disabled={deleteBusy} variant="primary">
          {importing ? 'جارٍ الاستيراد…' : 'استيراد'}
        </ActionBtn>
      </div>

      {/* Delete card */}
      <div
        className="rounded-xl border p-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.14)' }}
      >
        <div className="min-w-0">
          <p className="font-arabic text-sm text-red-400/90">حذف من Remote</p>
          <p className="text-[11px] font-arabic text-ink-500 mt-0.5">
            يحذف سجل Firebase والملف المنشور من Supabase. مناسب للمواد التجريبية.
          </p>
          {deleteError && <p className="text-[11px] font-arabic text-red-400 mt-1">{deleteError}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {deletePending ? (
            <>
              <ActionBtn onClick={doDelete} loading={deleteBusy} disabled={importing} variant="dangerSolid">
                {deleteBusy ? 'جارٍ الحذف…' : 'تأكيد'}
              </ActionBtn>
              <ActionBtn onClick={() => setDeletePending(false)} disabled={deleteBusy} variant="ghost">
                إلغاء
              </ActionBtn>
            </>
          ) : (
            <ActionBtn
              onClick={() => { setDeletePending(true); setDeleteError(null); }}
              disabled={deleteBusy || importing}
              variant="danger"
            >
              ✕ حذف
            </ActionBtn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Atlas mode: re-sync strip ────────────────────────────────────────────────

function ReSyncStrip({ subjectId, hasRemote, onReloaded, onRemoteDeleted }) {
  const [importing,     setImporting]     = useState(false);
  const [importError,   setImportError]   = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteBusy,    setDeleteBusy]    = useState(false);
  const [deleteError,   setDeleteError]   = useState(null);

  const doSync = async () => {
    setImporting(true);
    setImportError(null);
    setImportSuccess(false);
    try {
      const res  = await fetch('/api/admin/remote-subjects/import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subjectId, force: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'فشل المزامنة');
      setImportSuccess(true);
      onReloaded?.();
    } catch (e) {
      setImportError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const doDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const res  = await fetch(`/api/admin/remote-subjects/${encodeURIComponent(subjectId)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'فشل الحذف');
      setDeletePending(false);
      onRemoteDeleted?.();
    } catch (e) {
      setDeleteError(e.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div
      className="rounded-xl border px-4 py-2.5 flex items-center justify-between gap-3"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="min-w-0">
        {importError   && <p className="text-[11px] font-arabic text-red-400">{importError}</p>}
        {importSuccess && <p className="text-[11px] font-arabic text-green-400">✓ تم سحب آخر نسخة منشورة</p>}
        {deleteError   && <p className="text-[11px] font-arabic text-red-400">{deleteError}</p>}
        {!importError && !importSuccess && !deleteError && (
          <p className="text-[10px] font-mono text-ink-600">remote sync — replaces Atlas with latest published</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {hasRemote && (
          deletePending ? (
            <>
              <ActionBtn onClick={doDelete} loading={deleteBusy} disabled={importing} variant="dangerSolid">
                {deleteBusy ? 'حذف…' : 'تأكيد الحذف'}
              </ActionBtn>
              <ActionBtn onClick={() => setDeletePending(false)} disabled={deleteBusy} variant="ghost">
                إلغاء
              </ActionBtn>
            </>
          ) : (
            <ActionBtn
              onClick={() => { setDeletePending(true); setDeleteError(null); }}
              disabled={deleteBusy || importing}
              variant="danger"
            >
              ✕ حذف Remote
            </ActionBtn>
          )
        )}

        <button
          onClick={doSync}
          disabled={importing || deleteBusy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all"
          style={{
            background:  'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.10)',
            color:       importing ? 'var(--ink-600)' : 'var(--ink-300)',
            opacity:     (importing || deleteBusy) ? 0.5 : 1,
          }}
        >
          {importing ? <><Spinner size={3} /> مزامنة…</> : '↓ سحب Remote'}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminEditorWorkspace({ subjectId, subjectMeta, onImported, onRemoteDeleted }) {

  // ── Reactive data ────────────────────────────────────────────────────────
  const storeSubject = useSubjectStore((s) => s.subject);
  const lessons      = useSubjectStore((s) => s.lessons);
  const concepts     = useConceptStore((s) => s.concepts);
  const feedItems    = useFeedStore((s) => s.feedItems);
  const questions    = useQuizStore((s) => s.questions);

  // ── Store actions ────────────────────────────────────────────────────────
  // FIX: importData comes from useDataStore (composite hook in store/index.js).
  // The old code referenced useDataStore but never imported it — runtime crash.
  const importData    = useDataStore((s) => s.importData);
  const resetSubject  = useSubjectStore((s) => s.resetSubject);
  const resetContent  = useContentStore((s) => s.resetContent);
  const resetConcepts = useConceptStore((s) => s.resetConcepts);
  const resetFeed     = useFeedStore((s) => s.resetFeed);
  const resetQuiz     = useQuizStore((s) => s.resetQuiz);
  const resetMedia    = useMediaStore((s) => s.resetMedia);

  const { isSyncing, syncError, lastSynced } = useAtlasSync();

  const [loading,        setLoading]        = useState(() => useSubjectStore.getState().subject?.id !== subjectId);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState(null);
  const [refreshError,   setRefreshError]   = useState(null);
  const [reloadKey,      setReloadKey]      = useState(0);
  const [origin,         setOrigin]         = useState(() => subjectMeta?.source === 'remote' ? 'remote' : 'atlas');
  const currentPage      = useEditorStore((s) => s.activePage);
  const selectedLesson   = useEditorStore((s) => s.selectedLessonId);
  const selectedUnit     = useEditorStore((s) => s.selectedUnitId);
  const setEditorRoute   = useEditorStore((s) => s.setEditorRoute);
  const resetNavigation  = useEditorStore((s) => s.resetNavigation);

  // ── Load workspace ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      if (!subjectId) return;

      const sameSubject = useSubjectStore.getState().subject?.id === subjectId;

      if (sameSubject) {
        setLoading(false);
        setRefreshing(true);
        setRefreshError(null);
      } else {
        setLoading(true);
        setRefreshing(false);
        resetNavigation();
      }
      setError(null);
      setRefreshError(null);

      try {
        const res  = await fetch(`/api/export?subjectId=${encodeURIComponent(subjectId)}&includeAll=true`);
        const json = await res.json();

        if (!res.ok || !json.ok) throw new Error(json.error || 'فشل تحميل محتوى المادة');
        if (cancelled) return;

        // Wipe stale localStorage so persist middleware doesn't overwrite fresh data
        PERSIST_KEYS.forEach((key) => {
          try { localStorage.removeItem(key); } catch { /* SSR */ }
        });

        resetSubject();
        resetContent();
        resetConcepts();
        resetFeed();
        resetQuiz();
        resetMedia();

        // FIX: single importData() call handles all field normalization + bulk loading
        // (replaces the old manual forEach loops that duplicated store/index.js logic)
        importData(json.data);

        setOrigin(json.origin || 'atlas');
      } catch (e) {
        if (!cancelled) {
          const message = e.message || 'تعذّر تحميل محتوى المادة';
          if (sameSubject) setRefreshError(message);
          else setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadWorkspace();
    return () => { cancelled = true; };
  }, [subjectId, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigateTo = (page, params = {}) => {
    setEditorRoute(page, params);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'editor':
        return (
          <LessonEditorPage
            lessonId={selectedLesson}
            unitId={selectedUnit}
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
      case 'concepts':  return <ConceptsPage  subjectId={subjectId} isAdmin />;
      case 'feeds':     return <FeedItemsPage  subjectId={subjectId} isAdmin />;
      case 'quizbank':  return <QuizBankPage   subjectId={subjectId} isAdmin />;
      case 'lessons':
      default:
        return <LessonsPage onEditLesson={(lessonId, unitId) => navigateTo('editor', { lessonId, unitId })} />;
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) return <WorkspaceLoading />;
  if (error)   return <WorkspaceError message={error} onRetry={() => setReloadKey((v) => v + 1)} />;

  const activeSubject = storeSubject || { id: subjectId, nameAr: subjectMeta?.nameAr };
  const counts = {
    lessons:  lessons.length,
    concepts: concepts.length,
    feeds:    feedItems.length,
    quizbank: questions.length,
  };

  const remoteOnly  = origin === 'remote';
  const hasRemote   = remoteOnly || !!subjectMeta?.isPublished || !!subjectMeta?.downloadUrl;
  const isAtlas     = !remoteOnly;

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col"
      aria-busy={refreshing || isSyncing}
      style={{ background: 'rgba(9,9,11,0.50)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* ══ HEADER ════════════════════════════════════════════════════════════ */}
      <div
        className="px-5 pt-4 pb-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
      >
        {/* ── Title row ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[9px] font-mono text-ink-700 uppercase tracking-widest">Workspace</span>
              <span className="text-[9px] text-ink-800">/</span>
              <span className="text-[9px] font-mono text-ink-600 uppercase tracking-widest">{subjectId}</span>
            </div>

            {/* Subject name */}
            <h3 className="font-arabic text-xl text-ink-100 leading-snug truncate">
              {activeSubject?.nameAr || subjectId}
            </h3>

            {/* Source badge row */}
            <div className="flex items-center gap-2 mt-1.5">
              {remoteOnly ? (
                <Tag color="amber">remote-only</Tag>
              ) : (
                <Tag color="green">atlas ✓</Tag>
              )}
              <span className="text-[10px] font-mono text-ink-700">
                {remoteOnly
                  ? 'published file — not yet in Atlas'
                  : 'editable — changes sync to MongoDB'}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <StatPill label="دروس"   value={counts.lessons}  accent={counts.lessons  > 0} />
            <StatPill label="مفاهيم" value={counts.concepts} accent={counts.concepts > 0} />
            <StatPill label="تغذية"  value={counts.feeds}    accent={counts.feeds    > 0} />
            <StatPill label="أسئلة"  value={counts.quizbank} accent={counts.quizbank > 0} />
          </div>
        </div>

        {/* ── Nav tabs ────────────────────────────────────────────────────── */}
        {isAtlas && (
          <div
            className="flex items-center gap-1 pt-1"
            style={{ marginBottom: '-1px' }}  // bleed into border so active tab "connects"
          >
            {NAV_ITEMS.map((item) => {
              const active = currentPage === item.id || (currentPage === 'editor' && item.id === 'lessons');
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border border-b-0 text-right transition-all"
                  style={{
                    background:  active
                      ? 'rgba(9,9,11,0.50)'   // matches body bg → "tab selected" illusion
                      : 'rgba(255,255,255,0.015)',
                    borderColor: active
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.04)',
                    marginBottom: active ? '-1px' : '0',
                    position:    'relative',
                    zIndex:      active ? 2 : 1,
                  }}
                >
                  <span className="text-sm">{item.icon}</span>
                  <div className="text-right">
                    <p className={`font-arabic text-xs leading-none ${active ? 'text-sand-300' : 'text-ink-400'}`}>
                      {item.labelAr}
                    </p>
                    <p className="text-[8px] font-mono text-ink-700 mt-0.5">{item.labelEn}</p>
                  </div>
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                      style={{ background: 'rgba(212,137,30,0.6)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ SYNC BAR ══════════════════════════════════════════════════════════ */}
      <SyncBar isSyncing={isSyncing} syncError={syncError} lastSynced={lastSynced} />
      <WorkspaceRefreshBanner
        refreshing={refreshing}
        error={refreshError}
        onRetry={() => setReloadKey((v) => v + 1)}
        onDismiss={() => setRefreshError(null)}
      />

      {/* ══ ACTION STRIPS (contextual) ════════════════════════════════════════ */}
      {(remoteOnly || (isAtlas && hasRemote)) && (
        <div className="px-5 py-3 border-b space-y-2.5" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {remoteOnly ? (
            <RemoteOnlyPanel
              subjectId={subjectId}
              onImported={() => { onImported?.(); setReloadKey((v) => v + 1); }}
              onRemoteDeleted={onRemoteDeleted}
            />
          ) : (
            <ReSyncStrip
              subjectId={subjectId}
              hasRemote={hasRemote}
              onReloaded={() => setReloadKey((v) => v + 1)}
              onRemoteDeleted={onRemoteDeleted}
            />
          )}
        </div>
      )}

      {/* ══ BODY ══════════════════════════════════════════════════════════════ */}
      <div className="p-5">
        {remoteOnly ? (
          <div
            className="rounded-xl border px-8 py-14 text-center"
            style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <div
              className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}
            >
              ☁
            </div>
            <p className="font-arabic text-base text-ink-200 mb-1.5">استوردها للبدء بالتعديل</p>
            <p className="text-[12px] font-arabic text-ink-500 max-w-sm mx-auto leading-relaxed">
              هذه المادة متاحة من الملف المنشور فقط. بعد الاستيراد إلى Atlas ستُفتح نفس أدوات التحرير
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
