'use client';
import { useState, useRef, useEffect } from 'react';
import { useDataStore }  from '@/store/dataStore';
import { getLessonStatus, STATUS_CONFIG } from '@/lib/LessonStatus';
import StatusBadge       from '@/components/editor/shared/StatusBadge';
import { COVERAGE_LEVEL_CONFIG } from '@/hooks/useCoverageData';

// Left-border accent colors per lesson status
const STATUS_BORDER = {
  empty:   '#1f1e1b',   // near-invisible — ink-800
  started: '#d97706',   // amber
  partial: '#3b82f6',   // blue
  done:    '#10b981',   // emerald
};

const STATUS_BG_HOVER = {
  empty:   'hover:bg-ink-900/60',
  started: 'hover:bg-amber-900/10',
  partial: 'hover:bg-blue-900/10',
  done:    'hover:bg-emerald-900/10',
};

export default function LessonItem({ lesson, index, onEdit, coverageLevel }) {
  const { sections, blocks, updateLesson } = useDataStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft,   setTitleDraft]   = useState(lesson.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingTitle) inputRef.current?.focus();
  }, [editingTitle]);

  const ls       = sections.filter((s) => s.lessonId === lesson.id);
  const lb       = blocks.filter((b) => ls.some((s) => s.id === b.sectionId));
  const status   = getLessonStatus(lesson.id, sections, blocks, lesson);
  const stCfg    = STATUS_CONFIG[status];
  const cvCfg    = coverageLevel ? (COVERAGE_LEVEL_CONFIG[coverageLevel] ?? COVERAGE_LEVEL_CONFIG.none) : null;

  const saveTitle = () => {
    if (titleDraft.trim()) updateLesson(lesson.id, { title: titleDraft.trim() });
    else setTitleDraft(lesson.title);
    setEditingTitle(false);
  };

  return (
    <div
      className={`
        relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg
        transition-all duration-150 group cursor-default
        ${STATUS_BG_HOVER[status]}
      `}
      style={{
        borderRight: `3px solid ${STATUS_BORDER[status]}`,
        background: 'rgba(26,23,19,0.4)',
      }}
    >
      {/* Lesson number */}
      <span className="text-[11px] font-mono text-ink-700 shrink-0 w-5 text-center select-none">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Title */}
      {editingTitle ? (
        <input
          ref={inputRef}
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter')  saveTitle();
            if (e.key === 'Escape') { setTitleDraft(lesson.title); setEditingTitle(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-b border-sand-600 text-sand-200 text-sm
            focus:outline-none font-arabic pb-0.5"
        />
      ) : (
        <span className="flex-1 text-sm text-ink-100 font-arabic leading-snug min-w-0 truncate
          group-hover:text-sand-100 transition-colors">
          {lesson.title}
        </span>
      )}

      {/* Atlas status badge */}
      {lesson.atlasStatus && (
        <StatusBadge status={lesson.atlasStatus} />
      )}

      {/* Stats */}
      <span className="text-[11px] text-ink-700 font-mono whitespace-nowrap shrink-0 hidden sm:block">
        {ls.length}<span className="text-ink-800">ق</span>
        &thinsp;·&thinsp;
        {lb.length}<span className="text-ink-800">ع</span>
        &thinsp;·&thinsp;
        {lesson.estimatedMinutes || 15}<span className="text-ink-800">د</span>
      </span>

      {/* Coverage pip */}
      {cvCfg && (
        <div
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: cvCfg.color, opacity: 0.8 }}
          title={`تغطية: ${cvCfg.label}`}
        />
      )}

      {/* Action buttons — always visible but styled as subtle ghost */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setTitleDraft(lesson.title); setEditingTitle(true); }}
          className="p-1 text-ink-800 hover:text-ink-400 rounded transition-colors opacity-0 group-hover:opacity-100"
          title="تعديل العنوان"
        >
          <PencilIcon />
        </button>

        <button
          onClick={onEdit}
          className="
            flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-arabic
            border border-transparent
            text-ink-600 hover:text-sand-300 hover:border-sand-900/60 hover:bg-sand-900/20
            transition-all
            opacity-40 group-hover:opacity-100
          "
        >
          تحرير
          <span className="text-[10px] opacity-60">←</span>
        </button>
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z"
        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}