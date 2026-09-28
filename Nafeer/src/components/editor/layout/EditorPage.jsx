'use client';

/**
 * EditorPage
 * ─────────────────────────────────────────────────────────────────────────────
 * The one container every editor page sits in.
 *
 * Before this, each page invented its own: the dashboard was `max-w-4xl
 * mx-auto`, the quiz bank `max-w-6xl mx-auto`, lessons plain `w-full`, and
 * concepts / feed / media had no constraint at all — so at 1440px the
 * dashboard was a narrow column while the lessons list ran edge to edge.
 *
 * Pages now declare intent instead of a number:
 *
 *   prose    720px   a single thing being read or edited — forms, one record
 *   content  1024px  mixed content with a sidebar-ish rhythm
 *   wide     1280px  grids and lists that benefit from the extra columns
 *   full     none    the page manages its own width (the lesson editor)
 *
 * Gutters scale with the breakpoint and are the only place page padding is
 * defined, so spacing stays consistent no matter which width a page picks.
 */

const WIDTHS = {
  prose:   'max-w-3xl',
  content: 'max-w-5xl',
  wide:    'max-w-7xl',
  full:    'max-w-none',
};

export default function EditorPage({
  width = 'content',
  title,
  description,
  actions,
  /** Drop the default gutters — for pages that paint their own edge-to-edge chrome. */
  bleed = false,
  className = '',
  children,
}) {
  const maxWidth = WIDTHS[width] ?? WIDTHS.content;
  const gutters  = bleed ? '' : 'px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8';

  return (
    <div className={`${maxWidth} mx-auto w-full ${gutters} ${className}`.trim()}>
      {(title || actions) && (
        <header className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className="font-arabic text-xl font-bold leading-tight text-ink-200 sm:text-2xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1.5 font-arabic text-sm leading-relaxed text-ink-500">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </div>
  );
}
