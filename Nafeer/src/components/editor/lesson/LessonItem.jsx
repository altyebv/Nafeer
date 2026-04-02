'use client';
import { useState, useRef, useEffect } from 'react';
import { useDataStore }  from '@/store/dataStore';
import { getLessonStatus, STATUS_CONFIG } from '@/lib/LessonStatus';
import StatusBadge       from '@/components/editor/shared/StatusBadge';
import { COVERAGE_LEVEL_CONFIG } from '@/hooks/useCoverageData';
import { VARIATION_CONFIG } from '@/components/editor/lesson/LinkVariationModal';

const STATUS_BORDER = {
  empty:   'var(--border-subtle)',
  started: '#d97706',
  partial: '#3b82f6',
  done:    '#10b981',
};

export default function LessonItem({ lesson, index, onEdit, onAddVariation, coverageLevel, isVariation }) {
  const { sections, blocks, updateLesson } = useDataStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft,   setTitleDraft]   = useState(lesson.title);
  const inputRef = useRef(null);

  useEffect(() => { if (editingTitle) inputRef.current?.focus(); }, [editingTitle]);

  const ls       = sections.filter((s) => s.lessonId === lesson.id);
  const lb       = blocks.filter((b) => ls.some((s) => s.id === b.sectionId));
  const status   = getLessonStatus(lesson.id, sections, blocks, lesson);
  const stCfg    = STATUS_CONFIG[status];
  const cvCfg    = coverageLevel ? (COVERAGE_LEVEL_CONFIG[coverageLevel] ?? COVERAGE_LEVEL_CONFIG.none) : null;
  const varCfg   = lesson.variationType ? VARIATION_CONFIG[lesson.variationType] : null;

  const borderColor = isVariation
    ? (varCfg?.color || STATUS_BORDER[status])
    : STATUS_BORDER[status];

  const saveTitle = () => {
    if (titleDraft.trim()) updateLesson(lesson.id, { title: titleDraft.trim() });
    else setTitleDraft(lesson.title);
    setEditingTitle(false);
  };

  return (
    <div className={isVariation ? 'flex gap-0 pr-2' : ''}>
      {/* Variation connector line */}
      {isVariation && (
        <div className="flex flex-col items-center shrink-0 w-5 pt-2 pb-1">
          <div className="w-px flex-1" style={{ background: varCfg?.border || 'var(--border-subtle)' }} />
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: varCfg?.color || 'var(--border-subtle)' }} />
        </div>
      )}

      <div
        className="relative flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-lg transition-all duration-150 group cursor-default"
        style={{
          flex:         isVariation ? '1' : undefined,
          width:        isVariation ? undefined : '100%',
          borderRight:  `2.5px solid ${borderColor}`,
          background:   'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = status === 'done'
            ? 'rgba(16,185,129,0.04)'
            : status === 'partial'
              ? 'rgba(59,130,246,0.04)'
              : status === 'started'
                ? 'rgba(217,119,6,0.04)'
                : 'var(--bg-card)';
        }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >

        {/* Lesson number */}
        <span
          className="font-mono shrink-0 w-5 text-center select-none"
          style={{ fontSize: 10, color: 'var(--text-muted)' }}
        >
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
            className="flex-1 bg-transparent focus:outline-none font-arabic"
            style={{ fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--accent)' }}
          />
        ) : (
          <span
            className="flex-1 font-arabic leading-snug min-w-0 truncate transition-colors group-hover:text-[--text-primary]"
            style={{ fontSize: 13, color: 'var(--text-secondary)' }}
          >
            {lesson.title}
          </span>
        )}

        {/* Variation type chip */}
        {varCfg && (
          <span
            className="shrink-0 font-arabic px-1.5 py-0.5 rounded border"
            style={{ fontSize: 10, background: varCfg.bg, borderColor: varCfg.border, color: varCfg.color }}
            title={lesson.variationNote || varCfg.label}
          >
            {varCfg.icon} {varCfg.label}
          </span>
        )}

        {/* Atlas status badge */}
        {lesson.atlasStatus && <StatusBadge status={lesson.atlasStatus} />}

        {/* Stats — sections · blocks · duration */}
        <span
          className="font-mono whitespace-nowrap shrink-0 hidden sm:flex items-center gap-0.5"
          style={{ fontSize: 10, color: 'var(--text-muted)' }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>{ls.length}</span>
          <span>ق</span>
          <span style={{ color: 'var(--border-mid)' }}>·</span>
          <span style={{ color: 'var(--text-secondary)' }}>{lb.length}</span>
          <span>ع</span>
          <span style={{ color: 'var(--border-mid)' }}>·</span>
          <span style={{ color: 'var(--text-secondary)' }}>{lesson.estimatedMinutes || 15}</span>
          <span>د</span>
        </span>

        {/* Notes count */}
        {lesson.notesCount > 0 && (
          <div className="flex items-center gap-0.5 shrink-0" title={`${lesson.notesCount} ملاحظة`}>
            <span style={{ fontSize: 9 }}>📝</span>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{lesson.notesCount}</span>
          </div>
        )}

        {/* Coverage pip */}
        {cvCfg && (
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: cvCfg.color, opacity: 0.85 }}
            title={`تغطية: ${cvCfg.label}`}
          />
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setTitleDraft(lesson.title); setEditingTitle(true); }}
            className="rounded transition-all duration-150 opacity-0 group-hover:opacity-100"
            style={{
              width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            title="تعديل العنوان"
          >
            <PencilIcon />
          </button>

          {/* Add variation — only shown on root lessons */}
          {!isVariation && onAddVariation && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddVariation(); }}
              className="flex items-center gap-1 rounded-md font-arabic transition-all opacity-0 group-hover:opacity-100"
              style={{
                padding:    '3px 7px',
                fontSize:   11,
                color:      'var(--text-muted)',
                border:     '1px solid var(--border-subtle)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color       = '#8b5cf6';
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)';
                e.currentTarget.style.background  = 'rgba(139,92,246,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color       = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background  = 'transparent';
              }}
              title="إضافة تنويع لهذا الدرس"
            >
              ＋ تنويع
            </button>
          )}

          <button
            onClick={onEdit}
            className="flex items-center gap-1 rounded-md font-arabic transition-all opacity-0 group-hover:opacity-100"
            style={{
              padding:    '3px 8px',
              fontSize:   11,
              color:      'var(--text-secondary)',
              border:     '1px solid var(--border-subtle)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color       = 'var(--accent)';
              e.currentTarget.style.borderColor = 'rgba(212,137,30,0.3)';
              e.currentTarget.style.background  = 'rgba(212,137,30,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color       = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background  = 'transparent';
            }}
          >
            تحرير
            <span style={{ fontSize: 9, opacity: 0.6 }}>←</span>
          </button>
        </div>
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