'use client';
import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ExampleBlock — Interactive
// Directly mirrors Basheer's InteractiveExampleBlock:
//   - Steps are revealed one at a time, accumulating downward
//   - Progress dots and pill track position
//   - Arabic numerals (Eastern Arabic)
//   - "اكتمل المثال" badge on completion
// ─────────────────────────────────────────────────────────────────────────────

function toArabicNumerals(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

export function ExampleBlock({ block }) {
  const { steps = [], caption = 'مثال', interactive = false, content } = block;

  if (!interactive || steps.length === 0) {
    return <StaticExampleBlock title={caption} content={content} />;
  }

  return <InteractiveExampleBlock title={caption} steps={steps} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static variant
// ─────────────────────────────────────────────────────────────────────────────

function StaticExampleBlock({ title, content }) {
  return (
    <div
      className="mx-4 my-2 rounded-xl p-4"
      dir="rtl"
      style={{
        background: 'rgba(147,112,219,0.08)',
        border: '1px solid rgba(147,112,219,0.22)',
      }}
    >
      <ExampleHeader title={title} />
      <p className="font-arabic text-sm leading-loose mt-2" style={{ color: 'var(--text-secondary)' }}>
        {content}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive variant
// ─────────────────────────────────────────────────────────────────────────────

function InteractiveExampleBlock({ title, steps }) {
  const [revealed, setRevealed] = useState(1);
  const total = steps.length;
  const allRevealed = revealed >= total;

  return (
    <div
      className="mx-4 my-2 rounded-xl p-4 transition-all duration-300"
      dir="rtl"
      style={{
        background: 'rgba(147,112,219,0.08)',
        border: `1px solid ${allRevealed ? 'rgba(147,112,219,0.45)' : 'rgba(147,112,219,0.22)'}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <ExampleHeader title={title} />
        <StepProgressPill current={revealed} total={total} />
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 mb-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-0.5 rounded-full transition-all duration-300"
            style={{ background: i < revealed ? '#9B59B6' : 'rgba(155,89,182,0.2)' }}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-3 mb-4">
        {steps.map((stepText, i) => (
          <StepRow
            key={i}
            index={i}
            text={stepText}
            visible={i < revealed}
            isLatest={i === revealed - 1}
          />
        ))}
      </div>

      {/* CTA */}
      {!allRevealed ? (
        <button
          onClick={() => setRevealed(r => r + 1)}
          className="w-full rounded-lg py-2.5 text-sm font-arabic font-medium
                     transition-all duration-150 active:scale-98 flex items-center justify-center gap-2"
          style={{
            border: '1px solid rgba(155,89,182,0.4)',
            color: '#9B59B6',
            background: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          الخطوة {toArabicNumerals(revealed + 1)} من {toArabicNumerals(total)}
        </button>
      ) : (
        <div
          className="w-full rounded-lg py-2.5 text-center text-sm font-arabic font-medium"
          style={{ background: 'rgba(155,89,182,0.12)', color: '#9B59B6' }}
        >
          ✓ اكتمل المثال
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ExampleHeader({ title }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="1.8">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
      <span className="font-arabic text-xs font-bold" style={{ color: '#9B59B6' }}>
        {title}
      </span>
    </div>
  );
}

function StepProgressPill({ current, total }) {
  return (
    <div
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{
        background: 'rgba(155,89,182,0.12)',
        border: '1px solid rgba(155,89,182,0.25)',
        color: '#9B59B6',
      }}
    >
      <span>{toArabicNumerals(current)}</span>
      <span style={{ opacity: 0.5, fontWeight: 400 }}>/</span>
      <span style={{ opacity: 0.7 }}>{toArabicNumerals(total)}</span>
    </div>
  );
}

function StepRow({ index, text, visible, isLatest }) {
  if (!visible) return null;

  return (
    <div
      className="flex items-start gap-3"
      style={{
        opacity: isLatest ? 1 : 0.6,
        animation: isLatest ? 'demoStepIn 0.3s ease forwards' : 'none',
      }}
    >
      {/* Step number badge */}
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
        style={{
          background: isLatest ? '#9B59B6' : 'rgba(155,89,182,0.18)',
          color: isLatest ? '#fff' : 'rgba(155,89,182,0.7)',
        }}
      >
        {toArabicNumerals(index + 1)}
      </div>
      <p className="font-arabic text-sm leading-loose flex-1" style={{ color: 'var(--text-secondary)' }}>
        {text}
      </p>
    </div>
  );
}
