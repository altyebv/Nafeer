'use client';
import { useEffect, useRef } from 'react';

// Shared behaviour for anything that floats over the page (Dialog, Drawer):
// Escape closes it, the page behind stops scrolling, focus moves inside on
// open and returns to whatever opened it on close.
export function useOverlay({ open = true, onClose, panelRef }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // First form field (so a dialog opens ready to type), else the first
    // control — usually close — else the panel itself.
    const panel = panelRef?.current;
    const target =
      panel?.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled])') ||
      panel?.querySelector('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
    (target || panel)?.focus?.();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, [open, panelRef]);
}
