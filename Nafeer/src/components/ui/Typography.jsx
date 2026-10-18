import { cx } from './cx';

// ─── Eyebrow / SectionTitle ───────────────────────────────────────────────────
// The heading pair the landing and flow pages repeat in every section. The
// eyebrow replaces `font-mono tracking-widest`, which pulled Arabic letters
// apart; it is plain t-eyebrow text, no tracking.

export function Eyebrow({ as: Comp = 'span', className, children }) {
  return <Comp className={cx('t-eyebrow', className)}>{children}</Comp>;
}

export function SectionTitle({ eyebrow, title, description, align = 'start', as: Heading = 'h2', className }) {
  return (
    <div className={cx('flex flex-col gap-2', align === 'center' && 'items-center text-center', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading className="t-h2 text-fg-strong">{title}</Heading>
      {description && <p className="t-body text-fg-muted max-w-prose">{description}</p>}
    </div>
  );
}
