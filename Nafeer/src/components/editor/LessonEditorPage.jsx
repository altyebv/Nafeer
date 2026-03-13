'use client';
import { useState } from 'react';
import { useDataStore }     from '@/store/dataStore';
import { useAtlasSync }     from '@/hooks/useAtlasSync';
import { useCoverageData }  from '@/hooks/useCoverageData';
import { getLessonStatus, STATUS_CONFIG } from '@/lib/LessonStatus';
import SectionEditor          from '@/components/editor/SectionEditor';
import LessonQuestionsPanel   from '@/components/editor/LessonQuestionsPanel';
import LessonFeedPanel        from '@/components/editor/LessonFeedPanel';
import StatusBadge            from '@/components/editor/StatusBadge';
import CoveragePanel          from '@/components/editor/CoveragePanel';

// ─── Constants ────────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-4 py-3 bg-ink-950 border border-ink-700 rounded-xl text-sand-200 ' +
  'focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none ' +
  'font-arabic placeholder-ink-600 text-sm leading-relaxed transition-colors';

const SCAFFOLD_TITLE_RE = /^الدرس\s+\d+$/;

const STEPS = [
  { id: 'meta',      num: '١', label: 'البيانات', sublabel: 'عنوان وملخص',   checkKeys: ['عنوان', 'ملخص'] },
  { id: 'body',      num: '٢', label: 'المحتوى',  sublabel: 'أقسام وعناصر',  checkKeys: ['أقسام', 'محتوى'] },
  { id: 'questions', num: '٣', label: 'الأسئلة',  sublabel: 'نقاط التحقق',   checkKeys: ['أسئلة'] },
  { id: 'feed',      num: '٤', label: 'التغذية',  sublabel: 'بطاقات المراجعة', checkKeys: ['تغذية'] },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function LessonEditorPage({
  lessonId, unitId, subjectId,
  onBack, onBackToOverview, onNavigateLesson, onOpenGlobal,
}) {
  const {
    units, lessons, sections, blocks, questions, feedItems,
    updateLesson, addSection,
  } = useDataStore();
  const { syncAll, submitForReview, isSyncing } = useAtlasSync();
  const { coverageMap, loading: coverageLoading } = useCoverageData(subjectId);

  const [activeStep,    setActiveStep]    = useState(0);
  const [saveSuccess,   setSaveSuccess]   = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // ── Derived data ──────────────────────────────────────────────────────────
  const lesson         = lessons.find((l) => l.id === lessonId);
  const unit           = units.find((u) => u.id === unitId);
  const lessonSections = sections.filter((s) => s.lessonId === lessonId).sort((a, b) => a.order - b.order);
  const sectionIds     = lessonSections.map((s) => s.id);
  const lessonBlocks   = blocks.filter((b) => sectionIds.includes(b.sectionId));
  const lessonConceptIds = [...new Set(lessonSections.flatMap((s) => s.conceptIds || []))];
  const lessonQuestions  = questions.filter((q) => q.lessonId === lessonId);
  const lessonFeedItems  = feedItems.filter((f) => f.lessonId === lessonId);

  const status    = lesson ? getLessonStatus(lessonId, sections, blocks, lesson) : 'empty';
  const statusCfg = STATUS_CONFIG[status];

  // ── Cross-unit navigation ─────────────────────────────────────────────────
  const sortedUnits = [...units].sort((a, b) => a.order - b.order);
  const allLessons  = sortedUnits.flatMap((u) =>
    lessons.filter((l) => l.unitId === u.id).sort((a, b) => a.order - b.order).map((l) => ({ ...l, _unitId: u.id }))
  );
  const globalIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson  = globalIndex > 0 ? allLessons[globalIndex - 1] : null;
  const nextLesson  = globalIndex < allLessons.length - 1 ? allLessons[globalIndex + 1] : null;

  const unitLessons = lessons.filter((l) => l.unitId === unitId).sort((a, b) => a.order - b.order);
  const lessonIndex = unitLessons.findIndex((l) => l.id === lessonId);

  // ── Checklist ─────────────────────────────────────────────────────────────
  const checklist = lesson ? [
    { label: 'عنوان',  done: !!lesson.title?.trim() && !SCAFFOLD_TITLE_RE.test(lesson.title.trim()) },
    { label: 'ملخص',  done: !!lesson.summary?.trim()   },
    { label: 'أقسام', done: lessonSections.length > 0  },
    { label: 'محتوى', done: lessonBlocks.length > 0    },
    { label: 'أسئلة', done: lessonQuestions.length > 0 },
    { label: 'تغذية', done: lessonFeedItems.length > 0 },
  ] : [];
  const completedChecks = checklist.filter((c) => c.done).length;

  const stepDone = (step) =>
    step.checkKeys.every((key) => checklist.find((c) => c.label === key)?.done);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!subjectId) return;
    try {
      await syncAll(lessonId, subjectId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch { /* surfaced via SyncBar */ }
  };

  const handleSubmitForReview = async () => {
    if (!subjectId) return;
    try {
      await syncAll(lessonId, subjectId);
      await submitForReview(lessonId, 'lesson');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch { /* surfaced via SyncBar */ }
  };

  const handleAddSection = () => {
    const maxOrder = lessonSections.reduce((m, s) => Math.max(m, s.order), 0);
    addSection({ lessonId, title: `قسم ${lessonSections.length + 1}`, order: maxOrder + 1, conceptIds: [], learningType: 'UNDERSTANDING' });
  };

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!lesson) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">📝</div>
        <h2 className="text-lg font-medium text-ink-400 mb-4 font-arabic">الدرس غير موجود</h2>
        <button onClick={onBack} className="px-6 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-arabic">العودة</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-ink-950/95 backdrop-blur-sm border-b border-ink-800">

        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between gap-4 px-1 pt-4 pb-3">
          <nav className="flex items-center gap-2 text-xs text-ink-600 font-arabic min-w-0">
            <button onClick={onBackToOverview} className="hover:text-sand-400 transition-colors shrink-0">الدروس</button>
            <span className="text-ink-700">›</span>
            <button onClick={onBack} className="hover:text-sand-400 transition-colors truncate max-w-[120px]">
              {unit ? `${unit.order}. ${unit.title}` : 'الوحدة'}
            </button>
            <span className="text-ink-700">›</span>
            <span className="text-ink-300 truncate max-w-[150px]">{lesson.title}</span>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {lesson.atlasStatus && <StatusBadge status={lesson.atlasStatus} />}
            {(!lesson.atlasStatus || lesson.atlasStatus === 'draft') && (
              <button
                onClick={handleSubmitForReview}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/40 hover:bg-amber-800/50 disabled:opacity-50 text-amber-400 text-xs font-semibold rounded-lg transition-colors border border-amber-700/50 font-arabic"
              >
                {reviewSuccess ? '✓ أُرسل' : '⇪ للمراجعة'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-1.5 bg-sand-700 hover:bg-sand-600 disabled:opacity-50 text-ink-950 text-sm font-semibold rounded-lg transition-colors font-arabic"
            >
              {isSyncing
                ? <><span className="inline-block w-3 h-3 border-2 border-ink-800 border-t-transparent rounded-full animate-spin" />حفظ…</>
                : saveSuccess ? '✓ تم الحفظ' : '↑ حفظ'}
            </button>
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex items-stretch border-t border-ink-800">
          {STEPS.map((step, i) => {
            const isActive = i === activeStep;
            const isDone   = stepDone(step);
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(i)}
                className={`flex-1 flex items-center gap-2.5 px-4 py-3 text-right transition-all relative ${
                  isActive ? 'bg-sand-900/30 text-sand-300' : 'text-ink-500 hover:bg-ink-900/50 hover:text-ink-300'
                }`}
              >
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sand-500 rounded-t" />}
                <span className={`w-6 h-6 rounded-full text-xs font-mono shrink-0 flex items-center justify-center border transition-colors ${
                  isActive ? 'border-sand-500 bg-sand-900/50 text-sand-400'
                  : isDone  ? 'border-emerald-700 bg-emerald-900/30 text-emerald-500'
                  :           'border-ink-700 text-ink-600'
                }`}>
                  {isDone && !isActive ? '✓' : step.num}
                </span>
                <span className="hidden sm:flex flex-col items-start leading-none gap-0.5">
                  <span className={`text-xs font-semibold font-arabic ${isActive ? 'text-sand-300' : isDone ? 'text-emerald-600' : 'text-ink-500'}`}>
                    {step.label}
                  </span>
                  <span className={`text-[10px] font-arabic ${isActive ? 'text-sand-600' : 'text-ink-700'}`}>
                    {step.sublabel}
                  </span>
                </span>
              </button>
            );
          })}

          {/* Overall progress indicator */}
          <div className="flex items-center px-4 border-r border-ink-800">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 relative flex items-center justify-center">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ink-800" />
                  <circle
                    cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className="text-emerald-600"
                    strokeDasharray={`${(completedChecks / 6) * 75.4} 75.4`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[9px] font-mono text-ink-400">{completedChecks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Approved warning ─────────────────────────────────────────────────── */}
      {lesson.atlasStatus === 'approved' && (
        <div className="mt-4 px-4 py-3 bg-amber-900/20 border border-amber-700/40 rounded-xl flex items-start gap-3">
          <span className="text-amber-500 text-sm mt-0.5 shrink-0">⚠</span>
          <p className="text-xs text-amber-400 font-arabic leading-relaxed">
            هذا الدرس <strong>معتمد</strong>. أي تعديل سيُعيده تلقائياً إلى حالة المسودة ويتطلب مراجعة جديدة.
          </p>
        </div>
      )}


      {/* ─── Coverage panel ─────────────────────────────────────────────────── */}
      {lesson?.contentId && (
        <div className="mt-5">
          <CoveragePanel
            coverage={coverageMap[lesson.contentId] ?? null}
            loading={coverageLoading}
          />
        </div>
      )}
      {/* ── Step canvas ──────────────────────────────────────────────────────── */}
      <div className="mt-6">

        {activeStep === 0 && (
          <StepMeta
            lesson={lesson}
            unit={unit}
            unitLessons={unitLessons}
            lessonIndex={lessonIndex}
            globalIndex={globalIndex}
            allLessons={allLessons}
            checklist={checklist}
            completedChecks={completedChecks}
            statusCfg={statusCfg}
            lessonSections={lessonSections}
            lessonBlocks={lessonBlocks}
            updateLesson={updateLesson}
            inputClass={inputClass}
            onNext={() => setActiveStep(1)}
          />
        )}

        {activeStep === 1 && (
          <StepBody
            lessonSections={lessonSections}
            lessonBlocks={lessonBlocks}
            onAddSection={handleAddSection}
            onPrev={() => setActiveStep(0)}
            onNext={() => setActiveStep(2)}
          />
        )}

        {activeStep === 2 && (
          <StepQuestions
            lessonId={lessonId}
            unitId={unitId}
            lessonQuestions={lessonQuestions}
            onOpenGlobal={onOpenGlobal}
            onPrev={() => setActiveStep(1)}
            onNext={() => setActiveStep(3)}
          />
        )}

        {activeStep === 3 && (
          <StepFeed
            lessonId={lessonId}
            unitId={unitId}
            lessonConceptIds={lessonConceptIds}
            lessonFeedItems={lessonFeedItems}
            onOpenGlobal={onOpenGlobal}
            onPrev={() => setActiveStep(2)}
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            units={units}
            onNavigateLesson={onNavigateLesson}
            onBack={onBack}
          />
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Metadata ─────────────────────────────────────────────────────────

function StepMeta({
  lesson, unit, unitLessons, lessonIndex, globalIndex, allLessons,
  checklist, completedChecks, statusCfg, lessonSections, lessonBlocks,
  updateLesson, inputClass, onNext,
}) {
  return (
    <div className="space-y-5">

      {/* Position label */}
      <div className="flex items-center gap-3">
        <p className="text-xs font-mono text-ink-600">
          درس {lessonIndex + 1} من {unitLessons.length}
          <span className="text-ink-700 mx-1.5">·</span>
          {globalIndex + 1} / {allLessons.length} إجمالاً
        </p>
        <span className={`inline-flex items-center gap-1 text-xs font-arabic px-2 py-0.5 rounded-full border ${statusCfg.badge}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Main fields */}
      <div className="bg-ink-900 rounded-2xl border border-ink-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-800 flex items-center gap-2.5">
          <span className="text-sand-600 text-sm">◈</span>
          <h2 className="text-sm font-semibold text-sand-300 font-arabic">بيانات الدرس</h2>
          <span className="text-xs text-ink-600 font-arabic mr-auto">تظهر للطالب قبل دخول الدرس</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-2 font-arabic">
              عنوان الدرس <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={lesson.title}
              onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
              className={inputClass}
              placeholder="أدخل عنوان الدرس…"
            />
            {lesson.title && SCAFFOLD_TITLE_RE.test(lesson.title.trim()) && (
              <p className="text-[11px] text-amber-600 font-arabic mt-1.5">
                ⚠ هذا عنوان تلقائي — من فضلك أدخل عنواناً حقيقياً
              </p>
            )}
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-2 font-arabic">ملخص الدرس</label>
            <textarea
              value={lesson.summary || ''}
              onChange={(e) => updateLesson(lesson.id, { summary: e.target.value })}
              className={`${inputClass} resize-y min-h-[96px]`}
              placeholder="ملخص قصير يصف محتوى الدرس — يظهر للطالب في قائمة الدروس…"
            />
          </div>

          {/* Time + stats */}
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-2 font-arabic">الوقت المقدر</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={lesson.estimatedMinutes || 15}
                  onChange={(e) => updateLesson(lesson.id, { estimatedMinutes: parseInt(e.target.value) || 15 })}
                  className="w-20 px-3 py-2.5 bg-ink-950 border border-ink-700 rounded-xl text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none text-center"
                  min="1"
                />
                <span className="text-xs text-ink-500 font-arabic">دقيقة</span>
              </div>
            </div>
            <div className="flex-1" />
            <div className="text-left space-y-0.5">
              <p className="text-xs text-ink-600 font-mono">{lessonSections.length} أقسام</p>
              <p className="text-xs text-ink-600 font-mono">{lessonBlocks.length} عناصر</p>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-ink-900/50 rounded-2xl border border-ink-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-ink-500 font-arabic">اكتمال الدرس</h3>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-28 bg-ink-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedChecks / 6) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-ink-400">{completedChecks}/6</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {checklist.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                item.done
                  ? 'bg-emerald-900/20 border-emerald-800/40 text-emerald-500'
                  : 'bg-ink-800/30 border-ink-800 text-ink-600'
              }`}
            >
              <span className="text-xs">{item.done ? '✓' : '○'}</span>
              <span className="text-xs font-arabic">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <StepNav onNext={onNext} nextLabel="التالي: المحتوى ←" />
    </div>
  );
}

// ─── Step 2: Body / Content ───────────────────────────────────────────────────

function StepBody({ lessonSections, lessonBlocks, onAddSection, onPrev, onNext }) {
  return (
    <div className="space-y-4">
      <div className="bg-ink-900 rounded-2xl border border-ink-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-800 flex items-center gap-2.5">
          <span className="text-sand-600 text-sm">▤</span>
          <h2 className="text-sm font-semibold text-sand-300 font-arabic">محتوى الدرس</h2>
          <div className="mr-auto flex items-center gap-3 text-xs font-mono text-ink-600">
            <span>{lessonSections.length} أقسام</span>
            <span>·</span>
            <span>{lessonBlocks.length} عناصر</span>
          </div>
        </div>

        {lessonSections.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-2xl mb-2">📄</p>
            <p className="text-sm text-ink-500 font-arabic mb-1">لا توجد أقسام بعد</p>
            <p className="text-xs text-ink-700 font-arabic">كل درس مقسّم إلى أقسام، وكل قسم يحتوي على عناصر محتوى</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {lessonSections.map((section) => (
          <SectionEditor key={section.id} section={section} />
        ))}
      </div>

      <button
        onClick={onAddSection}
        className="w-full py-4 border-2 border-dashed border-ink-800 rounded-2xl text-ink-600 hover:border-sand-800 hover:text-sand-500 hover:bg-sand-900/10 transition-colors font-arabic flex items-center justify-center gap-2"
      >
        <span className="text-lg leading-none">+</span>
        <span className="text-sm">إضافة قسم جديد</span>
      </button>

      <StepNav onPrev={onPrev} onNext={onNext} prevLabel="→ البيانات" nextLabel="التالي: الأسئلة ←" />
    </div>
  );
}

// ─── Step 3: Questions ────────────────────────────────────────────────────────

function StepQuestions({ lessonId, unitId, lessonQuestions, onOpenGlobal, onPrev, onNext }) {
  return (
    <div className="space-y-4">
      <div className="bg-ink-900 rounded-2xl border border-ink-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-800 flex items-center gap-2.5">
          <span className="text-sand-600 text-sm">◎</span>
          <h2 className="text-sm font-semibold text-sand-300 font-arabic">نقاط التحقق</h2>
          <p className="text-xs text-ink-600 font-arabic mr-2">أسئلة تقيّم فهم الطالب للدرس</p>
          {lessonQuestions.length > 0 && (
            <span className="mr-auto text-xs font-mono px-2 py-0.5 rounded border bg-sand-900/40 text-sand-400 border-sand-700/40">
              {lessonQuestions.length}
            </span>
          )}
        </div>
        {lessonQuestions.length === 0 && (
          <div className="px-5 py-6 text-center">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-sm text-ink-500 font-arabic">لا توجد أسئلة مرتبطة بهذا الدرس بعد</p>
          </div>
        )}
      </div>

      {/* Reuse existing panel, which is collapsible — open by default here makes sense */}
      <LessonQuestionsPanel lessonId={lessonId} unitId={unitId} onOpenGlobal={onOpenGlobal} />

      <StepNav onPrev={onPrev} onNext={onNext} prevLabel="→ المحتوى" nextLabel="التالي: التغذية ←" />
    </div>
  );
}

// ─── Step 4: Feed Cards ───────────────────────────────────────────────────────

function StepFeed({
  lessonId, unitId, lessonConceptIds, lessonFeedItems,
  onOpenGlobal, onPrev,
  prevLesson, nextLesson, units, unitId: _unitId, onNavigateLesson, onBack,
}) {
  return (
    <div className="space-y-4">
      <div className="bg-ink-900 rounded-2xl border border-ink-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-800 flex items-center gap-2.5">
          <span className="text-sand-600 text-sm">▣</span>
          <h2 className="text-sm font-semibold text-sand-300 font-arabic">بطاقات التغذية</h2>
          <p className="text-xs text-ink-600 font-arabic mr-2">بطاقات المراجعة السريعة في تطبيق بشير</p>
          {lessonFeedItems.length > 0 && (
            <span className="mr-auto text-xs font-mono px-2 py-0.5 rounded border bg-sand-900/40 text-sand-400 border-sand-700/40">
              {lessonFeedItems.length}
            </span>
          )}
        </div>
        {lessonFeedItems.length === 0 && (
          <div className="px-5 py-6 text-center">
            <p className="text-2xl mb-2">📱</p>
            <p className="text-sm text-ink-500 font-arabic">لا توجد بطاقات تغذية لهذا الدرس بعد</p>
          </div>
        )}
      </div>

      <LessonFeedPanel
        lessonId={lessonId}
        unitId={unitId}
        lessonConceptIds={lessonConceptIds}
        onOpenGlobal={onOpenGlobal}
      />

      {/* Final step footer — prev + lesson navigator */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-ink-800">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-500 hover:text-sand-400 hover:bg-ink-900 border border-ink-800 hover:border-ink-700 rounded-xl transition-colors font-arabic"
        >
          → الأسئلة
        </button>
        <div className="flex-1" />
        <LessonNav
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          units={units}
          unitId={_unitId}
          onNavigateLesson={onNavigateLesson}
          onBack={onBack}
        />
      </div>
    </div>
  );
}

// ─── Shared: step navigation footer ──────────────────────────────────────────

function StepNav({ onPrev, onNext, prevLabel, nextLabel }) {
  return (
    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-ink-800">
      {onPrev && (
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-500 hover:text-sand-400 hover:bg-ink-900 border border-ink-800 hover:border-ink-700 rounded-xl transition-colors font-arabic"
        >
          {prevLabel}
        </button>
      )}
      <div className="flex-1" />
      {onNext && (
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-sand-700/80 hover:bg-sand-600 text-ink-950 text-sm font-semibold rounded-xl transition-colors font-arabic"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

// ─── Shared: lesson prev/next navigator ──────────────────────────────────────

function LessonNav({ prevLesson, nextLesson, units, unitId, onNavigateLesson, onBack }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onBack}
        className="text-xs text-ink-600 hover:text-ink-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-ink-800 font-arabic"
      >
        قائمة الدروس
      </button>

      {prevLesson && (() => {
        const crossUnit = prevLesson._unitId !== unitId;
        const prevUnit  = crossUnit ? units.find((u) => u.id === prevLesson._unitId) : null;
        return (
          <button
            onClick={() => onNavigateLesson?.(prevLesson.id, prevLesson._unitId)}
            className="flex flex-col items-end gap-0.5 text-ink-500 hover:text-sand-400 transition-colors group px-3 py-1.5 rounded-lg hover:bg-ink-900"
          >
            {crossUnit && <span className="text-[10px] font-mono text-ink-700 group-hover:text-ink-500">{prevUnit?.title} →</span>}
            <span className="flex items-center gap-1 text-xs font-arabic">
              <span className="truncate max-w-[100px]">{prevLesson.title}</span>
              <span>→</span>
            </span>
          </button>
        );
      })()}

      {nextLesson && (() => {
        const crossUnit = nextLesson._unitId !== unitId;
        const nextUnit  = crossUnit ? units.find((u) => u.id === nextLesson._unitId) : null;
        return (
          <button
            onClick={() => onNavigateLesson?.(nextLesson.id, nextLesson._unitId)}
            className="flex flex-col items-start gap-0.5 text-ink-500 hover:text-sand-400 transition-colors group px-3 py-1.5 rounded-lg hover:bg-ink-900"
          >
            {crossUnit && <span className="text-[10px] font-mono text-ink-700 group-hover:text-ink-500">← {nextUnit?.title}</span>}
            <span className="flex items-center gap-1 text-xs font-arabic">
              <span>←</span>
              <span className="truncate max-w-[100px]">{nextLesson.title}</span>
            </span>
          </button>
        );
      })()}
    </div>
  );
}