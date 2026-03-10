'use client';
import { useState } from 'react';
import { useDataStore }     from '@/store/dataStore';
import { useAtlasSync }     from '@/hooks/useAtlasSync';
import { getLessonStatus, STATUS_CONFIG } from '@/lib/LessonStatus';
import SectionEditor          from '@/components/editor/SectionEditor';
import LessonQuestionsPanel   from '@/components/editor/LessonQuestionsPanel';
import LessonFeedPanel        from '@/components/editor/LessonFeedPanel';

const inputClass =
  'w-full px-4 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600 text-sm';

// Default scaffold title pattern — "درس 1", "درس 2", etc.
const SCAFFOLD_TITLE_RE = /^الدرس\s+\d+$/;

export default function LessonEditorPage({ lessonId, unitId, subjectId, onBack, onBackToOverview, onNavigateLesson, onOpenGlobal }) {
  const { units, lessons, sections, blocks, questions, feedItems, updateLesson, addSection } = useDataStore();
  const { syncAll, isSyncing } = useAtlasSync();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const lesson         = lessons.find((l) => l.id === lessonId);
  const unit           = units.find((u) => u.id === unitId);
  const lessonSections = sections
    .filter((s) => s.lessonId === lessonId)
    .sort((a, b) => a.order - b.order);

  const sectionIds   = lessonSections.map((s) => s.id);
  const lessonBlocks = blocks.filter((b) => sectionIds.includes(b.sectionId));

  // Concept IDs linked to any section in this lesson — fed to the feed panel
  // so linked concepts appear first in the picker
  const lessonConceptIds = [...new Set(lessonSections.flatMap((s) => s.conceptIds || []))];

  const status    = lesson ? getLessonStatus(lessonId, sections, blocks, lesson) : 'empty';
  const statusCfg = STATUS_CONFIG[status];

  // ── Build a flat ordered list of ALL lessons across ALL units ─────────────
  // This powers cross-unit prev/next navigation so contributors can move
  // linearly through the whole subject without hitting dead ends.
  const sortedUnits   = [...units].sort((a, b) => a.order - b.order);
  const allLessons    = sortedUnits.flatMap((u) =>
    lessons
      .filter((l) => l.unitId === u.id)
      .sort((a, b) => a.order - b.order)
      .map((l) => ({ ...l, _unitId: u.id }))
  );
  const globalIndex  = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson   = globalIndex > 0                    ? allLessons[globalIndex - 1] : null;
  const nextLesson   = globalIndex < allLessons.length - 1 ? allLessons[globalIndex + 1] : null;

  // Position within own unit (for the "درس X من Y" label)
  const unitLessons  = lessons.filter((l) => l.unitId === unitId).sort((a, b) => a.order - b.order);
  const lessonIndex  = unitLessons.findIndex((l) => l.id === lessonId);

  // ── Checklist ─────────────────────────────────────────────────────────────
  // "عنوان" checks for a *real* title — not the scaffold placeholder "الدرس 1"
  const lessonQuestions = questions.filter((q) => q.lessonId === lessonId);
  const lessonFeedItems = feedItems.filter((f) => f.lessonId === lessonId);

  const checklist = lesson ? [
    { label: 'عنوان',  done: !!lesson.title?.trim() && !SCAFFOLD_TITLE_RE.test(lesson.title.trim()) },
    { label: 'ملخص',  done: !!lesson.summary?.trim()        },
    { label: 'أقسام', done: lessonSections.length > 0       },
    { label: 'محتوى', done: lessonBlocks.length > 0         },
    { label: 'أسئلة', done: lessonQuestions.length > 0      },
    { label: 'تغذية', done: lessonFeedItems.length > 0      },
  ] : [];
  const completedChecks = checklist.filter((c) => c.done).length;

  if (!lesson) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">📝</div>
        <h2 className="text-lg font-medium text-ink-400 mb-4 font-arabic">الدرس غير موجود</h2>
        <button onClick={onBack} className="px-6 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-arabic">
          العودة
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!subjectId) return;
    try {
      await syncAll(lessonId, subjectId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // syncAll surfaces error via SyncBar in EditorShell
    }
  };

  const handleAddSection = () => {
    // Use max existing order + 1 to stay correct after any deletions
    const maxOrder = lessonSections.reduce((m, s) => Math.max(m, s.order), 0);
    addSection({
      lessonId,
      title:        `قسم ${lessonSections.length + 1}`,
      order:        maxOrder + 1,
      conceptIds:   [],
      learningType: 'UNDERSTANDING',
    });
  };

  return (
    <div>
      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-ink-600 font-arabic mb-7">
        <button onClick={onBackToOverview} className="hover:text-sand-400 transition-colors">
          الدروس
        </button>
        <span className="text-ink-700">›</span>
        <button onClick={onBack} className="hover:text-sand-400 transition-colors max-w-[140px] truncate">
          {unit ? `${unit.order}. ${unit.title}` : 'الوحدة'}
        </button>
        <span className="text-ink-700">›</span>
        <span className="text-ink-300 truncate max-w-[180px]">{lesson.title}</span>
      </nav>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-mono text-ink-600 mb-1">
            درس {lessonIndex + 1} من {unitLessons.length}
            <span className="text-ink-700 mx-1.5">·</span>
            <span className="text-ink-600">{globalIndex + 1} / {allLessons.length} إجمالاً</span>
          </p>
          <h1 className="text-xl font-bold text-sand-100 font-arabic">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs font-arabic px-3 py-1 rounded-full border ${statusCfg.badge}`}>
            {statusCfg.label}
          </span>
          <button
            onClick={handleSave}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-sand-700 hover:bg-sand-600 disabled:opacity-50 disabled:cursor-not-allowed text-ink-950 text-sm font-semibold rounded-lg transition-colors font-arabic"
          >
            {isSyncing ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-ink-800 border-t-transparent rounded-full animate-spin" />
                حفظ…
              </>
            ) : saveSuccess ? (
              <>✓ تم الحفظ</>
            ) : (
              <>↑ حفظ</>
            )}
          </button>
        </div>
      </div>

      {/* ── Completion checklist ─────────────────────────────────── */}
      <div className="bg-ink-900 rounded-xl border border-ink-800 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-ink-500 font-arabic">اكتمال الدرس</p>
          <span className="text-xs font-mono text-ink-400">{completedChecks}/6</span>
        </div>
        <div className="flex gap-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-full h-1.5 rounded-full transition-colors ${item.done ? 'bg-emerald-500' : 'bg-ink-700'}`} />
              <span className={`text-[10px] font-arabic whitespace-nowrap ${item.done ? 'text-emerald-500' : 'text-ink-600'}`}>
                {item.done ? '✓' : '○'} {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lesson fields ─────────────────────────────────────────── */}
      <div className="bg-ink-900 rounded-xl border border-ink-800 p-5 mb-6 space-y-4">
        <div>
          <label className="block text-xs text-ink-500 mb-1.5 font-arabic">عنوان الدرس</label>
          <input
            type="text"
            value={lesson.title}
            onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
            className={inputClass}
            placeholder="عنوان الدرس"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1.5 font-arabic">ملخص الدرس</label>
          <textarea
            value={lesson.summary || ''}
            onChange={(e) => updateLesson(lesson.id, { summary: e.target.value })}
            className={`${inputClass} resize-y min-h-[70px]`}
            placeholder="ملخص قصير عن محتوى الدرس — يظهر للطالب قبل الدخول…"
          />
        </div>
        <div className="flex items-center gap-6">
          <div>
            <label className="block text-xs text-ink-500 mb-1.5 font-arabic">الوقت المقدر (دقيقة)</label>
            <input
              type="number"
              value={lesson.estimatedMinutes || 15}
              onChange={(e) => updateLesson(lesson.id, { estimatedMinutes: parseInt(e.target.value) || 15 })}
              className="w-24 px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none"
              min="1"
            />
          </div>
          <div className="flex-1" />
          <span className="text-xs text-ink-600 font-mono">
            {lessonSections.length} أقسام · {lessonBlocks.length} عناصر
          </span>
        </div>
      </div>

      {/* ── Sections ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {lessonSections.map((section) => (
          <SectionEditor key={section.id} section={section} />
        ))}
      </div>

      <button
        onClick={handleAddSection}
        className="w-full mt-4 py-4 border-2 border-dashed border-ink-800 rounded-xl text-ink-600 hover:border-sand-800 hover:text-sand-500 hover:bg-sand-900/10 transition-colors font-arabic"
      >
        + إضافة قسم جديد
      </button>

      {/* ── Questions & Feed panels ───────────────────────────────── */}
      <div className="mt-6 space-y-3">
        <LessonQuestionsPanel
          lessonId={lessonId}
          unitId={unitId}
          onOpenGlobal={onOpenGlobal}
        />
        <LessonFeedPanel
          lessonId={lessonId}
          unitId={unitId}
          lessonConceptIds={lessonConceptIds}
          onOpenGlobal={onOpenGlobal}
        />
      </div>

      {/* ── Lesson navigation ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-ink-800">

        {/* Prev */}
        {prevLesson ? (() => {
          const crossUnit = prevLesson._unitId !== unitId;
          const prevUnit  = crossUnit ? units.find((u) => u.id === prevLesson._unitId) : null;
          return (
            <button
              onClick={() => onNavigateLesson?.(prevLesson.id, prevLesson._unitId)}
              className="flex flex-col items-start gap-0.5 text-ink-500 hover:text-sand-400 transition-colors group"
            >
              {crossUnit && (
                <span className="text-[10px] font-mono text-ink-700 group-hover:text-ink-500">
                  ← {prevUnit?.title}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm font-arabic">
                <span>→</span>
                <span className="truncate max-w-[150px]">{prevLesson.title}</span>
              </span>
            </button>
          );
        })() : <div />}

        <button
          onClick={onBack}
          className="text-xs text-ink-600 hover:text-ink-400 transition-colors font-arabic px-3 py-1.5 rounded-lg hover:bg-ink-800 shrink-0"
        >
          قائمة الدروس
        </button>

        {/* Next */}
        {nextLesson ? (() => {
          const crossUnit = nextLesson._unitId !== unitId;
          const nextUnit  = crossUnit ? units.find((u) => u.id === nextLesson._unitId) : null;
          return (
            <button
              onClick={() => onNavigateLesson?.(nextLesson.id, nextLesson._unitId)}
              className="flex flex-col items-end gap-0.5 text-ink-500 hover:text-sand-400 transition-colors group"
            >
              {crossUnit && (
                <span className="text-[10px] font-mono text-ink-700 group-hover:text-ink-500">
                  {nextUnit?.title} →
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm font-arabic">
                <span className="truncate max-w-[150px]">{nextLesson.title}</span>
                <span>←</span>
              </span>
            </button>
          );
        })() : <div />}

      </div>
    </div>
  );
}