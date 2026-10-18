import Link from 'next/link';
import { cx } from './cx';

// ─── PageHeader ───────────────────────────────────────────────────────────────
// The one header every editor, admin and flow page uses — merges the admin
// SectionHeader, EditorPage's header and the quiz bank's header card.
//
// breadcrumb   [{ label, href? }] — the last item is the current page
// status       a SaveStatus (or Badge) beside the actions
// actions      buttons; at most one `primary`
// children     sits under the title row: tabs, filters, stat chips
// sticky       pins it under the page's top edge while the body scrolls

export function PageHeader({ title, description, breadcrumb, status, actions, sticky = false, className, children }) {
  return (
    <header
      className={cx(
        'flex flex-col gap-4 pt-6 pb-0',
        sticky && 'sticky top-0 z-sticky bg-page',
        children ? 'border-b border-line' : 'pb-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1 min-w-0">
          {breadcrumb?.length > 0 && (
            <nav aria-label="مسار التنقل">
              <ol className="flex items-center gap-1.5 flex-wrap t-label text-fg-subtle">
                {breadcrumb.map((b, i) => {
                  const last = i === breadcrumb.length - 1;
                  return (
                    <li key={i} className="flex items-center gap-1.5">
                      {b.href && !last
                        ? <Link href={b.href} className="hover:text-fg transition-colors">{b.label}</Link>
                        : <span aria-current={last ? 'page' : undefined}>{b.label}</span>}
                      {!last && <span aria-hidden="true">›</span>}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
          <h1 className="t-h1 text-fg-strong">{title}</h1>
          {description && <p className="t-ui font-normal text-fg-muted max-w-prose">{description}</p>}
        </div>
        {(status || actions) && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {status}
            {actions}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}
