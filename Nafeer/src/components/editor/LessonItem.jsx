import { useState } from 'react';
import { useDataStore }  from '@/store/dataStore';
import { getLessonStatus, STATUS_CONFIG } from '@/lib/LessonStatus';
import StatusBadge from '@/components/editor/StatusBadge';
import { COVERAGE_LEVEL_CONFIG } from '@/hooks/useCoverageData';

export default function LessonItem({ lesson, onEdit, coverageLevel }) {
  const { sections, blocks, updateLesson } = useDataStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(lesson.title);

  const lessonSections = sections.filter((s) => s.lessonId === lesson.id);
  const lessonBlocks   = blocks.filter((b) =>
    lessonSections.some((s) => s.id === b.sectionId)
  );

  const status    = getLessonStatus(lesson.id, sections, blocks, lesson);
  const statusCfg = STATUS_CONFIG[status];

  const handleSaveTitle = () => {
    if (editTitle.trim()) updateLesson(lesson.id, { title: editTitle });
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-ink-800/60 rounded-lg hover:bg-ink-800 transition-colors group border border-transparent hover:border-ink-700">

      {/* Status dot + coverage dot */}
      <div className="flex flex-col gap-1 shrink-0 items-center">
        <div className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
        {coverageLevel && (() => {
          const cvCfg = COVERAGE_LEVEL_CONFIG[coverageLevel] ?? COVERAGE_LEVEL_CONFIG.none;
          return <div className={`w-2 h-2 rounded-full ${cvCfg.dot}`} title={cvCfg.label} />;
        })()}
      </div>

      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setIsEditing(false); }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 px-2 py-1 bg-ink-900 border border-sand-600 rounded text-sand-200 text-sm focus:outline-none focus:ring-1 focus:ring-sand-500 font-arabic"
          autoFocus
        />
      ) : (
        <span className="flex-1 text-ink-200 text-sm font-arabic">{lesson.title}</span>
      )}

      {lesson.atlasStatus && <StatusBadge status={lesson.atlasStatus} />}

      <span className="text-xs text-ink-600 font-mono whitespace-nowrap shrink-0">
        {lessonSections.length}ق · {lessonBlocks.length}ع · {lesson.estimatedMinutes}د
      </span>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="px-3 py-1 text-xs bg-sand-900/60 text-sand-400 border border-sand-800/60 rounded hover:bg-sand-800/60 transition-colors font-arabic"
        >
          تحرير
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setEditTitle(lesson.title); setIsEditing(true); }}
          className="p-1 text-ink-600 hover:text-sand-400 transition-colors"
          title="تعديل العنوان"
        >
          ✏
        </button>
      </div>

    </div>
  );
}