'use client';
import { useState } from 'react';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

export function ExampleBlock({ block }) {
  const { steps = [], caption = 'مثال', interactive = false, content } = block;
  if (!interactive || !steps.length) {
    return (
      <div className="mx-4 my-2 rounded-xl p-3" dir="rtl"
        style={{ background: 'rgba(147,112,219,0.08)', border: '1px solid rgba(147,112,219,0.22)' }}>
        <Header title={caption} />
        <p className="font-arabic text-xs leading-loose mt-1.5" style={{ color: 'var(--text-secondary)' }}>{content}</p>
      </div>
    );
  }
  return <Interactive title={caption} steps={steps} />;
}

function Interactive({ title, steps }) {
  const [revealed, setRevealed] = useState(1);
  const total = steps.length;
  const done  = revealed >= total;

  return (
    <div className="mx-4 my-2 rounded-xl p-3 transition-all duration-300" dir="rtl"
      style={{
        background: 'rgba(147,112,219,0.08)',
        border: `1px solid ${done ? 'rgba(147,112,219,0.45)' : 'rgba(147,112,219,0.22)'}`,
      }}>
      <div className="flex items-center justify-between mb-2">
        <Header title={title} />
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: 'rgba(155,89,182,0.12)', border: '1px solid rgba(155,89,182,0.25)', color: '#9B59B6' }}>
          {toAr(revealed)}<span style={{ opacity: 0.4 }}>/</span>{toAr(total)}
        </div>
      </div>

      {/* Dots */}
      <div className="flex gap-1 mb-3">
        {steps.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300"
            style={{ background: i < revealed ? '#9B59B6' : 'rgba(155,89,182,0.2)' }} />
        ))}
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-2 mb-3">
        {steps.map((text, i) => i < revealed && (
          <div key={i} className="flex items-start gap-2"
            style={{ opacity: i === revealed - 1 ? 1 : 0.55, animation: i === revealed - 1 ? 'stepIn 0.25s ease' : 'none' }}>
            <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
              style={{
                background: i === revealed - 1 ? '#9B59B6' : 'rgba(155,89,182,0.18)',
                color: i === revealed - 1 ? '#fff' : 'rgba(155,89,182,0.7)',
                fontSize: '10px',
              }}>
              {toAr(i + 1)}
            </div>
            <p className="font-arabic text-xs leading-loose flex-1" style={{ color: 'var(--text-secondary)' }}>{text}</p>
          </div>
        ))}
      </div>

      {!done ? (
        <button onClick={() => setRevealed(r => r + 1)}
          className="w-full rounded-lg py-2 text-xs font-arabic font-medium flex items-center justify-center gap-1.5
                     transition-all active:scale-98"
          style={{ border: '1px solid rgba(155,89,182,0.4)', color: '#9B59B6', background: 'transparent' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          الخطوة {toAr(revealed + 1)} من {toAr(total)}
        </button>
      ) : (
        <div className="w-full rounded-lg py-2 text-center text-xs font-arabic font-medium"
          style={{ background: 'rgba(155,89,182,0.12)', color: '#9B59B6' }}>
          ✓ اكتمل المثال
        </div>
      )}
    </div>
  );
}

function Header({ title }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="1.8">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
      <span className="font-arabic text-xs font-bold" style={{ color: '#9B59B6' }}>{title}</span>
    </div>
  );
}
