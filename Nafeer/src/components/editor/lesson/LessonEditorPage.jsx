'use client';
import { useState, useEffect } from 'react';
import { useDataStore }    from '@/store/dataStore';
import { useAtlasSync }    from '@/hooks/useAtlasSync';
import { getLessonStatus, STATUS_CONFIG } from '@/lib/LessonStatus';
import SectionEditor        from '@/components/editor/lesson/SectionEditor';
import LessonQuestionsPanel from '@/components/editor/lesson/LessonQuestionsPanel';
import LessonFeedPanel      from '@/components/editor/lesson/LessonFeedPanel';
import StatusBadge          from '@/components/editor/shared/StatusBadge';
import LessonPreviewModal   from '@/components/editor/lesson/LessonPreviewModal';
import AttributionBar       from '@/components/editor/lesson/AttributionBar';
import LessonNotesDrawer    from '@/components/editor/lesson/LessonNotesDrawer';
import LessonHistoryDrawer  from '@/components/editor/lesson/LessonHistoryDrawer';
import LinkVariationModal, { VARIATION_CONFIG } from '@/components/editor/lesson/LinkVariationModal';

const SCAFFOLD_TITLE_RE = /^الدرس\s+\d+$/;

const FIELD =
  'w-full px-4 py-3 bg-ink-950 border border-ink-800 rounded-xl text-sand-200 ' +
  'focus:ring-1 focus:ring-sand-600 focus:border-sand-700 focus:outline-none ' +
  'font-arabic placeholder-ink-700 text-sm leading-relaxed transition-colors ' +
  'hover:border-ink-700';

const TABS = [
  { id: 'meta',      ar: '١', label: 'البيانات' },
  { id: 'body',      ar: '٢', label: 'المحتوى'  },
  { id: 'questions', ar: '٣', label: 'الأسئلة'  },
  { id: 'feed',      ar: '٤', label: 'التغذية'  },
];

const PART_NAMES_AR = ['الأوَّل', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
const PART_NUMS_AR  = ['١', '٢', '٣', '٤', '٥', '٦'];

export default function LessonEditorPage({
  lessonId, unitId, subjectId,
  onBack, onBackToOverview, onNavigateLesson, onOpenGlobal,
  isSyncing, syncError, lastSynced,
  currentUser,
}) {
  const {
    units, lessons, sections, blocks, questions, feedItems,
    updateLesson, addSection,
  } = useDataStore();
  const { syncAll, submitForReview } = useAtlasSync();

  const [activeTab,     setActiveTab]     = useState(0);
  const [saveSuccess,   setSaveSuccess]   = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showPreview,   setShowPreview]   = useState(false);
  const [showNotes,        setShowNotes]        = useState(false);
  const [showHistory,      setShowHistory]      = useState(false);
  const [showLinkVariation, setShowLinkVariation] = useState(false);
  const [notesCount,       setNotesCount]       = useState(0);
  const [versionLabel,     setVersionLabel]     = useState('');
  const [variations,       setVariations]       = useState([]);
  // Attribution data fetched from the lesson GET response (populated server-side)
  const [attribution,      setAttribution]      = useState(null);

  const lesson         = lessons.find((l) => l.id === lessonId);
  const unit           = units.find((u) => u.id === unitId);

  // Fetch attribution + notesCount once when the lesson changes
  useEffect(() => {
    if (!lessonId) return;
    fetch(`/api/content/lessons/${lessonId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setAttribution(res.data.attribution || null);
          setNotesCount(res.data.notesCount ?? 0);
          setVariations(res.data.variations  || []);
        }
      })
      .catch(() => {/* non-blocking */});
  }, [lessonId]);
  const lessonSections = sections.filter((s) => s.lessonId === lessonId).sort((a, b) => a.order - b.order);
  const sectionIds     = lessonSections.map((s) => s.id);
  const lessonBlocks   = blocks.filter((b) => sectionIds.includes(b.sectionId));
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

  const checklist = lesson ? [
    { label: 'عنوان',  done: !!lesson.title?.trim() && !SCAFFOLD_TITLE_RE.test(lesson.title.trim()) },
    { label: 'ملخص',  done: !!lesson.summary?.trim()   },
    { label: 'أقسام', done: lessonSections.length > 0  },
    { label: 'محتوى', done: lessonBlocks.length > 0    },
    { label: 'أسئلة', done: lessonQuestions.length > 0 },
    { label: 'تغذية', done: lessonFeedItems.length > 0 },
  ] : [];
  const completedChecks = checklist.filter((c) => c.done).length;

  const tabDone = (tab) => {
    if (tab.id === 'meta')      return checklist.slice(0,2).every(c => c.done);
    if (tab.id === 'body')      return checklist.slice(2,4).every(c => c.done);
    if (tab.id === 'questions') return checklist[4]?.done;
    if (tab.id === 'feed')      return checklist[5]?.done;
    return false;
  };

  const handleSave = async () => {
    if (!subjectId) return;
    try {
      await syncAll(lessonId, subjectId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch { /* SyncBar handles it */ }
  };

  const handleSubmitForReview = async () => {
    if (!subjectId) return;
    try {
      await syncAll(lessonId, subjectId);
      await submitForReview(lessonId, 'lesson');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3500);
    } catch { /* SyncBar handles it */ }
  };

  const patchMeta = (patch) =>
    updateLesson(lesson.id, { metadata: { ...(lesson.metadata || {}), ...patch } });

  // ── Variation handlers ───────────────────────────────────────────────────
  const handleLinkVariation = async (targetLessonId, variationType, variationNote) => {
    await fetch(`/api/content/lessons/${targetLessonId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ parentLesson: lessonId, variationType, variationNote }),
    });
    // Optimistic local update
    updateLesson(targetLessonId, { parentLesson: lessonId, variationType, variationNote });
    // Re-fetch variations list for this lesson
    const res  = await fetch(`/api/content/lessons/${lessonId}`);
    const json = await res.json();
    if (json.ok) setVariations(json.data.variations || []);
  };

  const handleUnlinkVariation = async (targetLessonId) => {
    await fetch(`/api/content/lessons/${targetLessonId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ parentLesson: null, variationType: null, variationNote: null }),
    });
    updateLesson(targetLessonId, { parentLesson: null, variationType: null, variationNote: null });
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
    <div className="text-center py-32">
      <div className="text-4xl mb-4">📝</div>
      <h2 className="text-lg font-medium text-ink-400 mb-4 font-arabic">الدرس غير موجود</h2>
      <button onClick={onBack} className="px-6 py-2 bg-sand-700 text-ink-950 rounded-lg font-arabic">العودة</button>
    </div>
  );

  const syncDot = isSyncing
    ? <span className="w-1.5 h-1.5 rounded-full bg-sand-500 animate-pulse" />
    : syncError
      ? <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      : lastSynced
        ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        : null;

  const circumference = 2 * Math.PI * 9;

  return (
    <div className="min-h-screen flex flex-col bg-ink-950">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-ink-950/98 backdrop-blur-md border-b border-ink-800/70">

        {/* Row 1 */}
        <div className="flex items-center gap-3 px-5 h-12">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-sand-400 transition-colors font-arabic shrink-0 group"
          >
            <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
            <span className="hidden sm:inline">{unit?.title ?? 'الدروس'}</span>
          </button>

          <span className="text-ink-400 text-xs">›</span>

          <h1 className="flex-1 text-sm font-semibold text-sand-200 font-arabic truncate min-w-0">
            {lesson.title}
          </h1>

          {syncDot && <span className="shrink-0 flex items-center">{syncDot}</span>}
          {lesson.atlasStatus && <StatusBadge status={lesson.atlasStatus} />}

          {/* Progress ring */}
          <div className="relative w-6 h-6 shrink-0">
            <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-400" />
              <circle
                cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="text-emerald-600 transition-all duration-500"
                strokeDasharray={`${(completedChecks / 6) * circumference} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-ink-500">
              {completedChecks}
            </span>
          </div>

          {(!lesson.atlasStatus || lesson.atlasStatus === 'draft') && (
            <button
              onClick={handleSubmitForReview}
              disabled={isSyncing}
              className="hidden sm:flex items-center gap-1.5 px-3 h-7 text-amber-400 text-xs font-semibold rounded-lg border border-amber-800/50 bg-amber-900/20 hover:bg-amber-800/30 disabled:opacity-40 font-arabic transition-colors"
            >
              {reviewSuccess ? '✓ أُرسل' : '⇪ مراجعة'}
            </button>
          )}

          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 h-7 text-ink-400 hover:text-sand-300 text-xs font-semibold rounded-lg border border-ink-700 bg-ink-800/60 hover:bg-ink-700/60 font-arabic transition-colors"
            title="سجل الإصدارات"
          >
            <span className="text-xs leading-none">🕒</span>
            <span className="hidden sm:inline">السجل</span>
          </button>

          <button
            onClick={() => setShowNotes(true)}
            className="relative flex items-center gap-1.5 px-3 h-7 text-ink-400 hover:text-sand-300 text-xs font-semibold rounded-lg border border-ink-700 bg-ink-800/60 hover:bg-ink-700/60 font-arabic transition-colors"
          >
            <span className="text-xs leading-none">📝</span>
            <span className="hidden sm:inline">ملاحظات</span>
            {notesCount > 0 && (
              <span className="absolute -top-1.5 -left-1 w-4 h-4 bg-sand-700 text-ink-950 text-xs font-bold rounded-full flex items-center justify-center font-mono leading-none">
                {notesCount > 9 ? '9+' : notesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 h-7 text-ink-400 hover:text-sand-300 text-xs font-semibold rounded-lg border border-ink-700 bg-ink-800/60 hover:bg-ink-700/60 font-arabic transition-colors"
          >
            <span className="text-xs leading-none">👁</span>
            <span className="hidden sm:inline">معاينة</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 h-7 bg-sand-700 hover:bg-sand-600 disabled:opacity-40 text-ink-950 text-xs font-bold rounded-lg transition-colors font-arabic"
          >
            {isSyncing
              ? <><span className="w-3 h-3 border-2 border-ink-800 border-t-transparent rounded-full animate-spin" />حفظ…</>
              : saveSuccess ? '✓ تم' : '↑ حفظ'}
          </button>
        </div>

        {/* Attribution bar */}
        {(attribution || lesson.version > 1) && (
          <AttributionBar lesson={lesson} attribution={attribution} />
        )}

        {/* Sync error */}
        {syncError && (
          <div className="flex items-center gap-2 px-5 py-1.5 bg-red-950/50 border-t border-red-900/30 text-red-400 text-sm font-arabic">
            <span>⚠</span>
            <span className="flex-1 truncate">فشل الحفظ — {typeof syncError === 'string' ? syncError : 'تحقق من الاتصال'}</span>
          </div>
        )}

        {/* Row 2: tabs */}
        <div className="flex items-end gap-0 px-5 border-t border-ink-800/50">
          {TABS.map((tab, i) => {
            const isActive = i === activeTab;
            const isDone   = tabDone(tab);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(i)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm transition-all font-arabic whitespace-nowrap
                  ${isActive ? 'text-sand-300' : isDone ? 'text-emerald-600 hover:text-emerald-500' : 'text-ink-400 hover:text-ink-400'}`}
              >
                {isActive && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-sand-500 rounded-t" />}
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs border transition-colors
                  ${isActive ? 'border-sand-700 bg-sand-900/60 text-sand-400'
                    : isDone  ? 'border-emerald-700 bg-emerald-900/20 text-emerald-500'
                    :           'border-ink-700 text-ink-400'}`}
                >
                  {isDone && !isActive ? '✓' : tab.ar}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
          <div className="flex-1" />
          <span className="text-xs text-ink-500 font-mono pb-2.5 pr-1">
            {lessonIndex + 1}/{unitLessons.length}
          </span>
        </div>
      </header>

      {/* Approved warning */}
      {lesson.atlasStatus === 'approved' && (
        <div className="max-w-4xl mx-auto w-full px-5 pt-4">
          <div className="px-4 py-3 bg-amber-900/10 border border-amber-800/30 rounded-xl flex items-start gap-3">
            <span className="text-amber-500 text-sm mt-0.5 shrink-0">⚠</span>
            <p className="text-sm text-amber-400/90 font-arabic leading-relaxed">
              هذا الدرس <strong>معتمد</strong>. أي تعديل سيُعيده إلى حالة المسودة.
            </p>
          </div>
        </div>
      )}

      {/* ── Step canvas ─────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-5 py-8">
        {activeTab === 0 && (
          <StepMeta
            lesson={lesson} unit={unit} unitLessons={unitLessons} lessonIndex={lessonIndex}
            checklist={checklist} completedChecks={completedChecks} statusCfg={statusCfg}
            lessonSections={lessonSections} lessonBlocks={lessonBlocks}
            updateLesson={updateLesson} patchMeta={patchMeta}
            versionLabel={versionLabel} onVersionLabelChange={setVersionLabel}
            onNext={() => setActiveTab(1)}
          />
        )}
        {activeTab === 1 && (
          <StepBody
            lesson={lesson} lessonSections={lessonSections} lessonBlocks={lessonBlocks}
            subjectId={subjectId} onAddSection={handleAddSection} onAddNewPart={handleAddNewPart}
            onPrev={() => setActiveTab(0)} onNext={() => setActiveTab(2)}
          />
        )}
        {activeTab === 2 && (
          <StepQuestions
            lessonId={lessonId} unitId={unitId} subjectId={subjectId} lessonSections={lessonSections}
            lessonQuestions={lessonQuestions} onOpenGlobal={onOpenGlobal}
            onPrev={() => setActiveTab(1)} onNext={() => setActiveTab(3)}
          />
        )}
        {activeTab === 3 && (
          <StepFeed
            lessonId={lessonId} unitId={unitId} subjectId={subjectId} lessonConceptIds={lessonConceptIds}
            lessonFeedItems={lessonFeedItems} prevLesson={prevLesson} nextLesson={nextLesson}
            units={units} onOpenGlobal={onOpenGlobal} onPrev={() => setActiveTab(2)}
            onNavigateLesson={onNavigateLesson} onBack={onBack}
          />
        )}
        {activeTab === 4 && (
          <StepVariations
            lesson={lesson}
            variations={variations}
            onOpenLinkModal={() => setShowLinkVariation(true)}
            onUnlink={handleUnlinkVariation}
            onPrev={() => setActiveTab(3)}
          />
        )}
      </div>

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
    </div>
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
        <CardHeader icon="◈" title="المعلومات الأساسية" hint="تظهر للطالب قبل دخول الدرس" />
        <div className="p-5 space-y-4">
          <Field label="عنوان الدرس" required>
            <input type="text" value={lesson.title}
              onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
              className={FIELD} placeholder="أدخل عنوان الدرس…" />
            {lesson.title && SCAFFOLD_TITLE_RE.test(lesson.title.trim()) && (
              <p className="text-sm text-amber-600 font-arabic mt-1.5">⚠ هذا عنوان تلقائي — أدخل عنواناً حقيقياً</p>
            )}
          </Field>
          <Field label="ملخص الدرس">
            <textarea value={lesson.summary || ''}
              onChange={(e) => updateLesson(lesson.id, { summary: e.target.value })}
              className={`${FIELD} resize-y min-h-[88px]`}
              placeholder="ملخص قصير يصف محتوى الدرس — يظهر في قائمة الدروس…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
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
        <CardHeader icon="✦" title="التحفيز والتوجيه" hint="اختياري — يُشاهده الطالب قبل بدء الدرس" />
        <div className="p-5 space-y-4">
          <Field label="السؤال التحفيزي" hint="يستثير فضول الطالب قبل البدء">
            <textarea value={lesson.metadata?.hook || ''}
              onChange={(e) => patchMeta({ hook: e.target.value || null })}
              className={`${FIELD} resize-y min-h-[68px]`}
              placeholder="هل تساءلت كيف يحدد الملاحون موقعهم؟…" />
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
        <CardHeader icon="⊞" title="تجميع الدروس" hint="اختياري — يُنظِّم الدروس في مجموعات داخل الوحدة" />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <p className="text-xs text-amber-600 font-arabic">⚠ معرّف المجموعة موجود دون اسم — أضف الاسم حتى يظهر في التطبيق</p>
          )}
          {(!lesson.groupId && lesson.groupTitle) && (
            <p className="text-xs text-amber-600 font-arabic">⚠ اسم المجموعة موجود دون معرّف — أضف المعرّف لربط الدروس معاً</p>
          )}
          {lesson.groupId && lesson.groupTitle && (
            <p className="text-xs text-emerald-700 font-arabic">✓ مجموعة محددة — ستظهر الدروس ذات المعرّف نفسه تحت عنوان واحد</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader icon="◎" title="اكتمال الدرس" />
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1 bg-ink-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(completedChecks / 6) * 100}%` }} />
            </div>
            <span className="text-sm font-mono text-ink-500">{completedChecks}/6</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {checklist.map((item) => (
              <div key={item.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-arabic
                ${item.done ? 'bg-emerald-900/15 border-emerald-800/30 text-emerald-500' : 'bg-ink-800/15 border-ink-800/60 text-ink-400'}`}>
                <span className={item.done ? 'text-emerald-500' : 'text-ink-500'}>{item.done ? '✓' : '○'}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Version label — attaches a short note to the next save/submit */}
          <div className="mt-4 pt-4 border-t border-ink-800/50">
            <label className="text-sm text-ink-400 font-arabic block mb-1.5">
              وسم الإصدار
              <span className="text-ink-500 mr-1">(اختياري — يظهر في سجل التعديلات)</span>
            </label>
            <input
              type="text"
              value={versionLabel}
              onChange={(e) => onVersionLabelChange(e.target.value.slice(0, 80))}
              placeholder="مثال: مراجعة بعد الفيدباك، تصحيح أمثلة…"
              className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-sm font-arabic placeholder-ink-700 focus:outline-none focus:border-sand-700 transition-colors"
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

// ─── Step 2: Body ─────────────────────────────────────────────────────────────
function StepBody({ lesson, lessonSections, lessonBlocks, subjectId, onAddSection, onAddNewPart, onPrev, onNext }) {
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
          <span className="mr-auto text-sm text-ink-500 font-arabic px-2 py-0.5 bg-ink-800/40 rounded-full border border-ink-800">
            {partKeys.length} أجزاء
          </span>
        )}
      </div>

      {lessonSections.length === 0 && (
        <div
          className="py-20 text-center border-2 border-dashed border-ink-800/60 rounded-2xl cursor-pointer group hover:border-sand-800/40 hover:bg-sand-900/5 transition-all"
          onClick={onAddNewPart}
        >
          <p className="text-3xl mb-3 opacity-40">📄</p>
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
                  <span className="text-sm font-mono text-ink-500 tracking-[0.2em] uppercase">part</span>
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
            <SectionEditor key={section.id} section={section} maxPart={maxPart} subjectId={subjectId} />
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
  const checkpoints = lessonQuestions.filter(q => q.isCheckpoint);
  const standalone  = lessonQuestions.filter(q => !q.isCheckpoint);
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="pb-1">
        <h2 className="text-base font-semibold text-sand-200 font-arabic">الأسئلة</h2>
        <p className="text-sm text-ink-400 font-arabic mt-0.5">نقاط تحقق وأسئلة تدريب مرتبطة بهذا الدرس</p>
      </div>
      <Card>
        <CardHeader icon="◎" title="نظرة عامة" />
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="نقاط تحقق" sublabel="مدمجة في الدرس" value={checkpoints.length} />
            <StatCard label="أسئلة تدريب" sublabel="مستقلة" value={standalone.length} />
          </div>
          {lessonQuestions.length === 0 && (
            <div className="mt-4 py-6 text-center border border-dashed border-ink-800/50 rounded-xl">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-sm text-ink-400 font-arabic">لا توجد أسئلة مرتبطة بهذا الدرس</p>
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
        <CardHeader icon="▣" title="نظرة عامة" />
        <div className="p-5">
          {lessonFeedItems.length === 0 ? (
            <div className="py-6 text-center border border-dashed border-ink-800/50 rounded-xl">
              <p className="text-2xl mb-2">📱</p>
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
          <span className="text-ink-400 text-lg">↑</span>
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
                {cfg.icon} {cfg.label}
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
          <p className="text-3xl mb-3 opacity-30">🔗</p>
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
                    {cfg.icon}
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
                  className="opacity-0 group-hover:opacity-100 transition-opacity
                    text-ink-500 hover:text-red-500 text-sm px-2 py-1 rounded
                    hover:bg-red-900/20 font-arabic"
                  title="إلغاء الربط"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Type legend */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        {Object.entries(VARIATION_CONFIG).map(([type, cfg]) => (
          <div
            key={type}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: cfg.border, background: cfg.bg }}
          >
            <span style={{ color: cfg.color }}>{cfg.icon}</span>
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
        ))}
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

function StatCard({ label, sublabel, value }) {
  return (
    <div className="bg-ink-800/30 rounded-xl border border-ink-800/70 p-4 text-center">
      <p className="text-2xl font-mono text-sand-400 leading-none">{value}</p>
      <p className="text-sm text-ink-400 font-arabic mt-1.5">{label}</p>
      <p className="text-sm text-ink-500 font-arabic mt-0.5">{sublabel}</p>
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
          <button onClick={() => removeItem(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-500 hover:text-red-500 text-xs mt-2">✕</button>
        </div>
      ))}
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          className="flex-1 px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-sm font-arabic placeholder-ink-700 focus:outline-none focus:border-sand-700 transition-colors"
          placeholder="ستتعلم في هذا الدرس… ثم اضغط Enter" />
        <button onClick={addItem} className="px-3 py-2 bg-ink-800 border border-ink-700 rounded-lg text-ink-400 hover:text-sand-400 text-sm transition-colors">+</button>
      </div>
    </div>
  );
}
