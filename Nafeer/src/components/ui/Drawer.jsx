'use client';
import { useRef } from 'react';
import { useOverlay } from './useOverlay';

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
 *
 * Moved here from components/editor/shared in DS1 and rebuilt on the role
 * tokens; the old path re-exports it.
 */
export default function Drawer({ onClose, labelledBy, children }) {
  const panelRef = useRef(null);
  useOverlay({ onClose, panelRef });

  return (
    <>
      <div className="fixed inset-0 z-modal bg-scrim backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={[
          'fixed z-modal flex flex-col bg-overlay shadow-overlay',
          // phone: bottom sheet
          'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-panel border-t border-line-strong',
          // sm+: side sheet
          'sm:inset-x-auto sm:top-0 sm:left-0 sm:bottom-auto sm:h-full sm:max-h-none',
          'sm:w-full sm:max-w-sm sm:rounded-none sm:border-t-0 sm:border-r',
          'pb-[env(safe-area-inset-bottom,0px)]',
        ].join(' ')}
      >
        {/* Grab handle — bottom-sheet affordance, hidden once it is a side panel */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-line-strong" />
        </div>

        {children}
      </div>
    </>
  );
}

export { Drawer };
