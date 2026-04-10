'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { DefinitionCard, FlashCard, TrueFalseCard } from '../feed/Feedcards';
import { FEED_CARDS_BY_PATH } from '../demoData';

// ─────────────────────────────────────────────────────────────────────────────
// FeedScreen — full-height TikTok-style vertical snap scroll
//
// Layout in DemoApp: the parent content div has overflow: hidden and
// position: relative. FeedScreen fills it completely via position: absolute.
// Each card slot is 100% height → CSS scroll-snap-type: y mandatory.
//
// Card order: 4 lesson bites → 1 T/F (swipe left/right) → 1 flip card
// ─────────────────────────────────────────────────────────────────────────────
export default function FeedScreen({ userPath = 'SCIENCE', setFullScreen }) {
  const cards       = FEED_CARDS_BY_PATH[userPath] || FEED_CARDS_BY_PATH.SCIENCE;
  const total       = cards.length;
  const containerRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Set full screen when mounted
  useEffect(() => {
    if (setFullScreen) {
      setFullScreen(true);
      return () => setFullScreen(false);
    }
  }, [setFullScreen]);

  // Keep currentIdx in sync with scroll position (for the progress indicator)
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setCurrentIdx(Math.min(idx, total - 1));
  }, [total]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        position:       'absolute',
        inset:          0,
        overflowY:      'scroll',
        overflowX:      'hidden',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      dir="rtl"
    >
      {/* Progress bar — sticky overlay at top */}
      <ProgressBar current={currentIdx} total={total} />

      {cards.map((card, i) => (
        <CardSlot key={card.id} isActive={i === currentIdx}>
          <CardRouter card={card} isActive={i === currentIdx} />
        </CardSlot>
      ))}

      {/* Scroll indicator on first card */}
      {currentIdx === 0 && (
        <ScrollHint />
      )}

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CardSlot — one full-height snap target
// ─────────────────────────────────────────────────────────────────────────────
function CardSlot({ children, isActive }) {
  return (
    <div
      style={{
        height:          '100%',
        flexShrink:      0,
        scrollSnapAlign: 'start',
        display:         'flex',
        flexDirection:   'column',
        padding:         '40px 14px 16px', // top padding leaves room for progress bar
        boxSizing:       'border-box',
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProgressBar — sticky, rendered outside the snap slots so it doesn't scroll
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div
      style={{
        position:   'sticky',
        top:        0,
        left:       0,
        right:      0,
        zIndex:     20,
        padding:    '8px 14px 6px',
        background: 'linear-gradient(to bottom, var(--bg-primary) 60%, transparent)',
        display:    'flex',
        gap:        '4px',
        alignItems: 'center',
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex:         1,
            height:       '3px',
            borderRadius: '2px',
            background:   i <= current ? 'var(--accent)' : 'var(--border-mid)',
            transition:   'background 0.3s ease',
          }}
        />
      ))}
      <span
        style={{
          fontSize:   '10px',
          color:      'var(--text-muted)',
          marginRight: '4px',
          direction:  'ltr',
          flexShrink: 0,
          fontFamily: 'monospace',
        }}
      >
        {current + 1}/{total}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScrollHint — animated up-arrow shown on first card
// ─────────────────────────────────────────────────────────────────────────────
function ScrollHint() {
  return (
    <div
      style={{
        position:   'absolute',
        bottom:     '20px',
        left:       '50%',
        transform:  'translateX(-50%)',
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap:        '4px',
        animation:  'feedHintBounce 2s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex:     10,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="2" opacity="0.7">
        <path d="m18 15-6-6-6 6"/>
      </svg>
      <span style={{
        fontSize:   '10px',
        color:      'var(--accent)',
        opacity:    0.7,
        fontFamily: 'var(--font-arabic, inherit)',
      }}>
        اسحب للأعلى
      </span>
      <style>{`
        @keyframes feedHintBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CardRouter
// ─────────────────────────────────────────────────────────────────────────────
function CardRouter({ card, isActive }) {
  if (card.type === 'FLASH_CARD')  return <FlashCard    card={card} />;
  if (card.type === 'TRUE_FALSE')  return <TrueFalseCard card={card} />;
  return <DefinitionCard card={card} />;
}