'use client';
import { useState, useRef } from 'react';
import { SUBJECT_COLORS } from '../demoData';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function Chip({ label, color }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontFamily: 'var(--font-arabic, inherit)',
        padding: '3px 10px',
        borderRadius: '20px',
        background: `${color}18`,
        border: `1px solid ${color}30`,
        color,
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

function ActionBtn({ onClick, bg, color, border, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '11px',
        borderRadius: '12px',
        background: bg,
        border: `1px solid ${border}`,
        color,
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DefinitionCard — full-height lesson bite card (FACT / DEFINITION / TIP)
// ─────────────────────────────────────────────────────────────────────────────
export function DefinitionCard({ card }) {
  const color = SUBJECT_COLORS[card.subjectKey] || '#4A90D9';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0b09',
        border: `1px solid ${color}22`,
        borderRadius: '20px',
        padding: '20px',
        boxShadow: `inset 0 0 80px ${color}12`,
        overflow: 'hidden',
      }}
      dir="rtl"
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Chip label={card.typeLabel} color={color} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-arabic, inherit)' }}>
          {card.subjectName}
        </span>
      </div>

      {/* Main content — centered vertically */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: '15px',
            fontWeight: 500,
            lineHeight: 1.9,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.90)',
            direction: 'rtl',
          }}
        >
          {card.contentAr}
        </p>
      </div>

      <div style={{ marginTop: '16px', height: '3px', borderRadius: '2px', background: `${color}40` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FlashCard — tap to flip
// ─────────────────────────────────────────────────────────────────────────────
export function FlashCard({ card }) {
  const [flipped, setFlipped] = useState(false);
  const color = SUBJECT_COLORS[card.subjectKey] || '#27AE60';

  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}
      dir="rtl"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip label={card.typeLabel} color={color} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-arabic, inherit)' }}>
          {card.subjectName}
        </span>
      </div>

      <div
        onClick={() => !flipped && setFlipped(true)}
        style={{
          flex: 1,
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '12px',
          cursor: flipped ? 'default' : 'pointer',
          background: flipped ? `${color}1a` : '#1a1710',
          border: `1.5px solid ${flipped ? color + '55' : color + '1f'}`,
          transition: 'background 0.4s ease, border-color 0.4s ease',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: flipped ? '14px' : '18px',
            fontWeight: flipped ? 400 : 700,
            lineHeight: 1.7,
            textAlign: 'center',
            color: flipped ? color : 'rgba(255,255,255,0.92)',
            transition: 'font-size 0.3s ease, color 0.3s ease',
          }}
        >
          {flipped ? (card.back || '') : card.contentAr}
        </p>
        {flipped && (
          <div style={{ width: '40px', height: '2px', borderRadius: '1px', background: `${color}50`, marginTop: '4px' }} />
        )}
      </div>

      {!flipped ? (
        <p style={{ textAlign: 'center', fontSize: '11px', fontFamily: 'var(--font-arabic, inherit)', color: 'rgba(255,255,255,0.28)' }}>
          اضغط للكشف
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', fontFamily: 'var(--font-arabic, inherit)', color: 'rgba(255,255,255,0.40)' }}>
            هل كنت تعرف الإجابة؟
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <ActionBtn
              onClick={() => setFlipped(false)}
              bg="rgba(231,76,60,0.14)" color="#E74C3C" border="rgba(231,76,60,0.25)" label="✕  لم أعرف"
            />
            <ActionBtn
              onClick={() => setFlipped(false)}
              bg={`${color}1f`} color={color} border={`${color}3f`} label="✓  عرفت"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MCQCard — multiple choice question with 4 options
// ─────────────────────────────────────────────────────────────────────────────
export function MCQCard({ card, onXpEarned }) {
  const [answered, setAnswered] = useState(null);
  const color = SUBJECT_COLORS[card.subjectKey] || '#4A90D9';
  const LETTERS = ['أ', 'ب', 'ج', 'د'];

  function handleAnswer(i) {
    if (answered !== null) return;
    setAnswered(i);
    if (i === card.correctIndex && onXpEarned && card.xpReward) {
      onXpEarned(card.xpReward);
    }
  }

  function optionStyle(i) {
    if (answered === null) {
      return { background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.10)`, color: 'rgba(255,255,255,0.88)' };
    }
    if (i === card.correctIndex) {
      return { background: 'rgba(39,174,96,0.14)', border: '1px solid rgba(39,174,96,0.55)', color: '#27AE60' };
    }
    if (i === answered) {
      return { background: 'rgba(231,76,60,0.14)', border: '1px solid rgba(231,76,60,0.55)', color: '#E74C3C' };
    }
    return { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.30)' };
  }

  const isCorrect = answered === card.correctIndex;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }} dir="rtl">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip label={card.typeLabel} color={color} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-arabic, inherit)' }}>
          {card.subjectName}
        </span>
      </div>

      {/* Question */}
      <div style={{
        borderRadius: '16px',
        padding: '16px',
        background: `${color}0d`,
        border: `1px solid ${color}22`,
      }}>
        <p style={{
          fontFamily: 'var(--font-arabic, inherit)',
          fontSize: '14px',
          fontWeight: 700,
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.92)',
        }}>
          {card.contentAr}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1 }}>
        {card.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            style={{
              width: '100%',
              textAlign: 'right',
              borderRadius: '12px',
              padding: '11px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              cursor: answered !== null ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font-arabic, inherit)',
              fontSize: '13px',
              fontWeight: 500,
              ...optionStyle(i),
            }}
          >
            <span>{opt}</span>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              background: answered !== null && i === card.correctIndex
                ? '#27AE60'
                : answered !== null && i === answered
                ? '#E74C3C'
                : `${color}20`,
              color: answered !== null && (i === card.correctIndex || i === answered) ? '#fff' : color,
              fontFamily: 'var(--font-arabic, inherit)',
            }}>
              {answered !== null && i === card.correctIndex ? '✓'
                : answered !== null && i === answered ? '✗'
                : LETTERS[i]}
            </span>
          </button>
        ))}
      </div>

      {/* Result + explanation */}
      {answered !== null && (
        <div style={{
          borderRadius: '12px',
          padding: '12px 14px',
          background: isCorrect ? 'rgba(39,174,96,0.10)' : 'rgba(74,144,217,0.10)',
          border: `1px solid ${isCorrect ? 'rgba(39,174,96,0.30)' : 'rgba(74,144,217,0.25)'}`,
          animation: 'feedFadeUp 0.3s ease both',
        }}>
          <p style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: '12px', fontWeight: 700,
            color: isCorrect ? '#27AE60' : '#4A90D9',
            marginBottom: '4px',
          }}>
            {isCorrect ? `✓ إجابة صحيحة! +${toAr(card.xpReward || 10)} XP` : 'إجابة خاطئة — إليك التفسير:'}
          </p>
          {card.explanation && (
            <p style={{
              fontFamily: 'var(--font-arabic, inherit)',
              fontSize: '12px', lineHeight: 1.7,
              color: 'rgba(255,255,255,0.55)',
            }}>
              {card.explanation}
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes feedFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReviewCard — compact summary / مراجعة سريعة (pattern-breaker)
// ─────────────────────────────────────────────────────────────────────────────
export function ReviewCard({ card }) {
  const color = SUBJECT_COLORS[card.subjectKey] || '#4A90D9';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }} dir="rtl">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Chip label={card.typeLabel} color={color} />
          {/* small bookmark icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill={color} opacity="0.7">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-arabic, inherit)' }}>
          {card.subjectName}
        </span>
      </div>

      {/* Title */}
      <div style={{
        borderRadius: '16px',
        padding: '14px 16px',
        background: `${color}10`,
        border: `1px solid ${color}28`,
      }}>
        <p style={{
          fontFamily: 'var(--font-arabic, inherit)',
          fontSize: '15px', fontWeight: 700,
          color: color,
        }}>
          {card.contentAr}
        </p>
      </div>

      {/* Review points */}
      <div style={{
        flex: 1,
        borderRadius: '16px',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {card.reviewPoints.map((point, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              flexShrink: 0,
              width: 22, height: 22,
              borderRadius: '50%',
              background: `${color}18`,
              border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color,
              fontFamily: 'var(--font-arabic, inherit)',
            }}>
              {toAr(i + 1)}
            </div>
            <p style={{
              fontFamily: 'var(--font-arabic, inherit)',
              fontSize: '13px', lineHeight: 1.7,
              color: 'rgba(255,255,255,0.82)',
              flex: 1,
            }}>
              {point}
            </p>
          </div>
        ))}
      </div>

      <p style={{
        textAlign: 'center', fontSize: '11px',
        fontFamily: 'var(--font-arabic, inherit)',
        color: 'rgba(255,255,255,0.25)',
      }}>
        تذكير قبل السؤال القادم 📌
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrueFalseCard — swipe left (خطأ) or right (صح), or tap the buttons
// ─────────────────────────────────────────────────────────────────────────────
export function TrueFalseCard({ card, onXpEarned }) {
  const [answered, setAnswered] = useState(null);
  const [dragX,    setDragX]    = useState(0);
  const touchStartX = useRef(null);
  const mouseStartX = useRef(null);
  const color   = SUBJECT_COLORS[card.subjectKey] || '#4A90D9';
  const correct = card.correctAnswer;

  function handleAnswer(ans) {
    if (answered) return;
    setAnswered(ans);
    setDragX(0);
    if (ans === correct && onXpEarned && card.xpReward) {
      onXpEarned(card.xpReward);
    }
  }

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function onTouchMove(e) {
    if (answered || touchStartX.current === null) return;
    setDragX(Math.max(-80, Math.min(80, e.touches[0].clientX - touchStartX.current)));
  }
  function onTouchEnd(e) {
    if (answered || touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 55) handleAnswer(dx > 0 ? 'true' : 'false');
    else setDragX(0);
    touchStartX.current = null;
  }
  function onMouseDown(e) { mouseStartX.current = e.clientX; }
  function onMouseMove(e) {
    if (answered || mouseStartX.current === null || !(e.buttons & 1)) return;
    setDragX(Math.max(-80, Math.min(80, e.clientX - mouseStartX.current)));
  }
  function onMouseUp(e) {
    if (answered || mouseStartX.current === null) return;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) > 55) handleAnswer(dx > 0 ? 'true' : 'false');
    else setDragX(0);
    mouseStartX.current = null;
  }

  const isCorrect  = answered === correct;
  const swipeLeft  = dragX < -20;
  const swipeRight = dragX > 20;
  const tiltDeg    = dragX * 0.06;
  const dragOpacity = Math.abs(dragX) / 80;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }} dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip label={card.typeLabel} color={color} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-arabic, inherit)' }}>
          {card.subjectName}
        </span>
      </div>

      {!answered && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
          <SwipeHintLabel label="← خطأ" color="#E74C3C" active={swipeLeft}  side="left" />
          <SwipeHintLabel label="صح →"  color="#27AE60" active={swipeRight} side="right" />
        </div>
      )}

      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}   onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        style={{
          flex: 1,
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          cursor: answered ? 'default' : 'grab',
          userSelect: 'none',
          transform: `translateX(${dragX}px) rotate(${tiltDeg}deg)`,
          transition: answered || dragX === 0 ? 'transform 0.3s ease' : 'none',
          background: answered
            ? isCorrect ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)'
            : '#0f0d0a',
          border: `1.5px solid ${answered
            ? isCorrect ? '#27AE6055' : '#E74C3C55'
            : color + '25'}`,
        }}
      >
        {!answered && dragX !== 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: swipeLeft
              ? `rgba(231,76,60,${dragOpacity * 0.22})`
              : `rgba(39,174,96,${dragOpacity * 0.22})`,
            borderRadius: '20px',
            pointerEvents: 'none',
          }} />
        )}
        <p style={{
          fontFamily: 'var(--font-arabic, inherit)',
          fontSize: '15px', fontWeight: 600,
          lineHeight: 1.8, textAlign: 'center',
          color: 'rgba(255,255,255,0.90)',
          position: 'relative', zIndex: 1,
        }}>
          {card.contentAr}
        </p>
      </div>

      {!answered ? (
        <div style={{ display: 'flex', gap: '10px' }}>
          <ActionBtn onClick={() => handleAnswer('false')} bg="rgba(231,76,60,0.12)" color="#E74C3C" border="rgba(231,76,60,0.28)" label="✕  خطأ" />
          <ActionBtn onClick={() => handleAnswer('true')}  bg="rgba(39,174,96,0.12)"  color="#27AE60" border="rgba(39,174,96,0.28)"  label="✓  صحيح" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            borderRadius: '12px', padding: '10px 14px', textAlign: 'center',
            background: isCorrect ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)',
          }}>
            <p style={{
              fontFamily: 'var(--font-arabic, inherit)',
              fontSize: '14px', fontWeight: 700,
              color: isCorrect ? '#27AE60' : '#E74C3C', margin: 0,
            }}>
              {isCorrect
                ? `✓ إجابة صحيحة! +${toAr(card.xpReward || 10)} XP`
                : '✕ الإجابة خاطئة'}
            </p>
          </div>
          {card.explanation && (
            <div style={{
              borderRadius: '12px', padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
            }}>
              <p style={{
                fontFamily: 'var(--font-arabic, inherit)',
                fontSize: '12px', lineHeight: 1.7,
                color: 'var(--text-secondary)', margin: 0,
              }}>
                {card.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SwipeHintLabel({ label, color, active, side }) {
  return (
    <div style={{
      fontFamily: 'var(--font-arabic, inherit)',
      fontSize: '11px', fontWeight: 700, color,
      opacity: active ? 1 : 0.30,
      transition: 'opacity 0.15s',
      direction: side === 'left' ? 'ltr' : 'rtl',
    }}>
      {label}
    </div>
  );
}