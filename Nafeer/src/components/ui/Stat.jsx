import { formatNumber } from '@/lib/format';
import { cx } from './cx';

// ─── Stat ─────────────────────────────────────────────────────────────────────
// One number with its label — dashboard, profile and landing stat cards.
// Numbers go through format.js (Western digits) and use tabular figures, not a
// monospace face, so columns of stats line up.
//
// value      number (formatted) or a preformatted string ("4/58")
// hintTone   subtle (default) · success · warn · danger

const HINT = {
  subtle:  'text-fg-subtle',
  success: 'text-success',
  warn:    'text-warn',
  danger:  'text-danger',
};

export function Stat({ value, label, hint, hintTone = 'subtle', icon: Icon, tone = 'sunken', className }) {
  const shown = typeof value === 'number' ? formatNumber(value) : value;
  return (
    <div
      className={cx(
        'flex flex-col gap-0.5 rounded-card border border-line p-4',
        tone === 'sunken' ? 'bg-sunken' : 'bg-raised',
        className,
      )}
    >
      {Icon && <Icon size={16} strokeWidth={1.75} className="text-fg-accent mb-1" aria-hidden="true" />}
      <span className="t-num font-ui text-3xl font-bold leading-tight text-fg-strong">{shown}</span>
      <span className="t-label text-fg-muted">{label}</span>
      {hint && <span className={cx('t-caption', HINT[hintTone])}>{hint}</span>}
    </div>
  );
}
