'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { DefinitionCard, FlashCard, TrueFalseCard, MCQCard, ReviewCard } from '../feed/Feedcards';
import { FEED_CARDS_BY_PATH, SUBJECT_COLORS } from '../demoData';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// ─────────────────────────────────────────────────────────────────────────────
// FeedScreen — TikTok-style vertical snap scroll
// ─────────────────────────────────────────────────────────────────────────────
export default function FeedScreen({ userPath = 'SCIENCE', setFullScreen, onGoHome, onXpEarned }) {
  const rawCards    = FEED_CARDS_BY_PATH[userPath] || FEED_CARDS_BY_PATH.SCIENCE;
  // Separate the session-end sentinel from scrollable cards
  const cards       = rawCards.filter(c => c.type !== 'SESSION_END');
  const sessionEnd  = rawCards.find(c => c.type === 'SESSION_END');
  const total       = cards.length;

  const containerRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    if (setFullScreen) {
      setFullScreen(true);
      return () => setFullScreen(false);
    }
  }, [setFullScreen]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setCurrentIdx(Math.min(idx, total - 1));
  }, [total]);

  // When user scrolls past the last card — trigger session end
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function check() {
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (el.scrollTop >= maxScroll - 10 && currentIdx === total - 1) {
        // slight delay so the last card is fully seen
        const t = setTimeout(() => setSessionDone(true), 600);
        return () => clearTimeout(t);
      }
    }
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, [currentIdx, total]);

  // ── Session End overlay ──
  if (sessionDone && sessionEnd) {
    return (
      <SessionEndScreen
        data={sessionEnd}
        onGoHome={onGoHome}
        setFullScreen={setFullScreen}
      />
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          position: 'absolute', inset: 0,
          overflowY: 'scroll', overflowX: 'hidden',
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
            <CardRouter
              card={card}
              isActive={i === currentIdx}
              onXpEarned={onXpEarned}
            />
          </CardSlot>
        ))}

        {currentIdx === 0 && <ScrollHint />}

        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      </div>

      {/* ── Exit button — always visible overlay ── */}
      <ExitButton onGoHome={onGoHome} setFullScreen={setFullScreen} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExitButton — top-left overlay X button
// ─────────────────────────────────────────────────────────────────────────────
function ExitButton({ onGoHome, setFullScreen }) {
  function handleExit() {
    if (setFullScreen) setFullScreen(false);
    if (onGoHome) onGoHome();
  }

  return (
    <button
      onClick={handleExit}
      title="خروج"
      style={{
        position: 'absolute',
        // RTL: "top-left" visually = top-right in DOM (leading edge in RTL is right)
        // but since this is a phone UI with absolute coords, top-right corner visually
        top: '48px',
        left: '14px',
        zIndex: 30,
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.50)',
        border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.80)',
        transition: 'background 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.72)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.50)'; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SessionEndScreen — end-of-session celebration
// ─────────────────────────────────────────────────────────────────────────────
function SessionEndScreen({ data, onGoHome, setFullScreen }) {
  const [xpVisible, setXpVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setXpVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  function handleHome() {
    if (setFullScreen) setFullScreen(false);
    if (onGoHome) onGoHome();
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 24px 32px',
        animation: 'sessFadeIn 0.5s ease both',
      }}
      dir="rtl"
    >
      {/* Animated checkmark ring */}
      <div style={{ marginBottom: 20 }}>
        <svg width="84" height="84" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r="36" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.12" />
          <circle
            cx="42" cy="42" r="36"
            fill="none" stroke="var(--accent)" strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="226" strokeDashoffset="226"
            transform="rotate(-90 42 42)"
            style={{ animation: 'sessRing 0.9s ease forwards' }}
          />
          {/* Lightning bolt for "energy / session" */}
          <text x="42" y="48" textAnchor="middle" fontSize="28" fill="var(--accent)">⚡</text>
        </svg>
      </div>

      {/* Headline */}
      <h2 style={{
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize: '20px', fontWeight: 800,
        color: 'var(--text-primary)',
        textAlign: 'center',
        marginBottom: '6px',
      }}>
        انتهت الجلسة! 🎉
      </h2>
      <p style={{
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize: '13px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginBottom: '28px',
      }}>
        أكملت لقطات اليوم بنجاح
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '16px' }}>
        {/* XP */}
        <div style={{
          flex: 1, borderRadius: '18px', padding: '16px 12px',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>⭐</div>
          <p style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: '18px', fontWeight: 800,
            color: '#9B59B6',
            opacity: xpVisible ? 1 : 0,
            transform: xpVisible ? 'scale(1)' : 'scale(0.7)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
          }}>
            +{toAr(data.xpEarned)}
          </p>
          <p style={{ fontFamily: 'var(--font-arabic, inherit)', fontSize: '10px', color: 'var(--text-muted)' }}>
            نقطة XP
          </p>
        </div>

        {/* Cards */}
        <div style={{
          flex: 1, borderRadius: '18px', padding: '16px 12px',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🃏</div>
          <p style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: '18px', fontWeight: 800,
            color: 'var(--accent)',
          }}>
            {toAr(data.cardsCompleted)}
          </p>
          <p style={{ fontFamily: 'var(--font-arabic, inherit)', fontSize: '10px', color: 'var(--text-muted)' }}>
            بطاقة
          </p>
        </div>

        {/* Subjects */}
        <div style={{
          flex: 1, borderRadius: '18px', padding: '16px 12px',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📚</div>
          <p style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: '18px', fontWeight: 800,
            color: '#27AE60',
          }}>
            {toAr(data.subjectsHit.length)}
          </p>
          <p style={{ fontFamily: 'var(--font-arabic, inherit)', fontSize: '10px', color: 'var(--text-muted)' }}>
            مواد
          </p>
        </div>
      </div>

      {/* Subjects covered */}
      <div style={{
        width: '100%', marginBottom: '24px',
        borderRadius: '16px', padding: '14px 16px',
        background: 'rgba(212,137,30,0.07)',
        border: '1px solid rgba(212,137,30,0.20)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: 16 }}>🎯</span>
        <p style={{
          fontFamily: 'var(--font-arabic, inherit)',
          fontSize: '13px', lineHeight: 1.6,
          color: 'var(--text-secondary)',
        }}>
          راجعت مواد: <strong style={{ color: 'var(--accent)' }}>{data.subjectsHit.join(' و')}</strong>
        </p>
      </div>

      {/* Back to home */}
      <button
        onClick={handleHome}
        style={{
          width: '100%', padding: '14px',
          borderRadius: '20px',
          background: 'var(--accent)',
          border: 'none', cursor: 'pointer',
          color: '#fff',
          fontFamily: 'var(--font-arabic, inherit)',
          fontSize: '14px', fontWeight: 700,
          boxShadow: '0 4px 20px rgba(212,137,30,0.35)',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        العودة للرئيسية →
      </button>

      <style>{`
        @keyframes sessFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sessRing   { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CardSlot — one full-height snap target
// ─────────────────────────────────────────────────────────────────────────────
function CardSlot({ children }) {
  return (
    <div style={{
      height: '100%',
      flexShrink: 0,
      scrollSnapAlign: 'start',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 14px 16px',
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProgressBar
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div style={{
      position: 'sticky', top: 0, left: 0, right: 0,
      zIndex: 20,
      padding: '8px 52px 6px 14px', // leave room for exit button on left
      background: 'linear-gradient(to bottom, var(--bg-primary) 60%, transparent)',
      display: 'flex', gap: '4px', alignItems: 'center',
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: i <= current ? 'var(--accent)' : 'var(--border-mid)',
            transition: 'background 0.3s ease',
          }}
        />
      ))}
      <span style={{
        fontSize: '10px', color: 'var(--text-muted)',
        marginRight: '4px', direction: 'ltr',
        flexShrink: 0, fontFamily: 'monospace',
      }}>
        {current + 1}/{total}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScrollHint
// ─────────────────────────────────────────────────────────────────────────────
function ScrollHint() {
  return (
    <div style={{
      position: 'absolute', bottom: '20px', left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      animation: 'feedHintBounce 2s ease-in-out infinite',
      pointerEvents: 'none', zIndex: 10,
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="2" opacity="0.7">
        <path d="m18 15-6-6-6 6"/>
      </svg>
      <span style={{ fontSize: '10px', color: 'var(--accent)', opacity: 0.7, fontFamily: 'var(--font-arabic, inherit)' }}>
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
function CardRouter({ card, isActive, onXpEarned }) {
  if (card.type === 'FLASH_CARD')  return <FlashCard    card={card} />;
  if (card.type === 'TRUE_FALSE')  return <TrueFalseCard card={card} onXpEarned={onXpEarned} />;
  if (card.type === 'MCQ')         return <MCQCard       card={card} onXpEarned={onXpEarned} />;
  if (card.type === 'REVIEW')      return <ReviewCard    card={card} />;
  return <DefinitionCard card={card} />;
}
