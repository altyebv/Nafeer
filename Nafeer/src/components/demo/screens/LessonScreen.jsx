'use client';
import BlockRenderer from '../blocks/BlockRenderer';
import { DEMO_LESSON } from '../demoData';

export default function LessonScreen() {
  const { subjectName, unitName, lessonTitle, blocks, totalSections, currentSection } = DEMO_LESSON;
  const progress = Math.round((currentSection / totalSections) * 100);

  return (
    <div className="w-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 pt-3 pb-2.5"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }}
        dir="rtl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-arabic text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {lessonTitle}
            </h2>
            <p className="font-arabic text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {subjectName} · {unitName}
            </p>
          </div>
          <div className="flex-shrink-0 text-xs font-arabic px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(74,144,217,0.12)', border: '1px solid rgba(74,144,217,0.28)', color: '#4A90D9' }}>
            {subjectName}
          </div>
        </div>
        {/* Progress */}
        <div className="mt-2">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--accent)' }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-arabic text-xs" style={{ color: 'var(--text-muted)' }}>
              {currentSection} / {totalSections} أقسام
            </span>
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{progress}%</span>
          </div>
        </div>
      </div>

      {/* Block stream */}
      <div className="py-1.5 pb-6">
        {blocks.map(block => <BlockRenderer key={block.id} block={block} />)}
      </div>
    </div>
  );
}
