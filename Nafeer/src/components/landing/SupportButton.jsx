'use client';
import { useState, useEffect } from 'react';
import { Check, Hand } from 'lucide-react';
import { formatNumber } from '@/lib/format';

const STORAGE_KEY = 'nafeer-supported';

export default function SupportButton() {
  const [count,      setCount]      = useState(null);   // null = loading
  const [supported,  setSupported]  = useState(false);
  const [animating,  setAnimating]  = useState(false);

  // Load count + check if this browser already voted
  useEffect(() => {
    fetch('/api/support')
      .then(r => r.json())
      .then(d => { if (d.ok) setCount(d.count); })
      .catch(() => {});

    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setSupported(true);
    } catch {}
  }, []);

  const handleSupport = async () => {
    if (supported || animating) return;

    setAnimating(true);

    // Optimistic update
    setCount(c => (c ?? 0) + 1);
    setSupported(true);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}

    try {
      const res  = await fetch('/api/support', { method: 'POST' });
      const data = await res.json();
      if (data.ok) setCount(data.count); // sync with server truth
    } catch {}

    setTimeout(() => setAnimating(false), 600);
  };

  const displayCount = count === null ? '...' : formatNumber(count);

  return (
    <div className="flex flex-col items-center gap-4 py-7 px-6 rounded-card bg-sunken border border-line">
      <p className="t-body text-center leading-loose text-fg-muted">كم طالباً يريد بشير؟</p>

      <p className="flex items-baseline gap-2" aria-live="polite">
        <span className="t-num font-ui text-4xl font-bold text-fg-accent">{displayCount}</span>
        <span className="t-label font-normal text-fg-muted">طالب يدعم المشروع</span>
      </p>

      {!supported ? (
        <button
          type="button"
          onClick={handleSupport}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-control t-ui font-bold border border-info-border bg-info-surface text-info transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-info motion-reduce:transform-none"
        >
          <Hand size={17} strokeWidth={2} aria-hidden="true"
            className={`transition-transform duration-300 ${animating ? 'scale-125' : 'scale-100'}`} />
          <span>أنا أيضاً أريده</span>
        </button>
      ) : (
        <p role="status" className="inline-flex items-center gap-2 px-7 py-3 rounded-control t-ui border border-success-border bg-success-surface text-success">
          <Check size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>صوتك محفوظ — شكراً لك</span>
        </p>
      )}

      <p className="t-caption text-center leading-relaxed max-w-xs text-fg-subtle">
        كل صوت يثبت للمساهمين أن جهودهم لها من ينتظرها
      </p>
    </div>
  );
}
