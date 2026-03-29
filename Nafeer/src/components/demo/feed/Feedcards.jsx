'use client';
import { useState } from 'react';
import { SUBJECT_COLORS } from '../demoData';

// ─────────────────────────────────────────────────────────────────────────────
// DefinitionCard — large centered text, subject glow, tap to continue
// ─────────────────────────────────────────────────────────────────────────────
export function DefinitionCard({ card, onNext }) {
  const color = SUBJECT_COLORS[card.subjectKey] || '#4A90D9';
  return (
    <button onClick={onNext}
      className="w-full text-right flex flex-col justify-between rounded-2xl p-5 cursor-pointer select-none
                 transition-transform active:scale-99"
      style={{
        minHeight: '260px',
        background: '#0f0d0a',
        border: `1px solid ${color}25`,
        boxShadow: `inset 0 0 70px ${color}14`,
      }}
    >
      {/* Top row */}
      <div className="flex justify-between items-center w-full mb-4" dir="rtl">
        <Chip label={card.typeLabel} color={color} />
        <span className="font-arabic text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>{card.subjectName}</span>
      </div>

      {/* Main text */}
      <p className="font-arabic text-base sm:text-lg font-medium leading-loose text-center flex-1 flex items-center justify-center"
        style={{ color: 'rgba(255,255,255,0.90)', direction: 'rtl' }}>
        {card.contentAr}
      </p>

      {/* Hint */}
      <p className="mt-4 text-xs font-arabic text-center w-full" style={{ color: 'rgba(255,255,255,0.22)' }}>
        اضغط للمتابعة
      </p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FlashCard — flip mechanic with كنت تعرف؟ buttons
// ─────────────────────────────────────────────────────────────────────────────
export function FlashCard({ card, onNext }) {
  const [flipped, setFlipped] = useState(false);
  const color = SUBJECT_COLORS[card.subjectKey] || '#27AE60';

  return (
    <div className="w-full flex flex-col gap-3" dir="rtl">
      <div className="flex justify-between items-center">
        <Chip label={card.typeLabel} color={color} />
        <span className="font-arabic text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>{card.subjectName}</span>
      </div>

      {/* Card face */}
      <button onClick={() => !flipped && setFlipped(true)} disabled={flipped}
        className="w-full rounded-2xl p-5 flex items-center justify-center transition-all duration-300"
        style={{
          minHeight: '170px',
          background: flipped ? `${color}1c` : '#1a1710',
          border: `1.5px solid ${flipped ? color + '55' : color + '1f'}`,
        }}>
        <p className="font-arabic font-medium leading-loose text-center"
          style={{
            fontSize: flipped ? '14px' : '17px',
            color: flipped ? color : 'rgba(255,255,255,0.92)',
            fontWeight: flipped ? 400 : 700,
          }}>
          {flipped ? (card.back || '') : card.contentAr}
        </p>
      </button>

      {!flipped ? (
        <p className="text-center text-xs font-arabic" style={{ color: 'rgba(255,255,255,0.28)' }}>اضغط للكشف</p>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-arabic" style={{ color: 'rgba(255,255,255,0.40)' }}>هل كنت تعرف الإجابة؟</p>
          <div className="flex gap-2.5 w-full">
            <ActionBtn onClick={onNext} bg="rgba(231,76,60,0.14)" color="#E74C3C" border="rgba(231,76,60,0.25)" label="✕  لم أعرف" />
            <ActionBtn onClick={onNext} bg={`${color}1f`} color={color} border={`${color}3f`} label="✓  عرفت" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrueFalseCard — statement + صح/خطأ buttons + reveal explanation
// Mirrors Basheer's TrueFalseCard in TAP_CONFIRM mode (no swipe on web)
// ─────────────────────────────────────────────────────────────────────────────
export function TrueFalseCard({ card, onNext }) {
  const [answered, setAnswered] = useState(null); // null | 'true' | 'false'
  const color = SUBJECT_COLORS[card.subjectKey] || '#4A90D9';
  const correct = card.correctAnswer; // 'true' | 'false'

  function handleAnswer(ans) {
    if (answered) return;
    setAnswered(ans);
  }

  const isCorrect = answered === correct;

  return (
    <div className="w-full flex flex-col gap-3" dir="rtl">
      <div className="flex justify-between items-center">
        <Chip label={card.typeLabel} color={color} />
        <span className="font-arabic text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>{card.subjectName}</span>
      </div>

      {/* Statement */}
      <div className="rounded-2xl p-5"
        style={{
          background: answered
            ? isCorrect ? 'rgba(39,174,96,0.10)' : 'rgba(231,76,60,0.10)'
            : '#0f0d0a',
          border: `1.5px solid ${answered ? (isCorrect ? '#27AE6055' : '#E74C3C55') : color + '25'}`,
          minHeight: '120px',
          display: 'flex', alignItems: 'center',
        }}>
        <p className="font-arabic text-base font-medium leading-loose text-center w-full"
          style={{ color: 'rgba(255,255,255,0.90)' }}>
          {card.contentAr}
        </p>
      </div>

      {/* Buttons or result */}
      {!answered ? (
        <div className="flex gap-2.5">
          <ActionBtn onClick={() => handleAnswer('true')}
            bg="rgba(39,174,96,0.12)" color="#27AE60" border="rgba(39,174,96,0.28)" label="✓  صحيح" />
          <ActionBtn onClick={() => handleAnswer('false')}
            bg="rgba(231,76,60,0.12)" color="#E74C3C" border="rgba(231,76,60,0.28)" label="✕  خطأ" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Result badge */}
          <div className="rounded-xl px-4 py-2.5 text-center"
            style={{ background: isCorrect ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)' }}>
            <p className="font-arabic text-sm font-bold" style={{ color: isCorrect ? '#27AE60' : '#E74C3C' }}>
              {isCorrect ? '✓ إجابة صحيحة!' : '✕ الإجابة خاطئة'}
            </p>
          </div>
          {/* Explanation */}
          {card.explanation && (
            <div className="rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
              <p className="font-arabic text-xs leading-loose" style={{ color: 'var(--text-secondary)' }}>
                {card.explanation}
              </p>
            </div>
          )}
          <button onClick={onNext}
            className="w-full rounded-xl py-2.5 text-sm font-arabic font-medium text-center transition-opacity hover:opacity-80"
            style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
            التالي →
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────
function Chip({ label, color }) {
  return (
    <div className="text-xs font-arabic px-2.5 py-1 rounded-full"
      style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
      {label}
    </div>
  );
}

function ActionBtn({ onClick, bg, color, border, label }) {
  return (
    <button onClick={onClick}
      className="flex-1 rounded-xl py-2.5 text-xs font-arabic font-medium flex items-center justify-center
                 transition-opacity hover:opacity-80 active:scale-98"
      style={{ background: bg, color, border: `1px solid ${border}` }}>
      {label}
    </button>
  );
}
