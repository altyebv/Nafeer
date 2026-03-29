'use client';

// ─────────────────────────────────────────────────────────────────────────────
// HeadingBlock
// Mirrors Basheer's HeadingBlock — level 1 gets an accent underline.
// ─────────────────────────────────────────────────────────────────────────────

export function HeadingBlock({ block }) {
  const { level = 2, content } = block;

  const sizeClass = {
    1: 'text-2xl sm:text-3xl',
    2: 'text-xl sm:text-2xl',
    3: 'text-lg sm:text-xl',
    4: 'text-base sm:text-lg',
  }[level] || 'text-xl';

  const topPadding = level === 1 ? 'pt-6' : level === 2 ? 'pt-5' : 'pt-4';

  return (
    <div className={`px-4 pb-2 ${topPadding}`} dir="rtl">
      <p
        className={`font-arabic font-bold leading-snug ${sizeClass}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {content}
      </p>
      {level === 1 && (
        <div
          className="mt-2 h-0.5 w-10 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TextBlock
// Standard body text, RTL, Arabic line-height.
// ─────────────────────────────────────────────────────────────────────────────

export function TextBlock({ block }) {
  return (
    <div className="px-4 py-2" dir="rtl">
      <p
        className="font-arabic text-sm sm:text-base leading-loose"
        style={{ color: 'var(--text-secondary)' }}
      >
        {block.content}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TipBlock
// Mirrors Basheer's TipBlock — tertiary container, lightbulb icon.
// ─────────────────────────────────────────────────────────────────────────────

export function TipBlock({ block }) {
  return (
    <div className="mx-4 my-2 rounded-xl p-4 flex gap-3" dir="rtl"
      style={{
        background: 'rgba(154,120,72,0.12)',
        border: '1px solid rgba(154,120,72,0.25)',
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a7848" strokeWidth="1.8">
          <path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 6H9c-1.5-1.5-3-3.5-3-6a6 6 0 0 1 6-6z"/>
          <path d="M9 17v-1a3 3 0 0 1 6 0v1"/>
        </svg>
      </div>
      <div>
        <p className="font-arabic text-xs font-bold mb-1" style={{ color: '#9a7848' }}>
          نصيحة
        </p>
        <p className="font-arabic text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>
          {block.content}
        </p>
      </div>
    </div>
  );
}
