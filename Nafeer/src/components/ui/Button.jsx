'use client';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from './cx';

// ─── Button / IconButton ──────────────────────────────────────────────────────
// docs/design-system.md §8. One `primary` per view; everything else is
// `secondary`, `ghost` or `danger`.
//
// Renders a <button> by default. Pass `as` for a link (`as={Link} href="…"`)
// so navigation stays a real anchor instead of a button with an onClick.

const VARIANTS = {
  primary:   'bg-accent text-fg-on-accent hover:bg-accent-hover border border-transparent font-semibold',
  secondary: 'bg-transparent text-fg border border-line-strong hover:bg-hover',
  ghost:     'bg-transparent text-fg-muted border border-transparent hover:bg-hover hover:text-fg',
  danger:    'bg-danger-surface text-danger border border-danger-border hover:bg-hover',
};

// `touch-target` lifts the compact sizes to 44px on touch screens only.
const SIZES = {
  sm: 'h-8 px-3 gap-1.5 t-label touch-target',
  md: 'h-10 px-4 gap-2 t-ui',
  lg: 'h-12 px-5 gap-2 text-base font-ui font-semibold',
};

const ICON_SIZE = { sm: 14, md: 16, lg: 18 };

const DISABLED =
  'disabled:cursor-not-allowed disabled:bg-hover disabled:text-fg-subtle disabled:border-transparent aria-disabled:cursor-not-allowed aria-disabled:opacity-60';

export const Button = forwardRef(function Button(
  {
    as: Comp = 'button',
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    iconEnd: IconEnd,
    loading = false,
    block = false,
    disabled,
    className,
    children,
    type,
    ...rest
  },
  ref,
) {
  const isButton = Comp === 'button';
  const iconPx = ICON_SIZE[size];
  return (
    <Comp
      ref={ref}
      {...(isButton && { type: type || 'button', disabled: disabled || loading })}
      {...(!isButton && (disabled || loading) && { 'aria-disabled': true })}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center whitespace-nowrap rounded-control font-ui',
        'transition-colors duration-fast ease-out-soft select-none',
        VARIANTS[variant],
        SIZES[size],
        DISABLED,
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading
        ? <Loader2 size={iconPx} strokeWidth={1.75} className="animate-spin shrink-0" aria-hidden="true" />
        : Icon && <Icon size={iconPx} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />}
      {children}
      {IconEnd && !loading && <IconEnd size={iconPx} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />}
    </Comp>
  );
});

const ICON_BOX = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };

/**
 * Icon-only control. `label` is required: it is both the accessible name and
 * the tooltip, so an icon is never the only clue to what a button does.
 */
export const IconButton = forwardRef(function IconButton(
  { as: Comp = 'button', icon: Icon, label, size = 'md', variant = 'ghost', className, type, ...rest },
  ref,
) {
  if (process.env.NODE_ENV !== 'production' && !label) {
    console.warn('IconButton: `label` is required — it is the accessible name and tooltip.');
  }
  const isButton = Comp === 'button';
  return (
    <Comp
      ref={ref}
      {...(isButton && { type: type || 'button' })}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex items-center justify-center shrink-0 rounded-control touch-target',
        'transition-colors duration-fast ease-out-soft',
        VARIANTS[variant],
        ICON_BOX[size],
        DISABLED,
        className,
      )}
      {...rest}
    >
      <Icon size={ICON_SIZE[size]} strokeWidth={1.75} aria-hidden="true" />
    </Comp>
  );
});
