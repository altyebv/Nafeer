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

const SCAFFOLD_TITLE_RE = /^الدرس\s+\d+$/;

const FIELD =
  'w-full px-4 py-3 bg-ink-950 border border-ink-800 rounded-xl text-sand-200 ' +
  'focus:ring-1 focus:ring-sand-600 focus:border-sand-700 focus:outline-none ' +
  'font-arabic placeholder-ink-700 text-sm leading-relaxed transition-colors ' +
  'hover:border-ink-700';

const TABS = [
  { id: 'meta',      ar: '١', label: 'البيانات'  },
  { id: 'body',      ar: '٢', label: 'المحتوى'   },
  { id: 'questions', ar: '٣', label: 'الأسئلة'   },
  { id: 'feed',      ar: '٤', label: 'التغذية'   },
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
  const [showNotes,     setShowNotes]     = useState(false);
  const [notesCount,    setNotesCount]    = useState(0);
  // Attribution data fetched from the lesson GET response (populated server-side)
  const [attribution,   setAttribution]   = useState(null);

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
            className="flex items-center gap-1.5 text-xs text-ink-600 hover:text-sand-400 transition-colors font-arabic shrink-0 group"
          >
            <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
            <span className="hidden sm:inline">{unit?.title ?? 'الدروس'}</span>
          </button>

          <span className="text-ink-800 text-xs">›</span>

          <h1 className="flex-1 text-sm font-semibold text-sand-200 font-arabic truncate min-w-0">
            {lesson.title}
          </h1>

          {syncDot && <span className="shrink-0 flex items-center">{syncDot}</span>}
          {lesson.atlasStatus && <StatusBadge status={lesson.atlasStatus} />}

          {/* Progress ring */}
          <div className="relative w-6 h-6 shrink-0">
            <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-800" />
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
            onClick={() => setShowNotes(true)}
            className="relative flex items-center gap-1.5 px-3 h-7 text-ink-400 hover:text-sand-300 text-xs font-semibold rounded-lg border border-ink-700 bg-ink-800/60 hover:bg-ink-700/60 font-arabic transition-colors"
          >
            <span className="text-xs leading-none">📝</span>
            <span className="hidden sm:inline">ملاحظات</span>
            {notesCount > 0 && (
              <span className="absolute -top-1.5 -left-1 w-4 h-4 bg-sand-700 text-ink-950 text-[9px] font-bold rounded-full flex items-center justify-center font-mono leading-none">
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
          <div className="flex items-center gap-2 px-5 py-1.5 bg-red-950/50 border-t border-red-900/30 text-red-400 text-xs font-arabic">
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
                className={`relative flex items-center gap-2 px-4 py-2.5 text-xs transition-all font-arabic whitespace-nowrap
                  ${isActive ? 'text-sand-300' : isDone ? 'text-emerald-600 hover:text-emerald-500' : 'text-ink-600 hover:text-ink-400'}`}
              >
                {isActive && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-sand-500 rounded-t" />}
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border transition-colors
                  ${isActive ? 'border-sand-700 bg-sand-900/60 text-sand-400'
                    : isDone  ? 'border-emerald-700 bg-emerald-900/20 text-emerald-500'
                    :           'border-ink-700 text-ink-600'}`}
                >
                  {isDone && !isActive ? '✓' : tab.ar}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
          <div className="flex-1" />
          <span className="text-[10px] text-ink-700 font-mono pb-2.5 pr-1">
            {lessonIndex + 1}/{unitLessons.length}
          </span>
        </div>
      </header>

      {/* Approved warning */}
      {lesson.atlasStatus === 'approved' && (
        <div className="max-w-4xl mx-auto w-full px-5 pt-4">
          <div className="px-4 py-3 bg-amber-900/10 border border-amber-800/30 rounded-xl flex items-start gap-3">
            <span className="text-amber-500 text-sm mt-0.5 shrink-0">⚠</span>
            <p className="text-xs text-amber-400/90 font-arabic leading-relaxed">
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
            lessonId={lessonId} unitId={unitId} lessonSections={lessonSections}
            lessonQuestions={lessonQuestions} onOpenGlobal={onOpenGlobal}
            onPrev={() => setActiveTab(1)} onNext={() => setActiveTab(3)}
          />
        )}
        {activeTab === 3 && (
          <StepFeed
            lessonId={lessonId} unitId={unitId} lessonConceptIds={lessonConceptIds}
            lessonFeedItems={lessonFeedItems} prevLesson={prevLesson} nextLesson={nextLesson}
            units={units} onOpenGlobal={onOpenGlobal} onPrev={() => setActiveTab(2)}
            onNavigateLesson={onNavigateLesson} onBack={onBack}
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
    </div>
  );
}

// ─── Step 1: Meta ─────────────────────────────────────────────────────────────
function StepMeta({ lesson, unit, unitLessons, lessonIndex, checklist, completedChecks, statusCfg, lessonSections, lessonBlocks, updateLesson, patchMeta, onNext }) {
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3 pb-1">
        <div>
          <h2 className="text-base font-semibold text-sand-200 font-arabic">بيانات الدرس</h2>
          <p className="text-xs text-ink-600 font-arabic mt-0.5">
            {unit?.title} · درس {lessonIndex + 1} من {unitLessons.length}
          </p>
        </div>
        <div className="flex-1" />
        <span className={`text-[11px] font-arabic px-2.5 py-1 rounded-full border ${statusCfg.badge}`}>
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
              <p className="text-[11px] text-amber-600 font-arabic mt-1.5">⚠ هذا عنوان تلقائي — أدخل عنواناً حقيقياً</p>
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
                <span className="text-xs text-ink-600 font-arabic">دقيقة</span>
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
        <CardHeader icon="◎" title="اكتمال الدرس" />
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1 bg-ink-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(completedChecks / 6) * 100}%` }} />
            </div>
            <span className="text-xs font-mono text-ink-500">{completedChecks}/6</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {checklist.map((item) => (
              <div key={item.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-arabic
                ${item.done ? 'bg-emerald-900/15 border-emerald-800/30 text-emerald-500' : 'bg-ink-800/15 border-ink-800/60 text-ink-600'}`}>
                <span className={item.done ? 'text-emerald-500' : 'text-ink-700'}>{item.done ? '✓' : '○'}</span>
                <span>{item.label}</span>
              </div>
            ))}
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
        <span className="text-xs text-ink-600 font-arabic">
          {lessonSections.length} {lessonSections.length === 1 ? 'قسم' : 'أقسام'}
          {lessonBlocks.length > 0 && ` · ${lessonBlocks.length} عنصر`}
        </span>
        {isMultiPart && (
          <span className="mr-auto text-xs text-ink-700 font-arabic px-2 py-0.5 bg-ink-800/40 rounded-full border border-ink-800">
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
          <p className="text-xs text-ink-700 font-arabic group-hover:text-sand-700 transition-colors">اضغط لإضافة أول قسم</p>
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
                  <span className="text-[9px] font-mono text-ink-700 tracking-[0.2em] uppercase">part</span>
                  <span className="text-sm font-semibold text-sand-600 font-arabic">
                    الجزء {PART_NAMES_AR[pi] || (pi + 1)}
                  </span>
                  <span className="text-[10px] text-ink-700 font-arabic">
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
            className="w-full py-3 border border-dashed border-ink-800/60 rounded-xl text-ink-700 hover:border-sand-800/50 hover:text-sand-600 hover:bg-sand-900/5 transition-all font-arabic text-xs flex items-center justify-center gap-2 group"
          >
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] group-hover:bg-sand-900/20 transition-colors">+</span>
            <span>إضافة قسم{isMultiPart ? ` في الجزء ${PART_NAMES_AR[pi] || (pi + 1)}` : ''}</span>
          </button>
        </div>
      ))}

      {lessonSections.length > 0 && (
        <button
          onClick={onAddNewPart}
          className="w-full mt-4 py-5 border-2 border-dashed border-ink-800/40 rounded-2xl text-ink-600 hover:border-sand-800/30 hover:text-sand-600 hover:bg-sand-900/5 transition-all font-arabic flex items-center justify-center gap-3 group"
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
function StepQuestions({ lessonId, unitId, lessonSections, lessonQuestions, onOpenGlobal, onPrev, onNext }) {
  const checkpoints = lessonQuestions.filter(q => q.isCheckpoint);
  const standalone  = lessonQuestions.filter(q => !q.isCheckpoint);
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="pb-1">
        <h2 className="text-base font-semibold text-sand-200 font-arabic">الأسئلة</h2>
        <p className="text-xs text-ink-600 font-arabic mt-0.5">نقاط تحقق وأسئلة تدريب مرتبطة بهذا الدرس</p>
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
              <p className="text-sm text-ink-600 font-arabic">لا توجد أسئلة مرتبطة بهذا الدرس</p>
            </div>
          )}
        </div>
      </Card>
      <LessonQuestionsPanel lessonId={lessonId} unitId={unitId} onOpenGlobal={onOpenGlobal} />
      <StepFooter onPrev={onPrev} onNext={onNext} prevLabel="→ المحتوى" nextLabel="التغذية ←" />
    </div>
  );
}

// ─── Step 4: Feed ─────────────────────────────────────────────────────────────
function StepFeed({ lessonId, unitId, lessonConceptIds, lessonFeedItems, prevLesson, nextLesson, units, onOpenGlobal, onPrev, onNavigateLesson, onBack }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="pb-1">
        <h2 className="text-base font-semibold text-sand-200 font-arabic">بطاقات التغذية</h2>
        <p className="text-xs text-ink-600 font-arabic mt-0.5">بطاقات المراجعة السريعة في تطبيق بشير</p>
      </div>
      <Card>
        <CardHeader icon="▣" title="نظرة عامة" />
        <div className="p-5">
          {lessonFeedItems.length === 0 ? (
            <div className="py-6 text-center border border-dashed border-ink-800/50 rounded-xl">
              <p className="text-2xl mb-2">📱</p>
              <p className="text-sm text-ink-600 font-arabic">لا توجد بطاقات تغذية لهذا الدرس</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono text-sand-400">{lessonFeedItems.length}</span>
              <span className="text-xs text-ink-600 font-arabic">بطاقة</span>
            </div>
          )}
        </div>
      </Card>
      <LessonFeedPanel lessonId={lessonId} unitId={unitId} lessonConceptIds={lessonConceptIds} onOpenGlobal={onOpenGlobal} />
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

// ─── Primitives ───────────────────────────────────────────────────────────────
function Card({ children }) {
  return <div className="bg-ink-900/50 rounded-2xl border border-ink-800/80 overflow-hidden">{children}</div>;
}

function CardHeader({ icon, title, hint }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-ink-800/60 bg-ink-800/15">
      <span className="text-sand-700 text-xs">{icon}</span>
      <h3 className="text-sm font-semibold text-sand-300 font-arabic">{title}</h3>
      {hint && <span className="text-[11px] text-ink-700 font-arabic mr-auto">{hint}</span>}
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-xs font-medium text-ink-500 font-arabic">
          {label}{required && <span className="text-red-600 mr-0.5">*</span>}
        </label>
        {hint && <span className="text-[10px] text-ink-700 font-arabic">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, val }) {
  return (
    <div className="text-center">
      <p className="text-lg font-mono text-ink-400">{val}</p>
      <p className="text-[10px] text-ink-700 font-arabic">{label}</p>
    </div>
  );
}

function StatCard({ label, sublabel, value }) {
  return (
    <div className="bg-ink-800/30 rounded-xl border border-ink-800/70 p-4 text-center">
      <p className="text-2xl font-mono text-sand-400 leading-none">{value}</p>
      <p className="text-xs text-ink-400 font-arabic mt-1.5">{label}</p>
      <p className="text-[10px] text-ink-700 font-arabic mt-0.5">{sublabel}</p>
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
      <button onClick={onBack} className="text-xs text-ink-600 hover:text-ink-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-ink-800 font-arabic">
        قائمة الدروس
      </button>
      {prevLesson && (
        <button onClick={() => onNavigateLesson?.(prevLesson.id, prevLesson._unitId)}
          className="flex items-center gap-1.5 text-ink-600 hover:text-sand-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-ink-900 text-xs font-arabic">
          <span className="truncate max-w-[100px]">{prevLesson.title}</span>
          <span>→</span>
        </button>
      )}
      {nextLesson && (
        <button onClick={() => onNavigateLesson?.(nextLesson.id, nextLesson._unitId)}
          className="flex items-center gap-1.5 text-ink-600 hover:text-sand-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-ink-900 text-xs font-arabic">
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
          <span className="text-sand-700 text-xs mt-2.5 shrink-0">•</span>
          <span className="flex-1 text-sm text-ink-200 font-arabic py-1.5 leading-relaxed">{item}</span>
          <button onClick={() => removeItem(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-700 hover:text-red-500 text-xs mt-2">✕</button>
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