'use client';
import FormulaPreview from '@/components/editor/shared/FormulaPreview';

// ─────────────────────────────────────────────────────────────────────────────
// FormulaBlock
// A display formula, typeset by the same pipeline as the Android app and in the
// subject's notation (MathNotationContext). Invalid LaTeX falls back to the raw
// source.
// ─────────────────────────────────────────────────────────────────────────────

export function FormulaBlock({ block }) {
  return (
    <div
      className="mx-4 my-2 rounded-xl py-4 px-3 flex flex-col items-center gap-2 overflow-x-auto"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {block.caption && (
        <p className="font-arabic text-xs self-end" style={{ color: 'var(--text-muted)' }}>
          {block.caption}
        </p>
      )}

      <div style={{ color: 'var(--text-primary)' }}>
        <FormulaPreview latex={block.content || ''} />
      </div>
    </div>
  );
}
