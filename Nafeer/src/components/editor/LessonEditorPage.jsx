'use client';
import { useDataStore }     from '@/store/dataStore';
import { getLessonStatus, STATUS_CONFIG } from '@/lib/LessonStatus';
import SectionEditor        from '@/components/editor/SectionEditor';

const inputClass =
  'w-full px-4 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600 text-sm';

export default function LessonEditorPage({ lessonId, unitId, onBack, onBackToOverview, onNavigateLesson }) {
  const { units, lessons, sections, blocks, updateLesson, addSection } = useDataStore();

  const lesson         = lessons.find((l) => l.id === lessonId);
  const unit           = units.find((u) => u.id === unitId);
  const lessonSections = sections
    .filter((s) => s.lessonId === lessonId)
    .sort((a, b) => a.order - b.order);

  const sectionIds   = lessonSections.map((s) => s.id);
  const lessonBlocks = blocks.filter((b) => sectionIds.includes(b.sectionId));

  const status    = lesson ? getLessonStatus(lessonId, sections, blocks, lesson) : 'empty';
  const statusCfg = STATUS_CONFIG[status];

  const unitLessons = lessons
    .filter((l) => l.unitId === unitId)
    .sort((a, b) => a.order - b.order);
  const lessonIndex = unitLessons.findIndex((l) => l.id === lessonId);
  const prevLesson  = lessonIndex > 0                       ? unitLessons[lessonIndex - 1] : null;
  const nextLesson  = lessonIndex < unitLessons.length - 1  ? unitLessons[lessonIndex + 1] : null;

  const checklist = lesson ? [
    { label: 'عنوان',    done: lesson.title?.trim().length > 0   },
    { label: 'ملخص',    done: lesson.summary?.trim().length > 0  },
    { label: 'أقسام',   done: lessonSections.length > 0          },
    { label: 'محتوى',   done: lessonBlocks.length > 0            },
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

  const handleAddSection = () => {
    addSection({
      lessonId,
      title:        `قسم ${lessonSections.length + 1}`,
      conceptIds:   [],
      learningType: 'UNDERSTANDING',
    });
  };

  return (
    <div>
      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-ink-600 font-arabic mb-7">
        <button onClick={onBackToOverview} className="hover:text-sand-400 transition-colors">الدروس</button>
        <span className="text-ink-700">›</span>
        <button onClick={onBack} className="hover:text-sand-400 transition-colors">{unit?.title ?? 'الوحدة'}</button>
        <span className="text-ink-700">›</span>
        <span className="text-ink-300 truncate max-w-[200px]">{lesson.title}</span>
      </nav>

      {/* ── Lesson meta ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-mono text-ink-600 mb-1">
            درس {lessonIndex + 1} من {unitLessons.length}
          </p>
          <h1 className="text-xl font-bold text-sand-100 font-arabic">{lesson.title}</h1>
        </div>
        <span className={`shrink-0 text-xs font-arabic px-3 py-1 rounded-full border ${statusCfg.badge}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* ── Completion checklist ─────────────────────────────────── */}
      <div className="bg-ink-900 rounded-xl border border-ink-800 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-ink-500 font-arabic">اكتمال الدرس</p>
          <span className="text-xs font-mono text-ink-400">{completedChecks}/4</span>
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

      {/* ── Lesson navigation ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-ink-800">
        {prevLesson ? (
          <button
            onClick={() => onNavigateLesson?.(prevLesson.id)}
            className="flex items-center gap-2 text-sm text-ink-500 hover:text-sand-400 transition-colors font-arabic"
          >
            <span>→</span>
            <span className="truncate max-w-[160px]">{prevLesson.title}</span>
          </button>
        ) : <div />}

        <button
          onClick={onBack}
          className="text-xs text-ink-600 hover:text-ink-400 transition-colors font-arabic px-3 py-1.5 rounded-lg hover:bg-ink-800"
        >
          قائمة الدروس
        </button>

        {nextLesson ? (
          <button
            onClick={() => onNavigateLesson?.(nextLesson.id)}
            className="flex items-center gap-2 text-sm text-ink-500 hover:text-sand-400 transition-colors font-arabic"
          >
            <span className="truncate max-w-[160px]">{nextLesson.title}</span>
            <span>←</span>
          </button>
        ) : <div />}
      </div>
    </div>
  );
}