'use client';

// ─────────────────────────────────────────────────────────────────────────────
// HighlightBox
// Mirrors Basheer's HighlightBox — supports DEFINITION, WARNING, TIP, NOTE.
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_CONFIG = {
  DEFINITION: {
    bg:     'rgba(74,144,217,0.10)',
    border: 'rgba(74,144,217,0.28)',
    color:  '#4A90D9',
    label:  'تعريف',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  WARNING: {
    bg:     'rgba(231,76,60,0.10)',
    border: 'rgba(231,76,60,0.28)',
    color:  '#E74C3C',
    label:  'تنبيه',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  TIP: {
    bg:     'rgba(155,89,182,0.10)',
    border: 'rgba(155,89,182,0.28)',
    color:  '#9B59B6',
    label:  'نصيحة',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
  },
  NOTE: {
    bg:     'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.12)',
    color:  'var(--text-muted)',
    label:  'ملاحظة',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
  },
};

export function HighlightBox({ block }) {
  const cfg = STYLE_CONFIG[block.style] || STYLE_CONFIG.NOTE;

  return (
    <div
      className="mx-4 my-2 rounded-xl p-4"
      dir="rtl"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2" style={{ color: cfg.color }}>
        <span style={{ color: cfg.color }}>{cfg.icon}</span>
        <span className="font-arabic text-xs font-bold">{block.title || cfg.label}</span>
      </div>
      {/* Content */}
      <p
        className="font-arabic text-sm leading-loose"
        style={{ color: 'var(--text-secondary)' }}
      >
        {block.content}
      </p>
    </div>
  );
}
