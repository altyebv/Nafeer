'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './Button';
import { cx } from './cx';

// ─── ConfirmButton ────────────────────────────────────────────────────────────
// A destructive action that asks first, in a small popover under its trigger.
// Replaces DeleteButton's inline تأكيد / إلغاء, which reset itself after 3s —
// the review found the confirm vanishing before it could be clicked.
//
// This one stays open until the user answers: confirm, cancel, Escape, or a
// click outside (which counts as cancel). Focus starts on "cancel", the safe
// choice, and returns to the trigger afterwards.
//
//   <ConfirmButton title="حذف «الفكرة الأساسية»؟" description="…" onConfirm={remove}>
//     حذف القسم
//   </ConfirmButton>

export function ConfirmButton({
  title,
  description,
  confirmLabel = 'حذف',
  cancelLabel = 'إلغاء',
  onConfirm,
  tone = 'danger',
  variant = 'danger',
  size = 'sm',
  icon,
  label,
  align = 'start',
  children,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) close(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <Button
        ref={triggerRef}
        variant={variant}
        size={size}
        icon={icon}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      >
        {children}
      </Button>

      {open && (
        <div
          role="alertdialog"
          aria-labelledby={titleId}
          className={cx(
            'absolute top-full mt-2 z-popover w-[min(20rem,calc(100vw-2rem))] p-4',
            'flex flex-col gap-2.5 bg-overlay border border-line-strong rounded-card shadow-overlay',
            align === 'end' ? 'end-0' : 'start-0',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <p id={titleId} className="t-ui font-semibold text-fg-strong">{title}</p>
          {description && <p className="t-label font-normal text-fg-muted leading-relaxed">{description}</p>}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="primary"
              className={tone === 'danger' ? '!bg-danger hover:!opacity-90' : undefined}
              onClick={() => { close(); onConfirm?.(); }}
            >
              {confirmLabel}
            </Button>
            <Button ref={cancelRef} size="sm" variant="secondary" onClick={() => close()}>
              {cancelLabel}
            </Button>
          </div>
        </div>
      )}
    </span>
  );
}
