'use client';
import { useState, useEffect } from 'react';
import { useDataStore }    from '@/store/dataStore';
import { useShallow } from 'zustand/react/shallow';
import { useAtlasSync }    from '@/hooks/useAtlasSync';
import { getLessonStatus, STATUS_CONFIG } from '@/lib/LessonStatus';
import SectionEditor        from '@/components/editor/lesson/SectionEditor';
import LessonQuestionsPanel from '@/components/editor/lesson/LessonQuestionsPanel';
import LessonFeedPanel      from '@/components/editor/lesson/LessonFeedPanel';
import LessonHeader         from '@/components/editor/lesson/LessonHeader';
import LessonPreviewModal, { LessonPhone } from '@/components/editor/lesson/LessonPreviewModal';
import { MathNotationContext } from '@/components/editor/shared/MathNotationContext';
import { getMathNotation }  from '@/shared/curriculum';
import LessonReadiness, { SIXTHS } from '@/components/editor/lesson/LessonReadiness';
import LessonNotesDrawer    from '@/components/editor/lesson/LessonNotesDrawer';
import LessonHistoryDrawer  from '@/components/editor/lesson/LessonHistoryDrawer';
import LinkVariationModal, { VARIATION_CONFIG } from '@/components/editor/lesson/LinkVariationModal';
import {
  Check,
  Circle,
  CircleDot,
  Clock3,
  FileText,
  Link2,
  NotebookPen,
  Smartphone,
  Sparkles,
  Target,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/store/editorStore';
import { useSubjectStore } from '@/store/subjectStore';
import { useContentStore } from '@/store/contentStore';
import LessonConflicts from '@/components/editor/lesson/LessonConflicts';
import { minutesAgo } from '@/components/editor/lesson/SyncMarks';
import { useAutosave } from '@/hooks/useAutosave';
import EditorPage from '@/components/editor/layout/EditorPage';
import { NAV_BY_ID, lessonHref } from '@/components/editor/layout/nav';
import { Badge, Button, Drawer, EmptyState, IconButton, TabPanel } from '@/components/ui';
import { arCount, formatNumber } from '@/lib/format';
import { SECTION_KIND_CONFIG } from '@/shared/constants';

const SCAFFOLD_TITLE_RE = /^الدرس\s+\d+$/;
// Whether the content tab shows the phone beside it — a per-browser choice.
const LIVE_PREVIEW_KEY = 'nafeer-editor-live-preview';

const FIELD =
  'w-full px-4 py-3 bg-ink-950 border border-ink-800 rounded-xl text-sand-200 ' +
  'focus:ring-1 focus:ring-sand-600 focus:border-sand-700 focus:outline-none ' +
  'font-arabic placeholder-ink-600 text-sm leading-relaxed transition-colors ' +
  'hover:border-ink-700';

// The variations step had a component but no tab — nothing could open it. It
// is the fifth tab now, named as its own heading names it: an alternative is
// only one of four variation types (بديل، متطلب، توسع، مبسطة).
const TABS = [
  { id: 'meta',       label: 'البيانات'  },
  { id: 'body',       label: 'المحتوى'   },
  { id: 'questions',  label: 'الأسئلة'   },
  { id: 'feed',       label: 'التغذية'   },
  { id: 'variations', label: 'التنويعات' },
];

const PART_NAMES_AR = ['الأوَّل', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
const PART_NUMS_AR  = ['1', '2', '3', '4', '5', '6'];

// Navigation props are gone: the lesson has its own route, so "back" and
// "next lesson" are real URL moves and unitId is derived from the lesson
// rather than carried alongside it. Sync state is read from editorStore.
export default function LessonEditorPage({
  lessonId, subjectId, currentUser,
  // Optional navigation overrides. The contributor editor leaves these unset
  // and gets router navigation. The admin dashboard embeds this component
  // inside its own switch-based workspace (AdminEditorWorkspace) and passes
  // its own handlers — without them, "back" would push the contributor route
  // and eject an admin out of the dashboard entirely.
  onBack, onNavigateLesson, onOpenGlobal,
}) {
  const router = useRouter();
  const {
    units, lessons, sections, blocks, questions, feedItems,
    updateLesson, addSection,
  } = useDataStore(useShallow((s) => ({
    units: s.units, lessons: s.lessons, sections: s.sections, blocks: s.blocks,
    questions: s.questions, feedItems: s.feedItems,
    updateLesson: s.updateLesson, addSection: s.addSection,
  })));
  const { syncAll, submitForReview, approveAndSync } = useAtlasSync();
  const isSyncing  = useEditorStore((s) => s.isSyncing);
  const syncError  = useEditorStore((s) => s.syncError);
  const lastSynced = useEditorStore((s) => s.lastSynced);

  const [activeTab,     setActiveTab]     = useState('meta');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [showPreview,   setShowPreview]   = useState(false);
  const [showNotes,        setShowNotes]        = useState(false);
  const [showHistory,      setShowHistory]      = useState(false);
  const [showLinkVariation, setShowLinkVariation] = useState(false);
  const [notesCount,       setNotesCount]       = useState(0);
  const [versionLabel,     setVersionLabel]     = useState('');
  const [variations,       setVariations]       = useState([]);
  // Attribution data fetched from the lesson GET response (populated server-side)
  const [attribution,      setAttribution]      = useState(null);
  // Someone else who opened this lesson in the last half hour (lesson GET).
  const [openedBy,         setOpenedBy]         = useState(null);
  // The reviewer's comments from the latest return (lesson GET — no request
  // of their own), and the one being marked handled right now.
  const [reviewComments,   setReviewComments]   = useState([]);
  const [resolvingId,      setResolvingId]      = useState(null);
  const [showReadiness,    setShowReadiness]    = useState(false);
  // The phone beside the content tab (xl and up). Remembered in the browser;
  // below xl the same button opens the preview modal instead.
  const [livePreview,      setLivePreview]      = useState(false);
  const [focusSectionId,   setFocusSectionId]   = useState(null);
  useEffect(() => {
    try { setLivePreview(localStorage.getItem(LIVE_PREVIEW_KEY) === '1'); } catch { /* storage blocked */ }
  }, []);
  const toggleLivePreview = () => {
    if (!window.matchMedia('(min-width: 1280px)').matches) { setShowPreview(true); return; }
    setLivePreview((on) => {
      try { localStorage.setItem(LIVE_PREVIEW_KEY, on ? '0' : '1'); } catch { /* storage blocked */ }
      return !on;
    });
  };
  const showPhone = livePreview && activeTab === 'body';

  const lesson         = lessons.find((l) => l.id === lessonId);
  // unitId used to arrive as a prop alongside lessonId; with a single-segment
  // route it is simply the lesson's own unit.
  const unitId         = lesson?.unitId ?? null;
  const unit           = units.find((u) => u.id === unitId);

  const goBack     = onBack           ?? (() => router.push('/editor/lessons'));
  const goToLesson = onNavigateLesson ?? ((id) => router.push(lessonHref(id)));
  const openGlobal = onOpenGlobal     ?? ((page) => router.push(NAV_BY_ID[page]?.href ?? '/editor'));

  // One request per lesson open: attribution, notes count, variations — and
  // the lesson's saved content, merged into the local cache so this editor
  // works on what is in Atlas rather than on whatever this browser last had.
  // Unsaved local edits are kept (lib/editorSync.js).
  useEffect(() => {
    if (!lessonId) return;
    fetch(`/api/content/lessons/${lessonId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setAttribution(res.data.attribution || null);
          setNotesCount(res.data.notesCount ?? 0);
          setVariations(res.data.variations  || []);
          setOpenedBy(res.data.recentlyOpenedBy || null);
          const round = res.data.reviewState?.round || 0;
          setReviewComments(round
            ? (res.data.notes || []).filter((n) => n.noteType === 'review_feedback' && (n.round ?? 0) === round)
            : []);
          useSubjectStore.getState().mergeServerLessonMeta(res.data);
          useContentStore.getState().mergeServerLesson(lessonId, res.data.sections || []);
        }
      })
      .catch(() => {/* non-blocking */});
    return () => setOpenedBy(null);
  }, [lessonId]);

  useAutosave(lessonId, subjectId, syncAll);

  const lessonSections = sections.filter((s) => s.lessonId === lessonId).sort((a, b) => a.order - b.order);
  const sectionIds     = lessonSections.map((s) => s.id);
  const lessonBlocks   = blocks.filter((b) => sectionIds.includes(b.sectionId));
  // Unsaved work, from the `_dirty` marks the stores keep — no request.
  const contentUnsaved = lessonSections.filter((s) => s._dirty).length + lessonBlocks.filter((b) => b._dirty).length;
  const unsavedCount   = contentUnsaved + (lesson?._dirty ? 1 : 0);
  const lessonConceptIds = [...new Set(lessonSections.flatMap((s) => s.conceptIds || []))];
  const lessonQuestions  = questions.filter((q) => q.lessonId === lessonId);
  const lessonFeedItems  = feedItems.filter((f) => f.lessonId === lessonId);
  const status    = lesson ? getLessonStatus(lessonId, sections, blocks, lesson) : 'empty';
  const statusCfg = STATUS_CONFIG[status];

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);
  const allLessons  = sortedUnits.flatMap((u) =>
    lessons.filter((l) => l.unitId === u.id).sort((a, b) => a.order - b.order).map((l) => ({ ...l, _unitId: u.id }))
  );
  const globalIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson  = globalIndex > 0 ? allLessons[globalIndex - 1] : null;
  const nextLesson  = globalIndex < allLessons.length - 1 ? allLessons[globalIndex + 1] : null;
  const unitLessons = lessons.filter((l) => l.unitId === unitId).sort((a, b) => a.order - b.order);
  const lessonIndex = unitLessons.findIndex((l) => l.id === lessonId);

  // The six readiness checks — unchanged rules, now each naming the tab that
  // fixes it, so the readiness panel can take the author there.
  const checklist = lesson ? [
    { id: 'title',    tab: 'meta',      label: 'عنوان حقيقي',          done: !!lesson.title?.trim() && !SCAFFOLD_TITLE_RE.test(lesson.title.trim()) },
    { id: 'summary',  tab: 'meta',      label: 'ملخص',                 done: !!lesson.summary?.trim()   },
    { id: 'sections', tab: 'body',      label: 'قسم واحد على الأقل',   done: lessonSections.length > 0  },
    { id: 'content',  tab: 'body',      label: 'محتوى في الأقسام',     done: lessonBlocks.length > 0    },
    { id: 'questions',tab: 'questions', label: 'سؤال واحد على الأقل',  done: lessonQuestions.length > 0 },
    { id: 'feed',     tab: 'feed',      label: 'بطاقة تغذية واحدة',    done: lessonFeedItems.length > 0 },
  ] : [];
  const completedChecks = checklist.filter((c) => c.done).length;

  const tabDone = (id) => {
    if (id === 'meta')      return checklist.slice(0,2).every(c => c.done);
    if (id === 'body')      return checklist.slice(2,4).every(c => c.done);
    if (id === 'questions') return !!checklist[4]?.done;
    if (id === 'feed')      return !!checklist[5]?.done;
    return false;
  };

  const tabCount = {
    body:       lessonSections.length,
    questions:  lessonQuestions.length,
    feed:       lessonFeedItems.length,
    variations: variations.length,
  };
  const tabItems = TABS.map((t) => ({
    ...t,
    count: tabCount[t.id] || undefined,   // no "0" badge on every empty tab
    done:  tabDone(t.id) && t.id !== activeTab,
    dirty: (t.id === 'meta' && !!lesson?._dirty) || (t.id === 'body' && contentUnsaved > 0),
  }));

  // One save state for the header pill, from what editorStore already tracks.
  const saveState =
    syncError        ? 'error'  :
    isSyncing        ? 'saving' :
    unsavedCount > 0 ? 'dirty'  :
    lastSynced       ? 'saved'  : 'idle';

  // Manual save. The SaveStatus pill reports the outcome; errors and
  // conflicts surface there and in LessonConflicts.
  const handleSave = async () => {
    if (!subjectId) return;
    try { await syncAll(lessonId, subjectId); } catch { /* shown by SaveStatus */ }
  };

  // Open a tab and, when given a section or block id, scroll it into view —
  // used by "go to conflict", the readiness checks and the review comments.
  const jumpTo = (tab, contentId = null) => {
    setActiveTab(tab);
    setShowReadiness(false);
    if (!contentId) return;
    setTimeout(() => {
      const block = blocks.find((b) => b.id === contentId);
      const el = document.querySelector(`[data-sync-id="${CSS.escape(contentId)}"]`)
        ?? (block && document.querySelector(`[data-sync-id="${CSS.escape(block.sectionId)}"]`));
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };
  const revealConflict = (contentId) => jumpTo('body', contentId);

  // Mark a reviewer's comment handled (or not). Optimistic; one request.
  const resolveComment = async (noteId, resolved) => {
    const before = reviewComments;
    setResolvingId(noteId);
    setReviewComments((list) => list.map((c) => (c._id === noteId
      ? { ...c, resolved, resolvedAt: resolved ? new Date().toISOString() : null, resolvedByName: resolved ? (currentUser?.name || '') : '' }
      : c)));
    try {
      const res = await fetch(`/api/content/lessons/${lessonId}/notes/${noteId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resolved }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setReviewComments(before);
    } finally {
      setResolvingId(null);
    }
  };
  const openComments = lesson?.reviewState?.returned ? reviewComments.filter((c) => !c.resolved).length : 0;

  const handleSubmitForReview = async () => {
    if (!subjectId) return;
    try {
      await syncAll(lessonId, subjectId);
      if (!(await submitForReview(lessonId, 'lesson'))) return;   // SaveStatus shows why
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3500);
    } catch { /* SaveStatus shows it */ }
  };

  const handleApprove = async () => {
    if (!subjectId) return;
    try {
      await approveAndSync(lessonId, subjectId);
      setApproveSuccess(true);
      setTimeout(() => setApproveSuccess(false), 3500);
    } catch { /* SyncBar handles it */ }
  };

  const patchMeta = (patch) =>
    updateLesson(lesson.id, { metadata: { ...(lesson.metadata || {}), ...patch } });

  // ── Variation handlers ───────────────────────────────────────────────────
  // These write the target lesson directly, so its local copy follows the
  // version they produced — otherwise its next save would be refused as stale.
  // The variation fields are written here, so they don't leave the target
  // dirty unless it already had unsaved edits of its own.
  const wasDirty = (id) => !!useSubjectStore.getState().lessons.find((l) => l.id === id)?._dirty;
  const followVersion = async (res, dirty) => {
    const json = await res.json().catch(() => null);
    if (json?.ok) useSubjectStore.getState().followLessonVersion(json.data, dirty);
  };

  const handleLinkVariation = async (targetLessonId, variationType, variationNote) => {
    // Optimistic local update — before the write, so the version it produces
    // is the one the lesson ends up based on.
    const dirty = wasDirty(targetLessonId);
    updateLesson(targetLessonId, { parentLesson: lessonId, variationType, variationNote });
    await followVersion(await fetch(`/api/content/lessons/${targetLessonId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ parentLesson: lessonId, variationType, variationNote }),
    }), dirty);
    // Re-fetch variations list for this lesson
    const res  = await fetch(`/api/content/lessons/${lessonId}`);
    const json = await res.json();
    if (json.ok) setVariations(json.data.variations || []);
  };

  const handleUnlinkVariation = async (targetLessonId) => {
    const dirty = wasDirty(targetLessonId);
    updateLesson(targetLessonId, { parentLesson: null, variationType: null, variationNote: null });
    await followVersion(await fetch(`/api/content/lessons/${targetLessonId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ parentLesson: null, variationType: null, variationNote: null }),
    }), dirty);
    setVariations((v) => v.filter((x) => x.contentId !== targetLessonId));
  };

  const handleAddSection = (targetPartIndex) => {
    const maxOrder = lessonSections.reduce((m, s) => Math.max(m, s.order), 0);
    const partIdx  = targetPartIndex ?? Math.max(...lessonSections.map(s => s.partIndex ?? 0), 0);
    addSection({ lessonId, title: `قسم ${lessonSections.length + 1}`, order: maxOrder + 1, conceptIds: [], learningType: 'UNDERSTANDING', partIndex: partIdx });
  };

  const handleAddNewPart = () => {
    const maxPart  = lessonSections.reduce((m, s) => Math.max(m, s.partIndex ?? 0), -1);
    const maxOrder = lessonSections.reduce((m, s) => Math.max(m, s.order), 0);
    addSection({ lessonId, title: 'قسم جديد', order: maxOrder + 1, conceptIds: [], learningType: 'UNDERSTANDING', partIndex: maxPart + 1 });
  };

  if (!lesson) return (
    <EmptyState
      icon={NotebookPen}
      title="الدرس غير موجود"
      description="ربما حُذف أو نُقل إلى وحدة أخرى."
      action={<Button variant="primary" onClick={goBack}>العودة إلى الدروس</Button>}
      className="m-6"
    />
  );

  const readinessPanel = (
    <LessonReadiness
      lesson={lesson} reviewState={lesson.reviewState} comments={reviewComments}
      onResolve={resolveComment} resolvingId={resolvingId}
      checks={checklist} onJump={jumpTo}
      attribution={attribution} lessonIndex={lessonIndex} unitLessonCount={unitLessons.length}
      prevLesson={prevLesson} nextLesson={nextLesson} onNavigateLesson={goToLesson}
    />
  );

  return (
    // Every formula on this page — editors, previews, inline — follows the subject.
    <MathNotationContext.Provider value={getMathNotation(subjectId)}>
    <EditorPage width="full" bleed className="flex min-h-[100dvh] flex-col">

      <LessonHeader
        lesson={lesson} unit={unit} lessonIndex={lessonIndex} unitLessonCount={unitLessons.length}
        isAdmin={currentUser?.role === 'admin'}
        saveState={saveState} savedAt={lastSynced} unsavedCount={unsavedCount}
        syncError={syncError} isSyncing={isSyncing}
        reviewSuccess={reviewSuccess} approveSuccess={approveSuccess} notesCount={notesCount}
        tabs={tabItems} activeTab={activeTab} onTabChange={setActiveTab}
        onBack={goBack} onSave={handleSave}
        onPreview={() => setShowPreview(true)}
        onHistory={() => setShowHistory(true)}
        onNotes={() => setShowNotes(true)}
        onSubmitForReview={handleSubmitForReview} onApprove={handleApprove}
        missing={checklist.filter((c) => !c.done)} openComments={openComments}
        onJump={jumpTo} onShowComments={() => setShowReadiness(true)}
      />

      {/* Items another contributor changed first — see LessonConflicts */}
      <LessonConflicts lessonId={lessonId} onReveal={revealConflict} />

      {/* Content column + readiness panel. The panel sits beside the steps at
          xl and up, where there is room; below that a one-line bar opens it as
          a drawer (DS2 step 2, canvas board «الجاهزية والإرسال»). */}
      <div className={`flex-1 w-full ${showPhone ? 'max-w-[76rem]' : 'max-w-[68rem]'} mx-auto flex gap-8 px-4 sm:px-6`}>
      <div className="flex-1 min-w-0 max-w-4xl mx-auto xl:mx-0 xl:max-w-none flex flex-col">

      {/* Notices sit in the content column, above the step — not in the sticky
          header, which used to grow a row for each of them. */}
      <div className="w-full pt-5 flex flex-col gap-3 empty:hidden">
        {/* Someone else opened this lesson recently — they may be editing it.
            Read from the lesson GET; costs nothing extra. */}
        {openedBy && (
          <div role="status" className="flex items-start gap-2.5 px-4 py-3 rounded-card bg-info-surface border border-info-border text-info t-label font-normal">
            <Clock3 size={16} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span className="flex-1 leading-relaxed">
              آخر من فتح هذا الدرس: {openedBy.name || 'زميل'}، {minutesAgo(openedBy.at)}. قد يكون العمل عليه جارياً الآن — تُحفظ تعديلاتك تلقائياً، وستُنبَّه إن تعارضت مع تعديلات أخرى.
            </span>
            <IconButton icon={X} label="إخفاء التنبيه" size="sm" onClick={() => setOpenedBy(null)} className="-my-1.5" />
          </div>
        )}

        {/* Approved warning — only shown to contributors, not admins */}
        {lesson.atlasStatus === 'approved' && currentUser?.role !== 'admin' && (
          <div role="note" className="flex items-start gap-2.5 px-4 py-3 rounded-card bg-warn-surface border border-warn-border text-warn t-label font-normal">
            <TriangleAlert size={16} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">هذا الدرس <strong>معتمد</strong>. أي تعديل سيُعيده إلى حالة المسودة.</p>
          </div>
        )}

        {/* Below xl: the readiness panel folds into this bar. */}
        <button
          type="button"
          onClick={() => setShowReadiness(true)}
          className={`${showPhone ? '' : 'xl:hidden '}flex items-center gap-3 w-full px-4 h-12 rounded-card bg-raised border border-line text-start t-ui hover:border-line-strong transition-colors`}
        >
          <span className="text-fg-strong">جاهزية الدرس</span>
          <span dir="ltr" className="t-num text-fg-muted">{formatNumber(completedChecks)} / 6</span>
          <span className="flex-1 h-1.5 rounded-full bg-hover overflow-hidden" aria-hidden="true">
            <span className={`block h-full rounded-full ${SIXTHS[completedChecks]} ${completedChecks === 6 ? 'bg-success' : 'bg-accent-hover'}`} />
          </span>
          {openComments > 0 && <Badge tone="warn" size="sm">{arCount(openComments, { one: 'ملاحظة', two: 'ملاحظتان', few: 'ملاحظات', many: 'ملاحظة' })}</Badge>}
          <span className="t-caption text-fg-accent">التفاصيل</span>
        </button>
      </div>

      {/* ── Step canvas ─────────────────────────────────────────────────────── */}
      <div className="flex-1 w-full py-8">
        <TabPanel idBase="lesson" id="meta" active={activeTab === 'meta'}>
          <StepMeta
            lesson={lesson} unit={unit} unitLessons={unitLessons} lessonIndex={lessonIndex}
            checklist={checklist} completedChecks={completedChecks} statusCfg={statusCfg}
            lessonSections={lessonSections} lessonBlocks={lessonBlocks}
            updateLesson={updateLesson} patchMeta={patchMeta}
            versionLabel={versionLabel} onVersionLabelChange={setVersionLabel}
            onNext={() => setActiveTab('body')}
          />
        </TabPanel>
        <TabPanel idBase="lesson" id="body" active={activeTab === 'body'}>
          <StepBody
            lesson={lesson} lessonSections={lessonSections} lessonBlocks={lessonBlocks}
            subjectId={subjectId} lessonId={lessonId} unitId={unitId} onAddSection={handleAddSection} onAddNewPart={handleAddNewPart}
            livePreview={showPhone} onToggleLivePreview={toggleLivePreview} onFocusSection={setFocusSectionId}
            onPrev={() => setActiveTab('meta')} onNext={() => setActiveTab('questions')}
          />
        </TabPanel>
        <TabPanel idBase="lesson" id="questions" active={activeTab === 'questions'}>
          <StepQuestions
            lessonId={lessonId} unitId={unitId} subjectId={subjectId} lessonSections={lessonSections}
            lessonQuestions={lessonQuestions} onOpenGlobal={openGlobal}
            onPrev={() => setActiveTab('body')} onNext={() => setActiveTab('feed')}
          />
        </TabPanel>
        <TabPanel idBase="lesson" id="feed" active={activeTab === 'feed'}>
          <StepFeed
            lessonId={lessonId} unitId={unitId} subjectId={subjectId} lessonConceptIds={lessonConceptIds}
            lessonFeedItems={lessonFeedItems} prevLesson={prevLesson} nextLesson={nextLesson}
            units={units} onOpenGlobal={openGlobal} onPrev={() => setActiveTab('questions')}
            onNavigateLesson={goToLesson} onBack={goBack}
          />
        </TabPanel>
        <TabPanel idBase="lesson" id="variations" active={activeTab === 'variations'}>
          <StepVariations
            lesson={lesson}
            variations={variations}
            onOpenLinkModal={() => setShowLinkVariation(true)}
            onUnlink={handleUnlinkVariation}
            onPrev={() => setActiveTab('feed')}
          />
        </TabPanel>
      </div>
      </div>

      {showPhone ? (
        <aside aria-label="معاينة حية" className="hidden xl:block w-[22rem] shrink-0 py-8">
          <div className="sticky top-32 flex flex-col gap-2">
            <span className="t-caption text-fg-subtle">كما يراه الطالب في بشير · يتبع ما تختاره في المخطط</span>
            <LessonPhone lesson={lesson} sections={lessonSections} blocks={lessonBlocks} questions={lessonQuestions}
              focusSectionId={focusSectionId} height="calc(100dvh - 11rem)" />
          </div>
        </aside>
      ) : (
        <aside aria-label="جاهزية الدرس والمراجعة" className="hidden xl:block w-80 shrink-0 py-8">
          <div className="sticky top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto scrollbar-none">
            {readinessPanel}
          </div>
        </aside>
      )}
      </div>

      {showReadiness && (
        <Drawer onClose={() => setShowReadiness(false)} labelledBy="readiness-drawer-title">
          <div className="flex items-center justify-between px-5 py-3 border-b border-line">
            <h2 id="readiness-drawer-title" className="t-title text-fg-strong">الجاهزية والمراجعة</h2>
            <IconButton icon={X} label="إغلاق" size="sm" onClick={() => setShowReadiness(false)} />
          </div>
          <div className="p-5 overflow-y-auto">{readinessPanel}</div>
        </Drawer>
      )}

      {showPreview && (
        <LessonPreviewModal
          lesson={lesson} sections={lessonSections} blocks={lessonBlocks}
          questions={lessonQuestions} onClose={() => setShowPreview(false)}
        />
      )}

      {showNotes && (
        <LessonNotesDrawer
          lessonId={lessonId}
          currentUser={currentUser}
          onClose={() => setShowNotes(false)}
          onCountChange={(n) => setNotesCount(n)}
        />
      )}

      {showHistory && (
        <LessonHistoryDrawer
          lessonId={lessonId}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showLinkVariation && (
        <LinkVariationModal
          currentLessonId={lessonId}
          onLink={handleLinkVariation}
          onClose={() => setShowLinkVariation(false)}
        />
      )}
    </EditorPage>
    </MathNotationContext.Provider>
  );
}

// ─── Step 1: Meta ─────────────────────────────────────────────────────────────
function StepMeta({ lesson, unit, unitLessons, lessonIndex, checklist, completedChecks, statusCfg, lessonSections, lessonBlocks, updateLesson, patchMeta, versionLabel, onVersionLabelChange, onNext }) {
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3 pb-1">
        <div>
          <h2 className="text-base font-semibold text-sand-200 font-arabic">بيانات الدرس</h2>
          <p className="text-sm text-ink-400 font-arabic mt-0.5">
            {unit?.title} · درس {lessonIndex + 1} من {unitLessons.length}
          </p>
        </div>
        <div className="flex-1" />
        <span className={`text-xs font-arabic px-2.5 py-1 rounded-full border ${statusCfg.badge}`}>
          {statusCfg.label}
        </span>
      </div>

      <Card>
        <CardHeader icon={<NotebookPen size={13} strokeWidth={1.9} />} title="المعلومات الأساسية" hint="تظهر للطالب قبل دخول الدرس" />
        <div className="p-5 space-y-4">
          <Field label="عنوان الدرس" required>
            <input type="text" value={lesson.title}
              onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
              className={FIELD} placeholder="أدخل عنوان الدرس…" />
            {lesson.title && SCAFFOLD_TITLE_RE.test(lesson.title.trim()) && (
              <p className="text-sm text-amber-600 font-arabic mt-1.5 inline-flex items-center gap-1"><TriangleAlert size={14} strokeWidth={1.9} /> هذا عنوان تلقائي — أدخل عنواناً حقيقياً</p>
            )}
          </Field>
          <Field label="ملخص الدرس">
            <textarea value={lesson.summary || ''}
              onChange={(e) => updateLesson(lesson.id, { summary: e.target.value })}
              className={`${FIELD} resize-y min-h-[88px]`}
              placeholder="ملخص قصير يصف محتوى الدرس — يظهر في قائمة الدروس…" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="الوقت المقدر">
              <div className="flex items-center gap-2">
                <input type="number" value={lesson.estimatedMinutes || 15}
                  onChange={(e) => updateLesson(lesson.id, { estimatedMinutes: parseInt(e.target.value) || 15 })}
                  className="w-20 px-3 py-2.5 bg-ink-950 border border-ink-800 rounded-xl text-sand-200 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none text-center font-mono"
                  min="1" />
                <span className="text-sm text-ink-400 font-arabic">دقيقة</span>
              </div>
            </Field>
            <Field label="الإحصائيات">
              <div className="flex gap-5 pt-1">
                <Stat label="أقسام" val={lessonSections.length} />
                <Stat label="عناصر" val={lessonBlocks.length} />
              </div>
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader icon={<Sparkles size={13} strokeWidth={1.9} />} title="التحفيز والتوجيه" hint="اختياري — يُشاهده الطالب قبل بدء الدرس" />
        <div className="p-5 space-y-4">
          <Field label="السؤال التحفيزي" hint="يستثير فضول الطالب قبل البدء">
            <textarea value={lesson.metadata?.hook || ''}
              onChange={(e) => patchMeta({ hook: e.target.value || null })}
              className={`${FIELD} resize-y min-h-[68px]`}
              placeholder="هل تساءلت كيف يحدد الملاحون موقعهم؟…" />
          </Field>
          <Field label="إجابة السؤال التحفيزي" hint="تظهر قرب نهاية الدرس، بعد أن يقرأ الطالب ما يكفي لفهمها">
            <textarea value={lesson.metadata?.hookAnswer || ''}
              onChange={(e) => patchMeta({ hookAnswer: e.target.value || null })}
              className={`${FIELD} resize-y min-h-[68px]`}
              placeholder="باستخدام خطوط الطول والعرض…" />
          </Field>
          <Field label="ستتعلم في هذا الدرس" hint="نقاط توجيهية تظهر قبل المحتوى">
            <OrientationInput value={lesson.metadata?.orientation || []} onChange={(v) => patchMeta({ orientation: v })} />
          </Field>
          <Field label="الجملة الشدّاءة" hint="على بطاقة الإتمام — تشجع على الدرس التالي">
            <input type="text" value={lesson.metadata?.forwardPull || ''}
              onChange={(e) => patchMeta({ forwardPull: e.target.value || null })}
              className={FIELD} placeholder="درس واحد يفصلك عن إكمال الوحدة…" />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader icon={<CircleDot size={13} strokeWidth={1.9} />} title="تجميع الدروس" hint="اختياري — يُنظِّم الدروس في مجموعات داخل الوحدة" />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="معرّف المجموعة" hint="ثابت — مثال: ARABIC_U1_G1">
              <input
                type="text"
                value={lesson.groupId || ''}
                onChange={(e) => updateLesson(lesson.id, { groupId: e.target.value.trim().toUpperCase() || null })}
                className={FIELD}
                placeholder="ARABIC_U1_G1"
                dir="ltr"
              />
            </Field>
            <Field label="اسم المجموعة" hint="يظهر كعنوان فرعي في التطبيق">
              <input
                type="text"
                value={lesson.groupTitle || ''}
                onChange={(e) => updateLesson(lesson.id, { groupTitle: e.target.value || null })}
                className={FIELD}
                placeholder="فهم المقروء"
              />
            </Field>
          </div>

          <Field label="وصف المجموعة" hint="اختياري — ملاحظات عن هذه المجموعة">
            <textarea
              value={lesson.groupMetadata ? (() => { try { return JSON.parse(lesson.groupMetadata)?.description || ''; } catch { return ''; } })() : ''}
              onChange={(e) => {
                const desc = e.target.value.trim();
                updateLesson(lesson.id, {
                  groupMetadata: desc ? JSON.stringify({ description: desc }) : null,
                });
              }}
              className={`${FIELD} resize-y min-h-[60px]`}
              placeholder="وصف يساعد المحررين على فهم منطق هذه المجموعة…"
            />
          </Field>

          {/* Live preview of how it appears in the app */}
          {lesson.groupTitle && (
            <div className="mt-1 pt-4 border-t border-ink-800/40">
              <p className="text-xs text-ink-500 font-arabic mb-2">معاينة في التطبيق</p>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-800/30 border border-ink-800/60 w-fit">
                <span className="w-1 h-3 rounded-full bg-sand-700/60" />
                <span className="text-xs font-arabic text-ink-400">{lesson.groupTitle}</span>
              </div>
            </div>
          )}

          {/* Warning when groupId is set but groupTitle is missing (or vice versa) */}
          {(lesson.groupId && !lesson.groupTitle) && (
            <p className="text-xs text-amber-600 font-arabic inline-flex items-center gap-1"><TriangleAlert size={12} strokeWidth={1.9} /> معرّف المجموعة موجود دون اسم — أضف الاسم حتى يظهر في التطبيق</p>
          )}
          {(!lesson.groupId && lesson.groupTitle) && (
            <p className="text-xs text-amber-600 font-arabic inline-flex items-center gap-1"><TriangleAlert size={12} strokeWidth={1.9} /> اسم المجموعة موجود دون معرّف — أضف المعرّف لربط الدروس معاً</p>
          )}
          {lesson.groupId && lesson.groupTitle && (
            <p className="text-xs text-emerald-700 font-arabic inline-flex items-center gap-1"><Check size={12} strokeWidth={2} /> مجموعة محددة — ستظهر الدروس ذات المعرّف نفسه تحت عنوان واحد</p>
          )}
        </div>
      </Card>

      {/* The completion checklist that sat here moved to the readiness panel
          (LessonReadiness), which stays in view on every tab. */}
      <Card>
        <CardHeader icon={<CircleDot size={13} strokeWidth={1.9} />} title="وسم الإصدار" />
        <div className="p-5">
          {/* Version label — attaches a short note to the next save/submit */}
          <div>
            <label className="text-sm text-ink-400 font-arabic block mb-1.5">
              وسم الإصدار
              <span className="text-ink-500 mr-1">(اختياري — يظهر في سجل التعديلات)</span>
            </label>
            <input
              type="text"
              value={versionLabel}
              onChange={(e) => onVersionLabelChange(e.target.value.slice(0, 80))}
              placeholder="مثال: مراجعة بعد الفيدباك، تصحيح أمثلة…"
              className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-sm font-arabic placeholder-ink-600 focus:outline-none focus:border-sand-700 transition-colors"
            />
            {versionLabel && (
              <p className="text-xs text-ink-500 font-mono mt-1 text-left">{versionLabel.length}/80</p>
            )}
          </div>
        </div>
      </Card>

      <StepFooter onNext={onNext} nextLabel="المحتوى ←" />
    </div>
  );
}

// ─── Lesson outline ───────────────────────────────────────────────────────────
// The sections at a glance: role, title, how full. Jumping scrolls the editor
// and, when it is open, the phone beside it (DS2 step 4, EdContentTab).
function LessonOutline({ sections, blocks, onPick }) {
  if (sections.length < 2) return null;
  return (
    <nav aria-label="مخطط الدرس" className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-2">
      {sections.map((s, i) => {
        const n = blocks.filter((b) => b.sectionId === s.id).length;
        const role = s.kind && s.kind !== 'GENERAL' ? SECTION_KIND_CONFIG[s.kind]?.label : null;
        return (
          <button key={s.id} type="button" onClick={() => onPick(s.id)}
            className="shrink-0 max-w-56 flex flex-col items-start gap-0.5 px-3 py-2 rounded-control border border-line bg-raised hover:border-line-strong text-start">
            <span className="t-caption text-fg-subtle">{i + 1}{role ? ` · ${role}` : ''}</span>
            <span className="t-label text-fg-strong truncate max-w-full">{s.title}</span>
            <span className={`t-caption ${n ? 'text-fg-muted' : 'text-warn'}`}>{n ? `${n} عناصر` : 'فارغ'}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── Step 2: Body ─────────────────────────────────────────────────────────────
function StepBody({ lesson, lessonSections, lessonBlocks, subjectId, lessonId, unitId, onAddSection, onAddNewPart, onPrev, onNext, livePreview, onToggleLivePreview, onFocusSection }) {
  const partsMap = lessonSections.reduce((acc, s) => {
    const p = s.partIndex ?? 0;
    if (!acc[p]) acc[p] = [];
    acc[p].push(s);
    return acc;
  }, {});
  const partKeys    = Object.keys(partsMap).map(Number).sort((a, b) => a - b);
  const maxPart     = partKeys.length > 0 ? Math.max(...partKeys) : 0;
  const isMultiPart = partKeys.length > 1 || maxPart > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="text-base font-semibold text-sand-200 font-arabic">محتوى الدرس</h2>
        <span className="text-sm text-ink-400 font-arabic">
          {lessonSections.length} {lessonSections.length === 1 ? 'قسم' : 'أقسام'}
          {lessonBlocks.length > 0 && ` · ${lessonBlocks.length} عنصر`}
        </span>
        {isMultiPart && (
          <span className="text-sm text-ink-500 font-arabic px-2 py-0.5 bg-ink-800/40 rounded-full border border-ink-800">
            {partKeys.length} أجزاء
          </span>
        )}
        <Button size="sm" variant={livePreview ? 'primary' : 'secondary'} icon={Smartphone} onClick={onToggleLivePreview}
          aria-pressed={livePreview} className="ms-auto">
          {livePreview ? 'إخفاء المعاينة' : 'معاينة بجانبه'}
        </Button>
      </div>

      <LessonOutline sections={lessonSections} blocks={lessonBlocks} onPick={(id) => {
        document.querySelector(`[data-sync-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        onFocusSection(id);
      }} />

      {lessonSections.length === 0 && (
        <div
          className="py-20 text-center border-2 border-dashed border-ink-800/60 rounded-2xl cursor-pointer group hover:border-sand-800/40 hover:bg-sand-900/5 transition-all"
          onClick={onAddNewPart}
        >
          <FileText size={34} strokeWidth={1.5} className="mx-auto mb-3 opacity-40 text-ink-500" />
          <p className="text-sm text-ink-500 font-arabic mb-1">لا يوجد محتوى بعد</p>
          <p className="text-sm text-ink-500 font-arabic group-hover:text-sand-700 transition-colors">اضغط لإضافة أول قسم</p>
        </div>
      )}

      {partKeys.map((partIdx, pi) => (
        <div key={partIdx} className="space-y-3">

          {/* Part break — only shown when there are multiple parts */}
          {isMultiPart && (
            <div className="relative mt-8 mb-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-0.5 bg-sand-700/60 rounded-full" />
                <div className="flex-1 h-px bg-ink-800/50" />
              </div>
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-mono text-ink-500 uppercase">part</span>
                  <span className="text-sm font-semibold text-sand-600 font-arabic">
                    الجزء {PART_NAMES_AR[pi] || (pi + 1)}
                  </span>
                  <span className="text-sm text-ink-500 font-arabic">
                    {partsMap[partIdx].length} {partsMap[partIdx].length === 1 ? 'قسم' : 'أقسام'}
                  </span>
                </div>
                <span
                  className="text-8xl font-bold font-arabic leading-none select-none pointer-events-none"
                  style={{ color: 'rgba(212,137,30,0.07)' }}
                >
                  {PART_NUMS_AR[pi] || (pi + 1)}
                </span>
              </div>
            </div>
          )}

          {partsMap[partIdx].map((section) => (
            <SectionEditor key={section.id} section={section} index={lessonSections.indexOf(section)} maxPart={maxPart}
            subjectId={subjectId} lessonId={lessonId} unitId={unitId} />
          ))}

          <button
            onClick={() => onAddSection(partIdx)}
            className="w-full py-3 border border-dashed border-ink-800/60 rounded-xl text-ink-500 hover:border-sand-800/50 hover:text-sand-600 hover:bg-sand-900/5 transition-all font-arabic text-sm flex items-center justify-center gap-2 group"
          >
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs group-hover:bg-sand-900/20 transition-colors">+</span>
            <span>إضافة قسم{isMultiPart ? ` في الجزء ${PART_NAMES_AR[pi] || (pi + 1)}` : ''}</span>
          </button>
        </div>
      ))}

      {lessonSections.length > 0 && (
        <button
          onClick={onAddNewPart}
          className="w-full mt-4 py-5 border-2 border-dashed border-ink-800/40 rounded-2xl text-ink-400 hover:border-sand-800/30 hover:text-sand-600 hover:bg-sand-900/5 transition-all font-arabic flex items-center justify-center gap-3 group"
        >
          <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm group-hover:bg-sand-900/20 transition-colors">+</span>
          <span className="text-sm">إضافة جزء جديد</span>
        </button>
      )}

      <StepFooter onPrev={onPrev} onNext={onNext} prevLabel="→ البيانات" nextLabel="الأسئلة ←" />
    </div>
  );
}

// ─── Step 3: Questions ────────────────────────────────────────────────────────
function StepQuestions({ lessonId, unitId, subjectId, lessonSections, lessonQuestions, onOpenGlobal, onPrev, onNext }) {
  const checkpoints = lessonQuestions.filter(q =>  q.isCheckpoint);
  const standalone  = lessonQuestions.filter(q => !q.isCheckpoint);
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="pb-1">
        <h2 className="text-base font-semibold text-sand-200 font-arabic">الأسئلة</h2>
        <p className="text-sm text-ink-400 font-arabic mt-0.5">
          نقاط التحقق تُضاف من داخل أقسام المحتوى · أسئلة التدريب تُضاف هنا
        </p>
      </div>
      <Card>
        <CardHeader icon={<CircleDot size={13} strokeWidth={1.9} />} title="نظرة عامة" />
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard
              label="نقاط تحقق"
              sublabel="مدمجة في الأقسام"
              value={checkpoints.length}
              note={checkpoints.length > 0 ? `في ${[...new Set(checkpoints.map(q => q.sectionId).filter(Boolean))].length} قسم` : null}
            />
            <StatCard label="أسئلة تدريب" sublabel="بنك أسئلة الدرس" value={standalone.length} />
          </div>
          {checkpoints.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {checkpoints.map((q) => {
                const sec = lessonSections.find((s) => s.id === q.sectionId);
                return (
                  <div key={q.id} className="flex items-center gap-2 text-xs font-arabic px-3 py-1.5 bg-amber-950/15 border border-amber-900/25 rounded-lg text-ink-400">
                    <CircleDot size={12} strokeWidth={1.9} className="text-amber-600/70" />
                    <span className="flex-1 truncate">{q.textAr}</span>
                    {sec && <span className="text-ink-600 truncate max-w-[100px]">{sec.title}</span>}
                  </div>
                );
              })}
            </div>
          )}
          {lessonQuestions.length === 0 && (
            <div className="mt-4 py-6 text-center border border-dashed border-ink-800/50 rounded-xl">
              <Target size={30} strokeWidth={1.6} className="mx-auto mb-2 text-ink-500" />
              <p className="text-sm text-ink-400 font-arabic">لا توجد أسئلة مرتبطة بهذا الدرس</p>
              <p className="text-xs text-ink-600 font-arabic mt-1">أضف نقاط تحقق من تبويب المحتوى</p>
            </div>
          )}
        </div>
      </Card>
      <LessonQuestionsPanel lessonId={lessonId} unitId={unitId} subjectId={subjectId} onOpenGlobal={onOpenGlobal} />
      <StepFooter onPrev={onPrev} onNext={onNext} prevLabel="→ المحتوى" nextLabel="التغذية ←" />
    </div>
  );
}

// ─── Step 4: Feed ─────────────────────────────────────────────────────────────
function StepFeed({ lessonId, unitId, subjectId, lessonConceptIds, lessonFeedItems, prevLesson, nextLesson, units, onOpenGlobal, onPrev, onNavigateLesson, onBack }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="pb-1">
        <h2 className="text-base font-semibold text-sand-200 font-arabic">بطاقات التغذية</h2>
        <p className="text-sm text-ink-400 font-arabic mt-0.5">بطاقات المراجعة السريعة في تطبيق بشير</p>
      </div>
      <Card>
        <CardHeader icon={<Smartphone size={13} strokeWidth={1.9} />} title="نظرة عامة" />
        <div className="p-5">
          {lessonFeedItems.length === 0 ? (
            <div className="py-6 text-center border border-dashed border-ink-800/50 rounded-xl">
              <Smartphone size={30} strokeWidth={1.6} className="mx-auto mb-2 text-ink-500" />
              <p className="text-sm text-ink-400 font-arabic">لا توجد بطاقات تغذية لهذا الدرس</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono text-sand-400">{lessonFeedItems.length}</span>
              <span className="text-sm text-ink-400 font-arabic">بطاقة</span>
            </div>
          )}
        </div>
      </Card>
      <LessonFeedPanel lessonId={lessonId} unitId={unitId} subjectId={subjectId} lessonConceptIds={lessonConceptIds} onOpenGlobal={onOpenGlobal} />
      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-ink-800/50">
        <button onClick={onPrev} className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-500 hover:text-sand-400 border border-ink-800 hover:border-ink-700 rounded-xl transition-colors font-arabic hover:bg-ink-900/40">
          → الأسئلة
        </button>
        <div className="flex-1" />
        <LessonNav prevLesson={prevLesson} nextLesson={nextLesson} units={units} onNavigateLesson={onNavigateLesson} onBack={onBack} />
      </div>
    </div>
  );
}

// ─── Step 5: Variations ───────────────────────────────────────────────────────
function StepVariations({ lesson, variations, onOpenLinkModal, onUnlink, onPrev }) {
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3 pb-1">
        <div>
          <h2 className="text-base font-semibold text-sand-200 font-arabic">التنويعات</h2>
          <p className="text-sm text-ink-400 font-arabic mt-0.5">
            دروس مرتبطة بهذا الدرس كبديل أو متطلب أو توسع أو نسخة مبسطة
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={onOpenLinkModal}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-arabic rounded-lg
            bg-sand-900/40 border border-sand-800/60 text-sand-400
            hover:bg-sand-800/40 hover:text-sand-200 transition-all"
        >
          <span className="text-sm leading-none">＋</span>
          ربط درس
        </button>
      </div>

      {/* This lesson is itself a variation — show parent info */}
      {lesson.parentLesson && (
        <div className="px-4 py-3 rounded-xl border border-ink-700/60 bg-ink-800/30 flex items-center gap-3">
          <Upload size={18} strokeWidth={1.9} className="text-ink-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink-400 font-arabic">هذا الدرس تنويع من:</p>
            <p className="text-sm text-ink-300 font-arabic truncate font-mono">{lesson.parentLesson}</p>
          </div>
          {lesson.variationType && VARIATION_CONFIG[lesson.variationType] && (() => {
            const cfg = VARIATION_CONFIG[lesson.variationType];
            return (
              <span
                className="text-xs font-arabic px-2 py-0.5 rounded border shrink-0"
                style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
              >
                {(() => {
                  const Icon = cfg.icon;
                  return <><Icon size={13} strokeWidth={1.9} className="inline ml-1" /> {cfg.label}</>;
                })()}
              </span>
            );
          })()}
        </div>
      )}

      {/* Variations list */}
      {variations.length === 0 ? (
        <div
          className="py-16 text-center border-2 border-dashed border-ink-800/60 rounded-2xl
            cursor-pointer group hover:border-sand-800/40 hover:bg-sand-900/5 transition-all"
          onClick={onOpenLinkModal}
        >
          <Link2 size={34} strokeWidth={1.5} className="mx-auto mb-3 opacity-30 text-ink-500" />
          <p className="text-sm text-ink-500 font-arabic mb-1">لا توجد دروس متنوعة مرتبطة</p>
          <p className="text-sm text-ink-500 font-arabic group-hover:text-sand-700 transition-colors">
            اضغط لربط درس بديل أو متطلب أو توسع…
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {variations.map((v) => {
            const cfg = v.variationType ? VARIATION_CONFIG[v.variationType] : null;
            return (
              <div
                key={v.contentId}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border group"
                style={{
                  borderColor: cfg?.border || 'var(--border-subtle)',
                  background:  cfg ? cfg.bg : 'rgba(26,23,19,0.4)',
                }}
              >
                {/* Type chip */}
                {cfg && (
                  <span
                    className="text-base leading-none shrink-0"
                    style={{ color: cfg.color }}
                    title={cfg.label}
                  >
                    {(() => {
                      const Icon = cfg.icon;
                      return <Icon size={16} strokeWidth={1.9} />;
                    })()}
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-arabic text-ink-100 truncate">{v.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {cfg && (
                      <span className="text-sm font-arabic" style={{ color: cfg.color }}>
                        {cfg.label}
                      </span>
                    )}
                    {v.variationNote && (
                      <span className="text-sm text-ink-400 font-arabic truncate">
                        · {v.variationNote}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <span className="text-sm text-ink-400 font-mono shrink-0 hidden sm:block">
                  {v.status || 'draft'}
                </span>

                {/* Unlink */}
                <button
                  onClick={() => onUnlink(v.contentId)}
                  className="hover-reveal transition-opacity
                    text-ink-500 hover:text-red-500 text-sm px-2 py-1 rounded
                    hover:bg-red-900/20 font-arabic"
                  title="إلغاء الربط"
                >
                  <X size={14} strokeWidth={1.9} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Type legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        {Object.entries(VARIATION_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon;
          return (
          <div
            key={type}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: cfg.border, background: cfg.bg }}
          >
            <Icon size={15} strokeWidth={1.9} style={{ color: cfg.color }} />
            <div>
              <span className="font-arabic font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
              <span className="text-ink-400 font-arabic block text-sm">
                {type === 'alternative'  && 'نهج أو مؤلف مختلف'}
                {type === 'prerequisite' && 'يُدرس قبل هذا الدرس'}
                {type === 'extension'    && 'محتوى متقدم للراغبين'}
                {type === 'simplified'   && 'نسخة أسهل للمبتدئين'}
              </span>
            </div>
          </div>
        );
        })}
      </div>

      <StepFooter onPrev={onPrev} prevLabel="→ التغذية" />
    </div>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Card({ children }) {
  return <div className="bg-ink-900/50 rounded-2xl border border-ink-800/80 overflow-hidden">{children}</div>;
}

function CardHeader({ icon, title, hint }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-ink-800/60 bg-ink-800/15">
      <span className="text-sand-700 text-xs">{icon}</span>
      <h3 className="text-sm font-semibold text-sand-300 font-arabic">{title}</h3>
      {hint && <span className="text-sm text-ink-500 font-arabic mr-auto">{hint}</span>}
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-sm font-medium text-ink-500 font-arabic">
          {label}{required && <span className="text-red-600 mr-0.5">*</span>}
        </label>
        {hint && <span className="text-sm text-ink-500 font-arabic">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, val }) {
  return (
    <div className="text-center">
      <p className="text-lg font-mono text-ink-400">{val}</p>
      <p className="text-sm text-ink-500 font-arabic">{label}</p>
    </div>
  );
}

function StatCard({ label, sublabel, value, note }) {
  return (
    <div className="bg-ink-800/30 rounded-xl border border-ink-800/70 p-4 text-center">
      <p className="text-2xl font-mono text-sand-400 leading-none">{value}</p>
      <p className="text-sm text-ink-400 font-arabic mt-1.5">{label}</p>
      <p className="text-sm text-ink-500 font-arabic mt-0.5">{note || sublabel}</p>
    </div>
  );
}

function StepFooter({ onPrev, onNext, prevLabel, nextLabel }) {
  return (
    <div className="flex items-center gap-3 mt-8 pt-5 border-t border-ink-800/50">
      {onPrev && (
        <button onClick={onPrev} className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-500 hover:text-sand-400 border border-ink-800 hover:border-ink-700 rounded-xl transition-colors font-arabic hover:bg-ink-900/40">
          {prevLabel}
        </button>
      )}
      <div className="flex-1" />
      {onNext && (
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-2.5 bg-sand-800/80 hover:bg-sand-700 text-ink-950 text-sm font-bold rounded-xl transition-colors font-arabic border border-sand-700">
          {nextLabel}
        </button>
      )}
    </div>
  );
}

function LessonNav({ prevLesson, nextLesson, units, onNavigateLesson, onBack }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onBack} className="text-sm text-ink-400 hover:text-ink-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-ink-800 font-arabic">
        قائمة الدروس
      </button>
      {prevLesson && (
        <button onClick={() => onNavigateLesson?.(prevLesson.id, prevLesson._unitId)}
          className="flex items-center gap-1.5 text-ink-400 hover:text-sand-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-ink-900 text-sm font-arabic">
          <span className="truncate max-w-[100px]">{prevLesson.title}</span>
          <span>→</span>
        </button>
      )}
      {nextLesson && (
        <button onClick={() => onNavigateLesson?.(nextLesson.id, nextLesson._unitId)}
          className="flex items-center gap-1.5 text-ink-400 hover:text-sand-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-ink-900 text-sm font-arabic">
          <span>←</span>
          <span className="truncate max-w-[100px]">{nextLesson.title}</span>
        </button>
      )}
    </div>
  );
}

function OrientationInput({ value = [], onChange }) {
  const [draft, setDraft] = useState('');
  const addItem    = () => { const t = draft.trim(); if (!t) return; onChange([...value, t]); setDraft(''); };
  const removeItem = (i) => onChange(value.filter((_, j) => j !== i));
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group">
          <span className="text-sand-700 text-sm mt-2.5 shrink-0">•</span>
          <span className="flex-1 text-sm text-ink-200 font-arabic py-1.5 leading-relaxed">{item}</span>
          <button onClick={() => removeItem(i)} aria-label="حذف البند" className="hover-reveal transition-opacity text-ink-500 hover:text-red-500 text-xs mt-2"><X size={13} strokeWidth={1.9} /></button>
        </div>
      ))}
      <div className="flex gap-2">
        {/* min-w-0: a flex item defaults to min-width:auto, so this input
            refused to shrink below its placeholder's intrinsic width and
            pushed itself and the + button off the edge on a phone. */}
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          className="min-w-0 flex-1 px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-sm font-arabic placeholder-ink-600 focus:outline-none focus:border-sand-700 transition-colors"
          placeholder="ستتعلم في هذا الدرس… ثم اضغط Enter" />
        <button onClick={addItem} className="shrink-0 px-3 py-2 bg-ink-800 border border-ink-700 rounded-lg text-ink-400 hover:text-sand-400 text-sm transition-colors">+</button>
      </div>
    </div>
  );
}
