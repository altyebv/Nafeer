'use client';
import { useMemo, useState } from 'react';
import { useDataStore }                                     from '@/store/dataStore';
import { getLessonStatus, computeProgress, STATUS_CONFIG }  from '@/lib/lessonStatus';

export default function UnitView({ unitId, onBack, onOpenLesson }) {
  const { units, lessons, sections, blocks, updateLesson } = useDataStore();

  const unit = units.find((u) => u.id === unitId);

  const unitLessons = useMemo(
    () => lessons.filter((l) => l.unitId === unitId).sort((a, b) => a.order - b.order),
    [lessons, unitId]
  );

  const lessonsMap = useMemo(
    () => Object.fromEntries(lessons.map((l) => [l.id, l])),
    [lessons]
  );

  const progress = useMemo(
    () => computeProgress(unitLessons.map((l) => l.id), sections, blocks, lessonsMap),
    [unitLessons, sections, blocks, lessonsMap]
  );

  if (!unit) return null;

  return (
    <div>
      {/* ── Breadcrumb / Back ─────────────────────────────────────── */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-ink-500 hover:text-sand-400 mb-8 transition-colors text-sm font-arabic group"
      >
        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
        <span>الرئيسية</span>
      </button>

      {/* ── Unit Header ───────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-mono text-ink-600 mb-1">الوحدة {unit.order}</p>
            <h2 className="text-2xl font-bold text-sand-100 font-arabic">{unit.title}</h2>
          </div>
          <div className="text-left shrink-0">
            <div className="text-2xl font-bold font-mono text-sand-400">{progress.pct}%</div>
            <div className="text-xs text-ink-600 font-arabic">{progress.done}/{progress.total} مكتمل</div>
          </div>
        </div>

        {/* Unit progress bar */}
        <div className="w-full h-1.5 bg-ink-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-sand-400 to-sand-600 rounded-full transition-all duration-700"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
      </div>

      {/* ── Lesson Cards Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {unitLessons.map((lesson, idx) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={idx}
            sections={sections}
            blocks={blocks}
            onOpen={() => onOpenLesson(lesson.id)}
            onRename={(title) => updateLesson(lesson.id, { title })}
          />
        ))}
      </div>

      {unitLessons.length === 0 && (
        <div className="text-center py-20 text-ink-600 font-arabic">
          لا توجد دروس في هذه الوحدة بعد
        </div>
      )}
    </div>
  );
}

// ── Lesson Card ─────────────────────────────────────────────────────────────
function LessonCard({ lesson, index, sections, blocks, onOpen, onRename }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draft,        setDraft]        = useState(lesson.title);

  const lessonSections = sections.filter((s) => s.lessonId === lesson.id);
  const sectionIds     = lessonSections.map((s) => s.id);
  const lessonBlocks   = blocks.filter((b) => sectionIds.includes(b.sectionId));

  const status    = getLessonStatus(lesson.id, sections, blocks, lesson);
  const statusCfg = STATUS_CONFIG[status];

  const handleRename = () => {
    if (draft.trim() && draft !== lesson.title) onRename(draft.trim());
    setEditingTitle(false);
  };

  const checklist = [
    { label: 'عنوان',    done: lesson.title?.trim().length > 0         },
    { label: 'ملخص',    done: lesson.summary?.trim().length > 0        },
    { label: 'أقسام',   done: lessonSections.length > 0               },
    { label: 'محتوى',   done: lessonBlocks.length > 0                  },
  ];

  const completedChecks = checklist.filter((c) => c.done).length;

  return (
    <div
      className={`relative flex flex-col p-5 rounded-xl bg-ink-900 border transition-all duration-200 group
        ${statusCfg.ring}
        ${status === 'empty' ? 'border-ink-800 hover:border-ink-700' : `border-opacity-60 hover:border-opacity-100`}
      `}
    >
      {/* Top row: lesson number + status badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-ink-600">درس {index + 1}</span>
        <span className={`text-xs font-arabic px-2 py-0.5 rounded-full border ${statusCfg.badge}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Lesson title — inline editable */}
      <div className="flex-1 mb-4">
        {editingTitle ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingTitle(false); }}
            className="w-full bg-ink-800 border border-sand-600 rounded-lg px-3 py-2 text-sand-100 text-sm font-arabic focus:outline-none focus:ring-1 focus:ring-sand-500"
          />
        ) : (
          <button
            onClick={() => { setDraft(lesson.title); setEditingTitle(true); }}
            className="text-right w-full text-sm font-semibold text-ink-100 font-arabic leading-snug hover:text-sand-300 transition-colors line-clamp-2"
            title="اضغط لتعديل العنوان"
          >
            {lesson.title}
          </button>
        )}
      </div>

      {/* Checklist mini-bar */}
      <div className="flex items-center gap-1.5 mb-4">
        {checklist.map((item) => (
          <div
            key={item.label}
            title={item.label}
            className={`flex-1 h-1 rounded-full transition-colors ${item.done ? 'bg-emerald-500' : 'bg-ink-700'}`}
          />
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-ink-600 font-mono mb-4">
        <span>{lessonSections.length} أقسام</span>
        <span>·</span>
        <span>{lessonBlocks.length} عناصر</span>
        <span>·</span>
        <span>{lesson.estimatedMinutes ?? 15}د</span>
        <span>·</span>
        <span>{completedChecks}/4 ✓</span>
      </div>

      {/* Open button */}
      <button
        onClick={onOpen}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold font-arabic transition-all
          ${status === 'done'
            ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/50'
            : 'bg-sand-900/40 text-sand-400 border border-sand-800/50 hover:bg-sand-900/60 hover:text-sand-300'
          }
        `}
      >
        {status === 'empty' ? 'ابدأ الدرس' : status === 'done' ? 'مراجعة' : 'تابع التحرير'}
      </button>
    </div>
  );
}