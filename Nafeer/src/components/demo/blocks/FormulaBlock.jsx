'use client';
import { useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// FormulaBlock
// Renders LaTeX using KaTeX. Assumes katex is installed (used in Nafeer editor).
// Falls back to styled monospace if katex throws.
// ─────────────────────────────────────────────────────────────────────────────

export function FormulaBlock({ block }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    setError(false);

    import('katex')
      .then((katex) => {
        if (!containerRef.current) return;
        katex.default.render(block.content, containerRef.current, {
          throwOnError: false,
          displayMode: true,
          output: 'html',
        });
      })
      .catch(() => setError(true));
  }, [block.content]);

  return (
    <div
      className="mx-4 my-2 rounded-xl py-4 px-3 flex flex-col items-center gap-2"
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

      {error ? (
        /* Fallback: styled monospace if KaTeX import fails */
        <code
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          {block.content}
        </code>
      ) : (
        <div
          ref={containerRef}
          className="katex-display-block"
          style={{ color: 'var(--text-primary)', direction: 'ltr' }}
        />
      )}
    </div>
  );
}
