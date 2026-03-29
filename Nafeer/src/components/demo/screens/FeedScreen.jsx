'use client';
import { useState } from 'react';
import { DefinitionCard, FlashCard } from '../feed/FeedCards';
import { DEMO_FEED_CARDS } from '../demoData';

// ─────────────────────────────────────────────────────────────────────────────
// FeedScreen
// Shows one card at a time with a progress bar and card counter.
// Wraps around when all cards are seen — infinite loop to stay demo-friendly.
// ─────────────────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const [index, setIndex] = useState(0);
  const total = DEMO_FEED_CARDS.length;
  const card  = DEMO_FEED_CARDS[index];

  function next() {
    setIndex(i => (i + 1) % total);
  }

  return (
    <div className="w-full" dir="rtl">
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <h2
          className="font-arabic text-base font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          لقطات المعرفة
        </h2>
        <p className="font-arabic text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          اكتشف · تعلّم · تذكّر
        </p>
      </div>

      {/* Card counter + dots */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-1 mb-1">
          {DEMO_FEED_CARDS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 rounded-full transition-all duration-300"
              style={{ background: i <= index ? 'var(--accent)' : 'var(--border-subtle)' }}
            />
          ))}
        </div>
        <p className="text-xs font-arabic text-left" style={{ color: 'var(--text-muted)' }}>
          {index + 1} / {total}
        </p>
      </div>

      {/* Card */}
      <div className="px-4 pb-6">
        <CardRenderer card={card} onNext={next} key={`${card.id}-${index}`} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CardRenderer — dispatches to the right card type
// ─────────────────────────────────────────────────────────────────────────────

function CardRenderer({ card, onNext }) {
  if (card.type === 'FLASH_CARD') {
    return <FlashCard card={card} onNext={onNext} />;
  }
  return <DefinitionCard card={card} onNext={onNext} />;
}
