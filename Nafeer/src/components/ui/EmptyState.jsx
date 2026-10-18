import { Inbox } from 'lucide-react';
import { cx } from './cx';

// ─── EmptyState ───────────────────────────────────────────────────────────────
// What a page or panel shows before it has content. Always says what goes
// here and, when the viewer can fix it, offers the one action that does.
// Replaces the admin EmptyState and three editor variants.
//
// variant   dashed (a drop-zone feel, inside a page) · plain (inside a card)

export function EmptyState({ icon: Icon = Inbox, title, description, action, variant = 'dashed', className }) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center text-center gap-2 px-6 py-12',
        variant === 'dashed' && 'border border-dashed border-line-strong rounded-card',
        className,
      )}
    >
      <Icon size={28} strokeWidth={1.5} className="text-fg-subtle mb-1" aria-hidden="true" />
      <p className="t-title text-fg-strong">{title}</p>
      {description && <p className="t-ui font-normal text-fg-muted max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
