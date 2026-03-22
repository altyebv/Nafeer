'use client';
import { useRef } from 'react';

export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  return (
    <div
      ref={ref}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className="bg-ink-900 border border-ink-700/60 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-sand-300 font-arabic">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink-600 hover:text-ink-300 transition-colors text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-ink-800"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}