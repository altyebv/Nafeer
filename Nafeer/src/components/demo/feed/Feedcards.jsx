'use client';
import {useState} from "react" ;
import { SUBJECT_COLORS } from "../demoData";

// ─────────────────────────────────────────────────────────────────────────────
// DefinitionCard
// Mirrors Basheer's DefinitionCard — large centered text on dark bg,
// subject-color ambient glow, "اضغط للمتابعة" hint.
// onNext: callback to advance to the next card.
// ─────────────────────────────────────────────────────────────────────────────

export function DefinitionCard({card, onNext}) {
    const color = SUBJECT_COLORS[card.subjectKey] || SUBJECT_COLORS.physics;
    return (
        <button
        onClick={onNext}
        className="w-full text-right flex flex-col items-center justify-between
                 rounded-2xl p-6 cursor-pointer select-none transition-transform
                 active:scale-99"
        style={{
            minHeight: '280px',
            background: '#111009',
            border: `1px solid ${color}22`,
            //glow behind content
            boxShadow:`inset 0 0 80px ${color}18`,
        }}
        >   
        {/* subject chip*/}
        <div className="w-full flex justify-between items-center mb-4">
            <div
                className="text-xs font-mono px-2.5 py-1 rounded-full"
                style={{
                background: `${color}18`,
                border: `1px solid ${color}33`,
                color: color,
                }}
            >
            {card.typelabel}
            </div>
            <span className="font-arabic text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {card.subjectName}
            </span>
        </div>
              {/* Main content */}
      <p
        className="font-arabic text-lg sm:text-xl font-medium leading-loose text-center"
        style={{ color: 'rgba(255,255,255,0.92)', direction: 'rtl' }}
      >
        {card.contentAr}
      </p>

      {/* Hint */}
      <p className="mt-4 text-xs font-arabic" style={{ color: 'rgba(255,255,255,0.25)' }}>
        اضغط للمتابعة
      </p>
    </button>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// FlashCard
// Mirrors Basheer's FlashCard — flip mechanic, "هل كنت تعرف؟" buttons.
// ─────────────────────────────────────────────────────────────────────────────
export function FlashCard({card, onNext}) {
    const [flipped, setFlipped] = useState(false);
    const color = SUBJECT_COLORS[card.subjectKey] || SUBJECT_COLORS.biology;

    function handleFlip(){
        if(!flipped) setFlipped(true)
    }

    function handleAnswer(){
        setFlipped(false);
        onNext();
    }
    return (
        <div className="w-full flex flex-col gap-4" dir="rtl">
      {/* Subject chip */}
      <div className="flex justify-between items-center">
        <div
          className="text-xs font-mono px-2.5 py-1 rounded-full"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}33`,
            color: color,
          }}
        >
          {card.typeLabel}
        </div>
        <span className="font-arabic text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {card.subjectName}
        </span>
      </div>

      {/* card face */}
      <button
      onClick={handleFlip}
        disabled={flipped}
        className="w-full rounded-2xl p-6 flex items-center justify-center
                   transition-all duration-300 cursor-pointer select-none"
        style={{
          minHeight: '180px',
          background: flipped ? `${color}20` : '#1C1A14',
          border: `1.5px solid ${flipped ? color + '55' : color + '22'}`,
        }}
      >
        <p
          className="font-arabic text-lg sm:text-xl font-medium leading-loose text-center transition-all"
          style={{
            color: flipped ? color : 'rgba(255,255,255,0.92)',
            fontWeight: flipped ? 400 : 700,
            fontSize: flipped ? '1.05rem' : '1.2rem',
          }}
        >
          {flipped ? (card.back || '') : card.contentAr}
        </p>
      </button>

      {/* Flip hint or answer buttons */}
      {!flipped ? (
        <p className="text-center text-xs font-arabic" style={{ color: 'rgba(255,255,255,0.3)' }}>
          اضغط للكشف
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-arabic" style={{ color: 'rgba(255,255,255,0.45)' }}>
            هل كنت تعرف الإجابة؟
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={handleAnswer}
              className="flex-1 rounded-xl py-2.5 text-sm font-arabic font-medium
                         flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
              style={{
                background: 'rgba(231,76,60,0.15)',
                color: '#E74C3C',
                border: '1px solid rgba(231,76,60,0.25)',
              }}
            >
              <span>✕</span> لم أعرف
            </button>
            <button
              onClick={handleAnswer}
              className="flex-1 rounded-xl py-2.5 text-sm font-arabic font-medium
                         flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
              style={{
                background: `${color}22`,
                color: color,
                border: `1px solid ${color}44`,
              }}
            >
              <span>✓</span> عرفت
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
