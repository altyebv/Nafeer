'use client';
import { useState, useRef } from 'react';
import { SUBJECT_COLORS } from '../demoData';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
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
// DefinitionCard — full-height lesson bite card
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

      {/* Subject color accent line at bottom */}
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip label={card.typeLabel} color={color} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-arabic, inherit)' }}>
          {card.subjectName}
        </span>
      </div>

      {/* Card face — takes remaining height */}
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

      {/* Hint / action */}
      {!flipped ? (
        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          fontFamily: 'var(--font-arabic, inherit)',
          color: 'rgba(255,255,255,0.28)',
        }}>
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
// TrueFalseCard — swipe left (خطأ) or right (صح), or tap the buttons
// ─────────────────────────────────────────────────────────────────────────────
export function TrueFalseCard({ card }) {
  const [answered, setAnswered] = useState(null);  // null | 'true' | 'false'
  const [dragX,    setDragX]    = useState(0);     // live drag offset for visual feedback
  const touchStartX = useRef(null);
  const mouseStartX = useRef(null);
  const color   = SUBJECT_COLORS[card.subjectKey] || '#4A90D9';
  const correct = card.correctAnswer;  // 'true' | 'false'

  function handleAnswer(ans) {
    if (answered) return;
    setAnswered(ans);
    setDragX(0);
  }

  // ── Touch handlers ──
  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchMove(e) {
    if (answered || touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    setDragX(Math.max(-80, Math.min(80, dx)));
  }
  function onTouchEnd(e) {
    if (answered || touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 55) {
      handleAnswer(dx > 0 ? 'true' : 'false');
    } else {
      setDragX(0);
    }
    touchStartX.current = null;
  }

  // ── Mouse handlers (desktop) ──
  function onMouseDown(e) {
    mouseStartX.current = e.clientX;
  }
  function onMouseMove(e) {
    if (answered || mouseStartX.current === null || !(e.buttons & 1)) return;
    const dx = e.clientX - mouseStartX.current;
    setDragX(Math.max(-80, Math.min(80, dx)));
  }
  function onMouseUp(e) {
    if (answered || mouseStartX.current === null) return;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) > 55) {
      handleAnswer(dx > 0 ? 'true' : 'false');
    } else {
      setDragX(0);
    }
    mouseStartX.current = null;
  }

  const isCorrect  = answered === correct;
  const swipeLeft  = dragX < -20;
  const swipeRight = dragX > 20;

  // Card tilt based on drag
  const tiltDeg = dragX * 0.06;
  const dragOpacity = Math.abs(dragX) / 80;

  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}
      dir="rtl"
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip label={card.typeLabel} color={color} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-arabic, inherit)' }}>
          {card.subjectName}
        </span>
      </div>

      {/* Swipe hint labels */}
      {!answered && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
          <SwipeHintLabel label="← خطأ" color="#E74C3C" active={swipeLeft} side="left" />
          <SwipeHintLabel label="صح →"  color="#27AE60" active={swipeRight} side="right" />
        </div>
      )}

      {/* Card — draggable */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
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
          border: `1.5px solid ${
            answered
              ? isCorrect ? '#27AE6055' : '#E74C3C55'
              : color + '25'
          }`,
        }}
      >
        {/* Drag overlay tint */}
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
          fontSize: '15px',
          fontWeight: 600,
          lineHeight: 1.8,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.90)',
          position: 'relative',
          zIndex: 1,
        }}>
          {card.contentAr}
        </p>
      </div>

      {/* Buttons or result */}
      {!answered ? (
        <div style={{ display: 'flex', gap: '10px' }}>
          <ActionBtn
            onClick={() => handleAnswer('false')}
            bg="rgba(231,76,60,0.12)" color="#E74C3C" border="rgba(231,76,60,0.28)" label="✕  خطأ"
          />
          <ActionBtn
            onClick={() => handleAnswer('true')}
            bg="rgba(39,174,96,0.12)" color="#27AE60" border="rgba(39,174,96,0.28)" label="✓  صحيح"
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Result badge */}
          <div style={{
            borderRadius: '12px',
            padding: '10px 14px',
            textAlign: 'center',
            background: isCorrect ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)',
          }}>
            <p style={{
              fontFamily: 'var(--font-arabic, inherit)',
              fontSize: '14px',
              fontWeight: 700,
              color: isCorrect ? '#27AE60' : '#E74C3C',
              margin: 0,
            }}>
              {isCorrect ? '✓ إجابة صحيحة!' : '✕ الإجابة خاطئة'}
            </p>
          </div>

          {/* Explanation */}
          {card.explanation && (
            <div style={{
              borderRadius: '12px',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
            }}>
              <p style={{
                fontFamily: 'var(--font-arabic, inherit)',
                fontSize: '12px',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                margin: 0,
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

// ─────────────────────────────────────────────────────────────────────────────
// SwipeHintLabel — shown at edges to guide the user
// ─────────────────────────────────────────────────────────────────────────────
function SwipeHintLabel({ label, color, active, side }) {
  return (
    <div style={{
      fontFamily: 'var(--font-arabic, inherit)',
      fontSize: '11px',
      fontWeight: 700,
      color,
      opacity: active ? 1 : 0.30,
      transition: 'opacity 0.15s',
      direction: side === 'left' ? 'ltr' : 'rtl',
    }}>
      {label}
    </div>
  );
}