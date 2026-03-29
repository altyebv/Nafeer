'use client';
import { useState } from 'react';
import { DefinitionCard, FlashCard, TrueFalseCard } from '../feed/FeedCards';
import { DEMO_FEED_CARDS } from '../demoData';

export default function FeedScreen() {
  const [index, setIndex] = useState(0);
  const total = DEMO_FEED_CARDS.length;
  const card  = DEMO_FEED_CARDS[index];

  // On TrueFalse we don't auto-advance — the card has its own next button
  function next() {
    setIndex(i => (i + 1) % total);
  }

  return (
    <div className="w-full" dir="rtl">
      {/* Header */}
      <div className="px-4 pt-3 pb-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-arabic text-sm font-bold" style={{ color: 'var(--text-primary)' }}>لقطات المعرفة</h2>
        <p className="font-arabic text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>اكتشف · تعلّم · تذكّر</p>
      </div>

      {/* Progress dots */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-1 mb-1">
          {DEMO_FEED_CARDS.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300"
              style={{ background: i <= index ? 'var(--accent)' : 'var(--border-subtle)' }} />
          ))}
        </div>
        <p className="text-xs font-arabic" style={{ color: 'var(--text-muted)', direction: 'ltr' }}>
          {index + 1} / {total}
        </p>
      </div>

      {/* Card */}
      <div className="px-4 pt-2 pb-6">
        <CardRouter card={card} onNext={next} key={`${card.id}-${index}`} />
      </div>
    </div>
  );
}

function CardRouter({ card, onNext }) {
  if (card.type === 'FLASH_CARD')  return <FlashCard   card={card} onNext={onNext} />;
  if (card.type === 'TRUE_FALSE')  return <TrueFalseCard card={card} onNext={onNext} />;
  return <DefinitionCard card={card} onNext={onNext} />;
}
