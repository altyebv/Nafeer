'use client';
import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { useOverlay } from './useOverlay';
import { cx } from './cx';

// ─── Dialog ───────────────────────────────────────────────────────────────────
// A centred modal. Replaces the editor's Modal and the admin modal. Portalled
// to <body> so no ancestor's overflow or stacking context can clip it.
//
// footer   the action row — put the primary action last in source order so it
//          lands at the inline end (left, in Arabic).

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Dialog({ open, onClose, title, description, size = 'md', footer, children }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  useOverlay({ open, onClose, panelRef });

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cx(
          'relative w-full max-h-[90dvh] flex flex-col bg-overlay border border-line-strong rounded-panel shadow-overlay',
          SIZES[size],
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h2 id={titleId} className="t-title text-fg-strong">{title}</h2>
            {description && <p id={descId} className="t-ui font-normal text-fg-muted">{description}</p>}
          </div>
          <IconButton icon={X} label="إغلاق" size="sm" onClick={onClose} />
        </div>
        <div className="px-5 pb-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
