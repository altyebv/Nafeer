import { forwardRef } from 'react';
import { cx } from '@/components/ui';

// ─── Landing section shell ────────────────────────────────────────────────────
// One rhythm and one set of widths for every landing section
// (docs/design-system.md §4): the `section` padding (py-20 sm:py-28), the
// site gutters, and a width picked by intent instead of a per-section max-w.

const WIDTHS = {
  prose:   'max-w-3xl',  // ~720px — reading, one column
  content: 'max-w-5xl',  // 1024px — mixed content
  wide:    'max-w-7xl',  // 1280px — grids
};

export const LandingSection = forwardRef(function LandingSection(
  { id, width = 'content', tone = 'page', className, innerClassName, decoration, children, ...rest },
  ref,
) {
  return (
    <section
      ref={ref}
      id={id}
      className={cx(
        'relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8',
        tone === 'sunken' ? 'bg-sunken' : 'bg-page',
        className,
      )}
      {...rest}
    >
      {decoration}
      <div className={cx('relative mx-auto', WIDTHS[width], innerClassName)}>{children}</div>
    </section>
  );
});
