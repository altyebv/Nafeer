'use client';
import { useState } from 'react';
import { useDataStore }    from '@/store/dataStore';
import { useAtlasSync }    from '@/hooks/useAtlasSync';
import { getLessonStatus, STATUS_CONFIG } from '@/lib/LessonStatus';
import SectionEditor        from '@/components/editor/SectionEditor';
import LessonQuestionsPanel from '@/components/editor/LessonQuestionsPanel';
import LessonFeedPanel      from '@/components/editor/LessonFeedPanel';
import StatusBadge          from '@/components/editor/StatusBadge';
import LessonPreviewModal   from '@/components/editor/LessonPreviewModal';

// ─── Constants ───────────────────────────────────────────────────────────────
const SCAFFOLD_TITLE_RE = /^الدرس\s+\d+$/;

const field =
  'w-full px-4 py-3 bg-ink-950 border border-ink-800 rounded-xl text-sand-200 ' +
  'focus:ring-1 focus:ring-sand-500 focus:border-sand-600 focus:outline-none ' +
  'font-arabic placeholder-ink-700 text-sm leading-relaxed transition-colors ' +
  'hover:border-ink-700';

const STEPS = [
  { id: 'meta',      num: '١', label: 'البيانات'  },
  { id: 'body',      num: '٢', label: 'المحتوى'   },
  { id: 'questions', num: '٣', label: 'الأسئلة'   },
  { id: 'feed',      num: '٤', label: 'التغذية'   },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function LessonEditorPage({
  lessonId, unitId, subjectId,
  onBack, onBackToOverview, onNavigateLesson, onOpenGlobal,
  isSyncing, syncError, lastSynced,
}) {
  const {
    units, lessons, sections, blocks, questions, feedItems,
    updateLesson, addSection,
  } = useDataStore();
  const { syncAll, submitForReview } = useAtlasSync();

  const [activeStep,    setActiveStep]    = useState(0);
  const [saveSuccess,   setSaveSuccess]   = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showPreview,   setShowPreview]   = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
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

  // Cross-unit prev/next
  const sortedUnits = [...units].sort((a, b) => a.order - b.order);
  const allLessons  = sortedUnits.flatMap((u) =>
    lessons.filter((l) => l.unitId === u.id).sort((a, b) => a.order - b.order).map((l) => ({ ...l, _unitId: u.id }))
  );
  const globalIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson  = globalIndex > 0 ? allLessons[globalIndex - 1] : null;
  const nextLesson  = globalIndex < allLessons.length - 1 ? allLessons[globalIndex + 1] : null;
  const unitLessons = lessons.filter((l) => l.unitId === unitId).sort((a, b) => a.order - b.order);
  const lessonIndex = unitLessons.findIndex((l) => l.id === lessonId);

  // Checklist
  const checklist = lesson ? [
    { label: 'عنوان',  done: !!lesson.title?.trim() && !SCAFFOLD_TITLE_RE.test(lesson.title.trim()) },
    { label: 'ملخص',  done: !!lesson.summary?.trim()   },
    { label: 'أقسام', done: lessonSections.length > 0  },
    { label: 'محتوى', done: lessonBlocks.length > 0    },
    { label: 'أسئلة', done: lessonQuestions.length > 0 },
    { label: 'تغذية', done: lessonFeedItems.length > 0 },
  ] : [];
  const completedChecks = checklist.filter((c) => c.done).length;

  const stepDone = (step) => {
    if (step.id === 'meta')      return checklist.slice(0,2).every(c => c.done);
    if (step.id === 'body')      return checklist.slice(2,4).every(c => c.done);
    if (step.id === 'questions') return checklist[4]?.done;
    if (step.id === 'feed')      return checklist[5]?.done;
    return false;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
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
    addSection({
      lessonId,
      title: `قسم ${lessonSections.length + 1}`,
      order: maxOrder + 1,
      conceptIds: [],
      learningType: 'UNDERSTANDING',
      partIndex: partIdx,
    });
  };

  const handleAddNewPart = () => {
    const maxPart  = lessonSections.reduce((m, s) => Math.max(m, s.partIndex ?? 0), -1);
    const maxOrder = lessonSections.reduce((m, s) => Math.max(m, s.order), 0);
    addSection({
      lessonId,
      title: 'قسم جديد',
      order: maxOrder + 1,
      conceptIds: [],
      learningType: 'UNDERSTANDING',
      partIndex: maxPart + 1,
    });
  };

  if (!lesson) return (
    <div className="text-center py-32">
      <div className="text-4xl mb-4">📝</div>
      <h2 className="text-lg font-medium text-ink-400 mb-4 font-arabic">الدرس غير موجود</h2>
      <button onClick={onBack} className="px-6 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-arabic">العودة</button>
    </div>
  );

  // ── Sync indicator dot ────────────────────────────────────────────────────
  const syncDot = isSyncing
    ? <span className="inline-block w-2 h-2 rounded-full bg-sand-500 animate-pulse" />
    : syncError
      ? <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
      : lastSynced
        ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" />
        : null;

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Sticky top bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-ink-950/98 backdrop-blur-md border-b border-ink-800/80">

        {/* Row 1: breadcrumb + actions */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-2.5">
          {/* Back */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-ink-600 hover:text-sand-400 transition-colors font-arabic shrink-0 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            <span className="hidden sm:inline">{unit ? unit.title : 'الدروس'}</span>
          </button>

          <span className="text-ink-800 text-xs shrink-0">›</span>

          {/* Lesson title */}
          <h1 className="flex-1 text-sm font-semibold text-sand-200 font-arabic truncate min-w-0">
            {lesson.title}
          </h1>

          {/* Status badge */}
          {lesson.atlasStatus && <StatusBadge status={lesson.atlasStatus} />}

          {/* Sync dot */}
          {syncDot && <span className="shrink-0">{syncDot}</span>}

          {/* Progress ring */}
          <div className="relative w-7 h-7 shrink-0">
            <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-800" />
              <circle
                cx="14" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-emerald-600 transition-all duration-500"
                strokeDasharray={`${(completedChecks / 6) * 62.8} 62.8`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-ink-400">
              {completedChecks}
            </span>
          </div>

          {/* Review button */}
          {(!lesson.atlasStatus || lesson.atlasStatus === 'draft') && (
            <button
              onClick={handleSubmitForReview}
              disabled={isSyncing}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/30 hover:bg-amber-800/40 disabled:opacity-40 text-amber-400 text-xs font-semibold rounded-lg transition-colors border border-amber-800/50 font-arabic"
            >
              {reviewSuccess ? '✓ أُرسل' : '⇪ مراجعة'}
            </button>
          )}

          {/* Preview */}
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-sand-300 text-xs font-semibold rounded-lg transition-colors border border-ink-700 font-arabic"
          >
            <span className="text-sm leading-none">👁</span>
            <span className="hidden sm:inline">معاينة</span>
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-1.5 bg-sand-700 hover:bg-sand-600 disabled:opacity-40 text-ink-950 text-sm font-semibold rounded-lg transition-colors font-arabic"
          >
            {isSyncing
              ? <><span className="inline-block w-3 h-3 border-2 border-ink-800 border-t-transparent rounded-full animate-spin" />حفظ…</>
              : saveSuccess ? '✓ تم' : '↑ حفظ'}
          </button>
        </div>

        {/* Row 2: step tabs */}
        <div className="flex border-t border-ink-800/60">
          {STEPS.map((step, i) => {
            const isActive = i === activeStep;
            const isDone   = stepDone(step);
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(i)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-xs transition-all font-arabic
                  ${isActive
                    ? 'text-sand-300 bg-sand-950/40'
                    : isDone
                      ? 'text-emerald-600 hover:text-emerald-500 hover:bg-ink-900/40'
                      : 'text-ink-600 hover:text-ink-400 hover:bg-ink-900/30'
                  }`}
              >
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sand-500 rounded-t" />}
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border transition-colors
                  ${isActive ? 'border-sand-600 bg-sand-900/60 text-sand-400'
                    : isDone  ? 'border-emerald-700 bg-emerald-900/30 text-emerald-500'
                    :           'border-ink-700 text-ink-600'}`}>
                  {isDone && !isActive ? '✓' : step.num}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Approved warning ─────────────────────────────────────────────────── */}
      {lesson.atlasStatus === 'approved' && (
        <div className="mx-5 mt-4 px-4 py-3 bg-amber-900/15 border border-amber-800/30 rounded-xl flex items-start gap-3">
          <span className="text-amber-500 text-sm mt-0.5 shrink-0">⚠</span>
          <p className="text-xs text-amber-400/90 font-arabic leading-relaxed">
            هذا الدرس <strong>معتمد</strong>. أي تعديل سيُعيده إلى حالة المسودة ويتطلب مراجعة جديدة.
          </p>
        </div>
      )}

      {/* ── Step canvas ─────────────────────────────────────────────────────── */}
      <div className={`flex-1 py-8 ${activeStep === 1 ? 'px-5' : 'px-5 max-w-2xl'}`}>
        {activeStep === 0 && (
          <StepMeta
            lesson={lesson}
            unit={unit}
            unitLessons={unitLessons}
            lessonIndex={lessonIndex}
            checklist={checklist}
            completedChecks={completedChecks}
            statusCfg={statusCfg}
            lessonSections={lessonSections}
            lessonBlocks={lessonBlocks}
            updateLesson={updateLesson}
            patchMeta={patchMeta}
            fieldClass={field}
            onNext={() => setActiveStep(1)}
          />
        )}

        {activeStep === 1 && (
          <StepBody
            lesson={lesson}
            lessonSections={lessonSections}
            lessonBlocks={lessonBlocks}
            onAddSection={handleAddSection}
            onAddNewPart={handleAddNewPart}
            onPrev={() => setActiveStep(0)}
            onNext={() => setActiveStep(2)}
          />
        )}

        {activeStep === 2 && (
          <StepQuestions
            lessonId={lessonId}
            unitId={unitId}
            lessonSections={lessonSections}
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
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            units={units}
            onOpenGlobal={onOpenGlobal}
            onPrev={() => setActiveStep(2)}
            onNavigateLesson={onNavigateLesson}
            onBack={onBack}
          />
        )}
      </div>

      {/* ── Preview modal ────────────────────────────────────────────────────── */}
      {showPreview && (
        <LessonPreviewModal
          lesson={lesson}
          sections={lessonSections}
          blocks={lessonBlocks}
          questions={lessonQuestions}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// ─── Step 1: Metadata ─────────────────────────────────────────────────────────
function StepMeta({
  lesson, unit, unitLessons, lessonIndex,
  checklist, completedChecks, statusCfg, lessonSections, lessonBlocks,
  updateLesson, patchMeta, fieldClass, onNext,
}) {
  return (
    <div className="space-y-5">

      {/* Position + status */}
      <div className="flex items-center gap-3 text-xs text-ink-600 font-mono">
        <span>درس {lessonIndex + 1} / {unitLessons.length}</span>
        {unit && <><span className="text-ink-800">·</span><span className="font-arabic">{unit.title}</span></>}
        <span className={`font-arabic px-2 py-0.5 rounded-full border text-[11px] ${statusCfg.badge}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* ── Core fields ─────────────────────────────────────────────────────── */}
      <Section icon="◈" title="بيانات الدرس" hint="تظهر للطالب قبل دخول الدرس">
        <div className="space-y-4">
          <Field label="عنوان الدرس" required>
            <input
              type="text"
              value={lesson.title}
              onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
              className={fieldClass}
              placeholder="أدخل عنوان الدرس…"
            />
            {lesson.title && SCAFFOLD_TITLE_RE.test(lesson.title.trim()) && (
              <p className="text-[11px] text-amber-600 font-arabic mt-1.5">⚠ هذا عنوان تلقائي — أدخل عنواناً حقيقياً</p>
            )}
          </Field>

          <Field label="ملخص الدرس">
            <textarea
              value={lesson.summary || ''}
              onChange={(e) => updateLesson(lesson.id, { summary: e.target.value })}
              className={`${fieldClass} resize-y min-h-[88px]`}
              placeholder="ملخص قصير يصف محتوى الدرس — يظهر في قائمة الدروس…"
            />
          </Field>

          <div className="flex items-center gap-6">
            <Field label="الوقت المقدر">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={lesson.estimatedMinutes || 15}
                  onChange={(e) => updateLesson(lesson.id, { estimatedMinutes: parseInt(e.target.value) || 15 })}
                  className="w-20 px-3 py-2.5 bg-ink-950 border border-ink-800 rounded-xl text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none text-center"
                  min="1"
                />
                <span className="text-xs text-ink-600 font-arabic">دقيقة</span>
              </div>
            </Field>
            <div className="flex gap-4 pt-5">
              <Stat label="أقسام" val={lessonSections.length} />
              <Stat label="عناصر" val={lessonBlocks.length} />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Lesson hook / motivation ─────────────────────────────────────────── */}
      <Section icon="✦" title="التحفيز والتوجيه" hint="اختياري — يُشاهده الطالب قبل بدء الدرس">
        <div className="space-y-4">
          <Field label="السؤال التحفيزي (Hook)" hint="سؤال يستثير فضول الطالب — مثال: هل تساءلت كيف يحدد الملاحون موقعهم؟">
            <textarea
              value={lesson.metadata?.hook || ''}
              onChange={(e) => patchMeta({ hook: e.target.value || null })}
              className={`${fieldClass} resize-y min-h-[72px]`}
              placeholder="اكتب سؤالاً يشد الطالب للدرس…"
            />
          </Field>

          <Field label="ستتعلم في هذا الدرس" hint="قائمة نقاط توجيهية تظهر قبل المحتوى">
            <OrientationInput
              value={lesson.metadata?.orientation || []}
              onChange={(v) => patchMeta({ orientation: v })}
            />
          </Field>

          <Field label="الجملة الشدّاءة (Forward Pull)" hint="جملة على بطاقة الإتمام تشجع على الدرس التالي">
            <input
              type="text"
              value={lesson.metadata?.forwardPull || ''}
              onChange={(e) => patchMeta({ forwardPull: e.target.value || null })}
              className={fieldClass}
              placeholder="درس واحد يفصلك عن إكمال الوحدة…"
            />
          </Field>
        </div>
      </Section>

      {/* ── Checklist ────────────────────────────────────────────────────────── */}
      <Section icon="◎" title="اكتمال الدرس">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-1.5 bg-ink-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedChecks / 6) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-ink-500">{completedChecks}/6</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {checklist.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-arabic transition-colors
                ${item.done ? 'bg-emerald-900/20 border-emerald-800/40 text-emerald-500' : 'bg-ink-800/20 border-ink-800 text-ink-600'}`}
            >
              <span>{item.done ? '✓' : '○'}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <StepFooter onNext={onNext} nextLabel="المحتوى ←" />
    </div>
  );
}

// ─── Step 2: Body ─────────────────────────────────────────────────────────────
function StepBody({ lesson, lessonSections, lessonBlocks, onAddSection, onAddNewPart, onPrev, onNext }) {
  // Group sections by partIndex
  const partsMap = lessonSections.reduce((acc, s) => {
    const p = s.partIndex ?? 0;
    if (!acc[p]) acc[p] = [];
    acc[p].push(s);
    return acc;
  }, {});
  const partKeys  = Object.keys(partsMap).map(Number).sort((a, b) => a - b);
  const maxPart   = partKeys.length > 0 ? Math.max(...partKeys) : 0;
  const partNames = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'];

  return (
    <div className="space-y-2">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h2 className="text-sm font-semibold text-sand-300 font-arabic">محتوى الدرس</h2>
          <p className="text-xs text-ink-600 font-arabic mt-0.5">{lessonSections.length} أقسام · {lessonBlocks.length} عناصر</p>
        </div>
        <div className="flex-1" />
        {partKeys.length > 0 && (
          <span className="text-xs text-ink-600 font-arabic px-2.5 py-1 bg-ink-800/50 rounded-full border border-ink-800">
            {partKeys.length} {partKeys.length === 1 ? 'جزء' : 'أجزاء'}
          </span>
        )}
      </div>

      {lessonSections.length === 0 && (
        <div className="py-16 text-center border-2 border-dashed border-ink-800 rounded-2xl">
          <p className="text-3xl mb-3">📄</p>
          <p className="text-sm text-ink-500 font-arabic mb-1">لا توجد أقسام بعد</p>
          <p className="text-xs text-ink-700 font-arabic">ابدأ بإضافة قسم — كل قسم يحتوي على عناصر محتوى</p>
        </div>
      )}

      {/* Parts + sections */}
      {partKeys.map((partIdx, pi) => (
        <div key={partIdx} className="space-y-3">
          {/* Part header — only if more than 1 part */}
          {(partKeys.length > 1 || maxPart > 0) && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-sand-900/60 border border-sand-800/50 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-sand-500">{pi + 1}</span>
                </div>
                <span className="text-xs font-semibold text-sand-500 font-arabic">
                  الجزء {partNames[pi] || (pi + 1)}
                </span>
              </div>
              <div className="flex-1 h-px bg-ink-800/60" />
              <span className="text-[10px] text-ink-700 font-mono">{partsMap[partIdx].length} أقسام</span>
            </div>
          )}

          {partsMap[partIdx].map((section) => (
            <SectionEditor key={section.id} section={section} maxPart={maxPart} subjectId={subjectId} />
          ))}

          {/* Add section to this part */}
          <button
            onClick={() => onAddSection(partIdx)}
            className="w-full py-3 border border-dashed border-ink-800 rounded-xl text-ink-700 hover:border-sand-800 hover:text-sand-600 hover:bg-sand-900/10 transition-colors font-arabic text-xs flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>إضافة قسم في {partKeys.length > 1 ? `الجزء ${partNames[pi] || (pi+1)}` : 'هذا الجزء'}</span>
          </button>
        </div>
      ))}

      {/* Add new part */}
      <button
        onClick={onAddNewPart}
        className="w-full py-4 border-2 border-dashed border-ink-800 rounded-2xl text-ink-600 hover:border-sand-800/60 hover:text-sand-600 hover:bg-sand-900/5 transition-all font-arabic flex items-center justify-center gap-2"
      >
        <span className="text-base">⊕</span>
        <span className="text-sm">{lessonSections.length === 0 ? 'إضافة قسم' : 'إضافة جزء جديد'}</span>
      </button>

      <StepFooter onPrev={onPrev} onNext={onNext} prevLabel="→ البيانات" nextLabel="الأسئلة ←" />
    </div>
  );
}

// ─── Step 3: Questions ────────────────────────────────────────────────────────
function StepQuestions({ lessonId, unitId, lessonSections, lessonQuestions, onOpenGlobal, onPrev, onNext }) {
  const checkpoints = lessonQuestions.filter(q => q.isCheckpoint);
  const standalone  = lessonQuestions.filter(q => !q.isCheckpoint);

  return (
    <div className="space-y-4">
      <Section icon="◎" title="نقاط التحقق والأسئلة" hint="أسئلة تقيّم فهم الطالب أثناء الدرس وبعده">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-ink-800/30 rounded-xl border border-ink-800 p-3 text-center">
            <p className="text-2xl font-mono text-sand-400">{checkpoints.length}</p>
            <p className="text-xs text-ink-500 font-arabic mt-0.5">نقاط تحقق (مدمجة في الدرس)</p>
          </div>
          <div className="bg-ink-800/30 rounded-xl border border-ink-800 p-3 text-center">
            <p className="text-2xl font-mono text-sand-400">{standalone.length}</p>
            <p className="text-xs text-ink-500 font-arabic mt-0.5">أسئلة تدريب مستقلة</p>
          </div>
        </div>
        {lessonQuestions.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-sm text-ink-500 font-arabic">لا توجد أسئلة مرتبطة بهذا الدرس</p>
          </div>
        )}
      </Section>
      <LessonQuestionsPanel lessonId={lessonId} unitId={unitId} onOpenGlobal={onOpenGlobal} />
      <StepFooter onPrev={onPrev} onNext={onNext} prevLabel="→ المحتوى" nextLabel="التغذية ←" />
    </div>
  );
}

// ─── Step 4: Feed ─────────────────────────────────────────────────────────────
function StepFeed({ lessonId, unitId, lessonConceptIds, lessonFeedItems, prevLesson, nextLesson, units, onOpenGlobal, onPrev, onNavigateLesson, onBack }) {
  return (
    <div className="space-y-4">
      <Section icon="▣" title="بطاقات التغذية" hint="بطاقات المراجعة السريعة في تطبيق بشير">
        {lessonFeedItems.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">📱</p>
            <p className="text-sm text-ink-500 font-arabic">لا توجد بطاقات تغذية لهذا الدرس</p>
          </div>
        )}
        {lessonFeedItems.length > 0 && (
          <p className="text-xs font-mono text-sand-500">{lessonFeedItems.length} بطاقة</p>
        )}
      </Section>
      <LessonFeedPanel lessonId={lessonId} unitId={unitId} lessonConceptIds={lessonConceptIds} onOpenGlobal={onOpenGlobal} />

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-ink-800">
        <button onClick={onPrev} className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-500 hover:text-sand-400 hover:bg-ink-900 border border-ink-800 hover:border-ink-700 rounded-xl transition-colors font-arabic">
          → الأسئلة
        </button>
        <div className="flex-1" />
        <LessonNav prevLesson={prevLesson} nextLesson={nextLesson} units={units} onNavigateLesson={onNavigateLesson} onBack={onBack} />
      </div>
    </div>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Section({ icon, title, hint, children }) {
  return (
    <div className="bg-ink-900/60 rounded-2xl border border-ink-800/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-800/60 flex items-center gap-2.5">
        <span className="text-sand-700 text-sm">{icon}</span>
        <h2 className="text-sm font-semibold text-sand-300 font-arabic">{title}</h2>
        {hint && <span className="text-xs text-ink-700 font-arabic mr-auto">{hint}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
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
      <p className="text-base font-mono text-ink-400">{val}</p>
      <p className="text-[10px] text-ink-700 font-arabic">{label}</p>
    </div>
  );
}

function StepFooter({ onPrev, onNext, prevLabel, nextLabel }) {
  return (
    <div className="flex items-center gap-3 mt-8 pt-5 border-t border-ink-800/60">
      {onPrev && (
        <button onClick={onPrev} className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-500 hover:text-sand-400 hover:bg-ink-900 border border-ink-800 hover:border-ink-700 rounded-xl transition-colors font-arabic">
          {prevLabel}
        </button>
      )}
      <div className="flex-1" />
      {onNext && (
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-2.5 bg-sand-800/80 hover:bg-sand-700 text-ink-950 text-sm font-semibold rounded-xl transition-colors font-arabic border border-sand-700">
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
        <button
          onClick={() => onNavigateLesson?.(prevLesson.id, prevLesson._unitId)}
          className="flex items-center gap-1.5 text-ink-600 hover:text-sand-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-ink-900 text-xs font-arabic"
        >
          <span className="truncate max-w-[100px]">{prevLesson.title}</span>
          <span>→</span>
        </button>
      )}
      {nextLesson && (
        <button
          onClick={() => onNavigateLesson?.(nextLesson.id, nextLesson._unitId)}
          className="flex items-center gap-1.5 text-ink-600 hover:text-sand-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-ink-900 text-xs font-arabic"
        >
          <span>←</span>
          <span className="truncate max-w-[100px]">{nextLesson.title}</span>
        </button>
      )}
    </div>
  );
}

// ─── OrientationInput — tag-style list ───────────────────────────────────────
function OrientationInput({ value = [], onChange }) {
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...value, t]);
    setDraft('');
  };

  const removeItem = (i) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group">
          <span className="text-sand-700 text-xs mt-2.5 shrink-0">•</span>
          <span className="flex-1 text-sm text-ink-200 font-arabic py-1.5 leading-relaxed">{item}</span>
          <button
            onClick={() => removeItem(i)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-700 hover:text-red-500 text-xs mt-2"
          >✕</button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          className="flex-1 px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-sm font-arabic placeholder-ink-700 focus:outline-none focus:border-sand-700 transition-colors"
          placeholder="ستتعلم في هذا الدرس… ثم اضغط Enter"
        />
        <button
          onClick={addItem}
          className="px-3 py-2 bg-ink-800 border border-ink-700 rounded-lg text-ink-400 hover:text-sand-400 text-sm transition-colors"
        >+</button>
      </div>
    </div>
  );
}