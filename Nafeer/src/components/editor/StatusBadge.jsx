// ─── StatusBadge ──────────────────────────────────────────────────────────────
// Displays the Atlas versioning status (draft / review / approved / archived).
// Separate from the local completion dot in LessonStatus.js.

const BADGE_CONFIG = {
  draft:    { label: 'مسودة',      bg: 'bg-ink-800',        text: 'text-ink-400',     border: 'border-ink-700'        },
  review:   { label: 'للمراجعة',   bg: 'bg-amber-900/40',   text: 'text-amber-400',   border: 'border-amber-700/50'   },
  approved: { label: 'معتمد',      bg: 'bg-emerald-900/40', text: 'text-emerald-400', border: 'border-emerald-700/50' },
  archived: { label: 'أرشيف',      bg: 'bg-ink-800',        text: 'text-ink-500',     border: 'border-ink-700'        },
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const cfg = BADGE_CONFIG[status] || BADGE_CONFIG.draft;

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-arabic leading-none ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}