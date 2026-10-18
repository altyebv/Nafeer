import { cx } from './cx';

// ─── Card ─────────────────────────────────────────────────────────────────────
// A raised surface. Replaces `glass`, `card-hover` and the ad-hoc
// `bg-ink-900 border border-ink-800 rounded-xl p-5` repeated across pages.
//
// tone      raised (default) · sunken (a well inside a card) · accent (the one
//           highlighted card on a page, e.g. "your next step")
// padding   none · sm · md · lg
// title / actions   optional header row; pass neither for a plain surface.

const TONES = {
  raised: 'bg-raised border-line',
  sunken: 'bg-sunken border-line',
  accent: 'bg-raised border-line-accent',
};

const PADDING = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6 sm:p-7' };

export function Card({
  as: Comp = 'section',
  tone = 'raised',
  padding = 'md',
  interactive = false,
  title,
  actions,
  footer,
  className,
  children,
  ...rest
}) {
  return (
    <Comp
      className={cx(
        'border rounded-card',
        TONES[tone],
        PADDING[padding],
        interactive && 'transition-colors duration-fast ease-out-soft hover:border-line-strong cursor-pointer',
        className,
      )}
      {...rest}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="t-title text-fg-strong">{title}</h2>}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
      {footer && <div className="mt-4 pt-4 border-t border-line">{footer}</div>}
    </Comp>
  );
}
