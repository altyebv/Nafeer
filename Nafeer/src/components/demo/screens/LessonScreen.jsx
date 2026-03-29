'use client';
import BlockRenderer from '../blocks/BlockRenderer';
import { DEMO_LESSON } from '../demoData';

// ─────────────────────────────────────────────────────────────────────────────
// LessonScreen
// Renders the demo lesson using the BlockRenderer pipeline.
// Layout mirrors Basheer's lesson screen: header, progress bar, block stream.
// ─────────────────────────────────────────────────────────────────────────────

export default function LessonScreen() {
  const {
    subjectName,
    unitName,
    lessonTitle,
    blocks,
    totalSections,
    currentSection,
  } = DEMO_LESSON;

  const progress = Math.round((currentSection / totalSections) * 100);

  return (
    <div className="w-full">
      {/* Lesson header */}
      <div
        className="sticky top-0 z-10 px-4 pt-4 pb-3"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }}
        dir="rtl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              className="font-arabic text-base font-bold leading-snug"
              style={{ color: 'var(--text-primary)' }}
            >
              {lessonTitle}
            </h2>
            <p className="font-arabic text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {subjectName} · {unitName}
            </p>
          </div>
          {/* Subject chip */}
          <div
            className="flex-shrink-0 text-xs font-arabic px-2.5 py-1 rounded-full mt-0.5"
            style={{
              background: 'rgba(74,144,217,0.12)',
              border: '1px solid rgba(74,144,217,0.28)',
              color: '#4A90D9',
            }}
          >
            {subjectName}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ background: 'var(--border-subtle)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--accent)' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs font-arabic" style={{ color: 'var(--text-muted)' }}>
              {currentSection} / {totalSections} أقسام
            </span>
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Block stream */}
      <div className="py-2 pb-6">
        {blocks.map(block => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}
