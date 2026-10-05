'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// was modal (lowercase)
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);

  // Escape closes; the page behind stops scrolling while the modal is open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-ink-900 border border-ink-700/60 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4 shrink-0">
          <h2 className="text-lg font-bold text-sand-300 font-arabic">{title}</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="text-ink-500 hover:text-ink-200 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
