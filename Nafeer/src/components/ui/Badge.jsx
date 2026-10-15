import { cx } from './cx';

// ─── Badge ────────────────────────────────────────────────────────────────────
// Replaces StatusBadge, StatusChip and StatsChip. Status is never colour
// alone: a status tone carries a dot (or an icon) beside its word, so it still
// reads for colour-blind users and in greyscale.
//
// tone   neutral · accent · success · warn · danger · info · special

const TONES = {
  neutral: 'bg-hover text-fg-muted border-line-strong',
  accent:  'bg-accent-wash text-fg-accent border-line-accent',
  success: 'bg-success-surface text-success border-success-border',
  warn:    'bg-warn-surface text-warn border-warn-border',
  danger:  'bg-danger-surface text-danger border-danger-border',
  info:    'bg-info-surface text-info border-info-border',
  special: 'bg-special-surface text-special border-special-border',
};

const STATUS = new Set(['success', 'warn', 'danger', 'info']);

export function Badge({ tone = 'neutral', dot, icon: Icon, size = 'md', className, children }) {
  // Status tones get a dot by default; pass dot={false} to drop it (only when
  // an icon or the context already says the same thing).
  const showDot = !Icon && (dot ?? STATUS.has(tone));
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap border rounded-chip font-ui',
        size === 'sm' ? 'h-5 px-1.5 t-caption' : 'h-6 px-2.5 t-label',
        TONES[tone],
        className,
      )}
    >
      {showDot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />}
      {Icon && <Icon size={12} strokeWidth={2} className="shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
