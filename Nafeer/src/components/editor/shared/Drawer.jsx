'use client';
import { useEffect } from 'react';

/**
 * Drawer
 * ─────────────────────────────────────────────────────────────────────────────
 * Side sheet on a wide screen, bottom sheet on a phone.
 *
 * The notes and history drawers were both `fixed top-0 left-0 h-full w-full
 * max-w-sm` — a full-height side panel. On a phone that covers the entire
 * screen with no visible way back except a 28px close button in the corner,
 * and it fights the on-screen keyboard when the reply field is focused. A
 * bottom sheet capped at 85dvh keeps the page visible behind it, puts the
 * dismiss gesture where the thumb already is, and leaves room for the keyboard.
 *
 * The switch is pure CSS at the `sm` breakpoint, so there is no hydration
 * flash and no JS measurement.
 */
export default function Drawer({ onClose, labelledBy, children }) {
  // Escape to dismiss, and keep the page behind from scrolling underneath.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={[
          'fixed z-50 flex flex-col bg-ink-900 shadow-2xl',
          // phone: bottom sheet
          'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t border-ink-800',
          // sm+: side sheet, as before
          'sm:inset-x-auto sm:top-0 sm:left-0 sm:bottom-auto sm:h-full sm:max-h-none',
          'sm:w-full sm:max-w-sm sm:rounded-none sm:border-t-0 sm:border-r',
        ].join(' ')}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Grab handle — bottom-sheet affordance, hidden once it is a side panel */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-ink-700" />
        </div>

        {children}
      </div>
    </>
  );
}
