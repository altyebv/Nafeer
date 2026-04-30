'use client';
import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

/**
 * Two-stage delete button — replaces native confirm() dialogs.
 * First click → shows تأكيد / إلغاء inline.
 * Second click (تأكيد) → calls onDelete.
 * Auto-resets after 3s if the user does nothing.
 *
 * Props:
 *   onDelete   — function called on confirmed delete
 *   label      — idle button label (default: null; renders trash icon)
 *   className  — extra classes on the idle button
 *   size       — 'sm' | 'md' (default 'sm')
 */
export default function DeleteButton({ onDelete, label = null, className = '', size = 'sm' }) {
  const [pending, setPending] = useState(false);

  // Auto-cancel if the user walks away
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setPending(false), 3000);
    return () => clearTimeout(t);
  }, [pending]);

  if (pending) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); setPending(false); }}
          className="text-xs text-red-400 hover:text-red-300 transition-colors font-arabic px-1.5 py-0.5 rounded bg-red-900/20 border border-red-800/50"
        >
          تأكيد
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setPending(false); }}
          className="text-xs text-ink-600 hover:text-ink-400 transition-colors font-arabic"
        >
          إلغاء
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setPending(true); }}
      className={`transition-colors ${size === 'sm' ? 'p-1 text-sm' : 'p-1.5 text-base'} text-ink-600 hover:text-red-500 ${className}`}
      aria-label="حذف"
    >
      {label || <Trash2 size={size === 'sm' ? 15 : 17} strokeWidth={2} />}
    </button>
  );
}
