'use client';
import { Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui';

/**
 * Delete with a confirm — now a thin wrapper over the shared ConfirmButton.
 *
 * It used to show تأكيد / إلغاء inline and reset itself after 3 seconds, so
 * the confirm could vanish before it was clicked (the DS review), and its
 * 23px target was too small on a phone. ConfirmButton stays open until the
 * writer answers and is 44px on touch screens.
 *
 * Props:
 *   onDelete   — called on confirmed delete
 *   label      — visible label (default: trash icon only)
 *   title      — the question in the popover (default: «حذف هذا؟»)
 *   size       — 'sm' | 'md' (default 'sm')
 *   compact    — accepted for old call sites; the icon button is compact already
 */
export default function DeleteButton({ onDelete, label = null, title = 'حذف هذا؟', size = 'sm', className, compact: _compact }) {
  return (
    <span className={className}>
      <ConfirmButton
        variant="ghost"
        size={size === 'md' ? 'md' : 'sm'}
        icon={label ? undefined : Trash2}
        label={label ? undefined : 'حذف'}
        title={title}
        description="لا يمكن التراجع بعد الحفظ."
        confirmLabel="حذف"
        align="end"
        onConfirm={onDelete}
      >
        {label}
      </ConfirmButton>
    </span>
  );
}
