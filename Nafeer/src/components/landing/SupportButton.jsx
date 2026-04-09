'use client';
import { useState, useEffect } from 'react';

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

  const displayCount = count === null ? '...' : count.toLocaleString('ar-EG');

  return (
    <div
      className="flex flex-col items-center gap-4 py-7 px-6 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Headline */}
      <p className="text-sm font-arabic text-center leading-loose" style={{ color: 'var(--text-muted)' }}>
        كم طالباً يريد بشير؟
      </p>

      {/* Counter */}
      <div className="flex items-baseline gap-2">
        <span
          className="text-4xl font-bold font-mono tabular-nums transition-all duration-300"
          style={{ color: 'var(--accent)' }}
        >
          {displayCount}
        </span>
        <span className="text-sm font-arabic" style={{ color: 'var(--text-muted)' }}>
          طالب يدعم المشروع
        </span>
      </div>

      {/* Button */}
      {!supported ? (
        <button
          onClick={handleSupport}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm transition-all duration-300"
          style={{
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#60a5fa',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.22)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.55)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span
            className="text-base transition-transform duration-300"
            style={{ display: 'inline-block', transform: animating ? 'scale(1.4)' : 'scale(1)' }}
          >
            🙋
          </span>
          <span>أنا أيضاً أريده</span>
        </button>
      ) : (
        <div
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-arabic"
          style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.25)',
            color: '#4ade80',
          }}
        >
          <span>✓</span>
          <span>صوتك محفوظ — شكراً لك</span>
        </div>
      )}

      {/* Encouraging line */}
      <p
        className="text-xs font-arabic text-center leading-relaxed max-w-xs"
        style={{ color: 'var(--text-muted)', opacity: 0.7 }}
      >
        كل صوت يثبت للمساهمين أن جهودهم لها من ينتظرها
      </p>
    </div>
  );
}
