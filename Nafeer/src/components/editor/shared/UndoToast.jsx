'use client';
import { useEffect } from 'react';
import { Undo2, X } from 'lucide-react';
import { useUndoStore } from '@/store/undoStore';

// ─── UndoToast ────────────────────────────────────────────────────────────────
// The «تراجع» bar for deletes held by undoStore. Sits above the phone bottom
// bar; Ctrl/⌘+Z undoes the latest one. Pending deletes are sent when the page
// is left (unmount or tab close).
export default function UndoToast() {
  const pending = useUndoStore((s) => s.pending);
  const undo = useUndoStore((s) => s.undo);
  const commit = useUndoStore((s) => s.commit);
  const flush = useUndoStore((s) => s.flush);
  const latest = pending[pending.length - 1];

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || e.shiftKey) return;
      // Inside a text field Ctrl+Z belongs to the text.
      if (e.target.closest?.('input, textarea, [contenteditable="true"]')) return;
      const last = useUndoStore.getState().pending.at(-1);
      if (last) { e.preventDefault(); useUndoStore.getState().undo(last.key); }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  if (!latest) return null;
  return (
    <div className="fixed z-toast bottom-20 sm:bottom-6 inset-x-0 px-4 flex justify-center pointer-events-none">
    <div role="status" aria-live="polite"
      className="pointer-events-auto max-w-full flex items-center gap-3 px-4 h-12 rounded-card bg-overlay border border-line-strong shadow-overlay">
      <span className="t-label text-fg truncate">حُذف {latest.label}{pending.length > 1 ? ` (+${pending.length - 1})` : ''}</span>
      <button type="button" onClick={() => undo(latest.key)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-control t-label font-semibold text-fg-accent hover:bg-hover touch-target">
        <Undo2 size={15} aria-hidden="true" /> تراجع
      </button>
      <button type="button" onClick={() => commit(latest.key)} aria-label="إغلاق"
        className="w-8 h-8 inline-flex items-center justify-center rounded-control text-fg-subtle hover:bg-hover touch-target">
        <X size={14} />
      </button>
    </div>
    </div>
  );
}
