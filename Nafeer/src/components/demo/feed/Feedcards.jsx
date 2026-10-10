'use client';
import { useState, useRef } from 'react';
import { SUBJECT_COLORS } from '../demoData';

// ─────────────────────────────────────────────────────────────────────────────
// Feed cards — paper pages, one idea each (see FeedCardFrame.kt in the app).
//
// Every page shares one frame: a quiet line beside the close button naming the
// concept and why it is shown, then the card's content. Short content sits in
// the middle of the page, a long block starts from the top. Answers show their
// feedback in place and nothing advances on its own: the student swipes.
// ─────────────────────────────────────────────────────────────────────────────

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

const TYPE_LABEL = {
  FACT: 'حقيقة', DEFINITION: 'تعريف', FLASH_CARD: 'بطاقة', MCQ: 'سؤال', TRUE_FALSE: 'صح أم خطأ', REVIEW: 'مراجعة',
};

/** Reading text sized to its length: a one-liner is set large, a long block smaller. */
function readingStyle(len) {
  const [size, lh] = len <= 60 ? [24, 42] : len <= 160 ? [21, 38] : [18, 34];
  return { font: `500 ${size}px/${lh}px var(--font-read)`, color: 'var(--b-ink)' };
}

function returnsIn(days) {
  if (days <= 1) return 'بكرة';
  if (days >= 30) return 'بعد شهر وأكتر';
  if (days === 2) return 'بعد يومين';
  return `بعد ${toAr(days)} ${days <= 10 ? 'أيام' : 'يوم'}`;
}

const caption = { font: '700 12px/18px var(--font-arabic)', color: 'var(--b-ink)' };
const muted   = { font: '600 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' };

// ── frame ────────────────────────────────────────────────────────────────────

export function CardFrame({ card, onClick, footer, children, clickLabel }) {
  const color = SUBJECT_COLORS[card.subjectKey] || '#4A90D9';
  return (
    <div
      dir="rtl"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={clickLabel}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* the quiet line, clear of the close button */}
      <div style={{ height: 48, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '0 52px 0 16px' }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ ...caption, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.subjectName}</span>
        <span style={{ ...muted, fontWeight: 500, whiteSpace: 'nowrap' }}>جديدة عليك</span>
      </div>
      {/* short content in the middle, long content from the top */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: `0 24px ${footer ? 8 : 24}px`, display: 'flex', flexDirection: 'column', justifyContent: 'safe center' }}>
        <div>{children}</div>
      </div>
      {footer}
    </div>
  );
}

export function TypeLabel({ text, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
      <span style={{ width: 4, height: 18, borderRadius: 4, background: color }} />
      <span style={{ ...muted, fontWeight: 600 }}>{text}</span>
    </div>
  );
}

const colorOf = card => SUBJECT_COLORS[card.subjectKey] || '#4A90D9';

// ── text card: fact / definition ─────────────────────────────────────────────

export function DefinitionCard({ card, first }) {
  const color = colorOf(card);
  return (
    <CardFrame card={card}>
      <TypeLabel text={TYPE_LABEL[card.type] || card.typeLabel} color={color} />
      <p className="b-read" style={{ margin: 0, ...readingStyle(card.contentAr.length) }}>{card.contentAr}</p>
      {first && <p style={{ ...muted, fontWeight: 500, margin: '28px 0 0', color: 'var(--b-ink3)' }}>اسحب لفوق</p>}
    </CardFrame>
  );
}

// ── flashcard: a prompt, its answer once the page is tapped, then a verdict ──

export function FlashCard({ card }) {
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState(null);
  const color = colorOf(card);
  const days = rated === true ? 3 : 1;

  return (
    <CardFrame card={card} onClick={!flipped ? () => setFlipped(true) : undefined} clickLabel="اقلب البطاقة">
      <TypeLabel text={TYPE_LABEL.FLASH_CARD} color={color} />
      {!flipped ? (
        <>
          <p className="b-read" style={{ margin: 0, ...readingStyle(card.contentAr.length) }}>{card.contentAr}</p>
          <div style={{ borderTop: '1px solid var(--b-rule-strong)', margin: '16px 0 12px' }} />
          <span style={muted}>اضغط عشان تشوف الإجابة</span>
        </>
      ) : (
        <div style={{ animation: 'bshStep .25s ease' }}>
          <p className="b-read" style={{ margin: 0, font: '500 16px/28px var(--font-read)', color: 'var(--b-ink2)' }}>{card.contentAr}</p>
          <div style={{ borderTop: '1px solid var(--b-rule-strong)', margin: '16px 0' }} />
          <p className="b-read" style={{ margin: 0, ...readingStyle(card.back.length) }}>{card.back}</p>
          <div style={{ minHeight: 52, display: 'flex', alignItems: 'center', marginTop: 16 }}>
            {rated === null ? (
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <button className="b-btn-quiet" onClick={e => { e.stopPropagation(); setRated(false); }}>ما عرفتها</button>
                <button className="b-btn" onClick={e => { e.stopPropagation(); setRated(true); }}>عرفتها</button>
              </div>
            ) : (
              <span style={muted}>ترجع ليك {returnsIn(days)}</span>
            )}
          </div>
        </div>
      )}
    </CardFrame>
  );
}

// ── multiple choice ──────────────────────────────────────────────────────────

const LETTERS = ['أ', 'ب', 'ج', 'د'];

export function MCQCard({ card, onXpEarned }) {
  const [answered, setAnswered] = useState(null);
  const color = colorOf(card);
  const isCorrect = answered === card.correctIndex;

  function pick(i) {
    if (answered !== null) return;
    setAnswered(i);
    if (i === card.correctIndex && onXpEarned && card.xpReward) onXpEarned(card.xpReward);
  }

  const state = i => {
    if (answered === null) return 'idle';
    if (i === card.correctIndex) return answered === i ? 'right' : 'missed';
    if (i === answered) return 'wrong';
    return 'dimmed';
  };

  return (
    <CardFrame card={card}>
      <TypeLabel text={TYPE_LABEL.MCQ} color={color} />
      <p className="b-read" style={{ margin: '0 0 18px', font: '500 19px/34px var(--font-read)', color: 'var(--b-ink)' }}>{card.contentAr}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {card.options.map((opt, i) => {
          const s = state(i);
          const fill = s === 'right' || s === 'missed' ? 'var(--b-positive-bg)' : s === 'wrong' ? 'var(--b-negative-bg)' : 'var(--b-surface)';
          const border = s === 'right' ? '2px solid var(--b-positive)' : s === 'missed' ? '2px solid var(--b-positive)' : s === 'wrong' ? '2px solid var(--b-negative)' : s === 'dimmed' ? '1px solid var(--b-rule)' : '1px solid var(--b-rule-strong)';
          const tag = s === 'right' ? 'صح' : s === 'missed' ? 'الصواب' : s === 'wrong' ? 'إجابتك' : null;
          return (
            <button key={i} onClick={() => pick(i)} disabled={answered !== null} style={{
              display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '8px 14px', textAlign: 'right', width: '100%',
              background: fill, border, borderRadius: 10, boxSizing: 'border-box', cursor: answered !== null ? 'default' : 'pointer',
              color: s === 'dimmed' ? 'var(--b-ink2)' : 'var(--b-ink)',
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid var(--b-rule-strong)', font: '800 12px/18px var(--font-arabic)',
              }}>{LETTERS[i]}</span>
              <span className="b-read" style={{ flex: 1, font: `${s === 'idle' || s === 'dimmed' ? 400 : 700} 16px/28px var(--font-read)` }}>{opt}</span>
              {tag && (
                <span style={{ font: '800 12px/18px var(--font-arabic)', color: s === 'wrong' ? 'var(--b-negative)' : 'var(--b-positive)' }}>{tag}</span>
              )}
            </button>
          );
        })}
      </div>
      <Feedback visible={answered !== null} explanation={card.explanation} days={isCorrect ? 3 : 1} />
    </CardFrame>
  );
}

/** What follows an answer. It keeps its place in the layout while hidden, so answering moves nothing. */
function Feedback({ visible, explanation, days }) {
  return (
    <div aria-hidden={!visible} style={{ marginTop: 16, opacity: visible ? 1 : 0, transition: 'opacity .22s', minHeight: 96 }}>
      {explanation && <p className="b-read" style={{ margin: '0 0 6px', font: '400 16px/28px var(--font-read)', color: 'var(--b-ink)' }}>{explanation}</p>}
      <span style={muted}>ترجع ليك {returnsIn(days)}</span>
    </div>
  );
}

// ── review: a short list of what to remember ─────────────────────────────────

export function ReviewCard({ card }) {
  const color = colorOf(card);
  return (
    <CardFrame card={card}>
      <TypeLabel text={TYPE_LABEL.REVIEW} color={color} />
      <p style={{ margin: '0 0 8px', font: '800 20px/32px var(--font-arabic)' }}>{card.contentAr}</p>
      <div style={{ borderTop: '2px solid var(--b-ink)' }}>
        {card.reviewPoints.map((pt, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--b-rule)' }}>
            <span style={{
              width: 26, height: 26, borderRadius: 4, flexShrink: 0, border: '1.5px solid var(--b-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 12px/18px var(--font-arabic)',
            }}>{toAr(i + 1)}</span>
            <span className="b-read" style={{ flex: 1, font: '400 16px/28px var(--font-read)' }}>{pt}</span>
          </div>
        ))}
      </div>
    </CardFrame>
  );
}

// ── true / false: answered by swiping sideways (right = صح, left = خطأ) ─────

export function TrueFalseCard({ card, onXpEarned }) {
  const [answered, setAnswered] = useState(null);
  const [dragX, setDragX] = useState(0);
  const startX = useRef(null);
  const color = colorOf(card);
  const correct = card.correctAnswer;
  const isCorrect = answered === correct;

  function answer(ans) {
    if (answered) return;
    setAnswered(ans);
    setDragX(0);
    if (ans === correct && onXpEarned && card.xpReward) onXpEarned(card.xpReward);
  }
  const down = x => { if (!answered) startX.current = x; };
  const move = x => { if (!answered && startX.current !== null) setDragX(Math.max(-90, Math.min(90, x - startX.current))); };
  const up = x => {
    if (answered || startX.current === null) return;
    const dx = x - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 60) answer(dx > 0 ? 'true' : 'false'); else setDragX(0);
  };

  const word = a => (a === 'true' ? 'صح' : 'خطأ');
  const tint = dragX > 20 ? 'var(--b-positive-bg)' : dragX < -20 ? 'var(--b-negative-bg)' : 'transparent';

  return (
    <div
      onTouchStart={e => down(e.touches[0].clientX)} onTouchMove={e => move(e.touches[0].clientX)} onTouchEnd={e => up(e.changedTouches[0].clientX)}
      onMouseDown={e => down(e.clientX)} onMouseMove={e => e.buttons & 1 && move(e.clientX)} onMouseUp={e => up(e.clientX)}
      onMouseLeave={() => { startX.current = null; setDragX(0); }}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, userSelect: 'none', touchAction: 'pan-y',
        background: answered ? (isCorrect ? 'var(--b-positive-bg)' : 'var(--b-negative-bg)') : tint, transition: 'background .2s',
      }}
    >
      <CardFrame
        card={card}
        footer={
          <div style={{ padding: '0 24px 22px', minHeight: 92 }}>
            {!answered ? (
              /* خطأ at the left edge, صح at the right, matching the drag */
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl' }}>
                <span style={{ font: `800 16px/24px var(--font-arabic)`, color: 'var(--b-positive)', opacity: dragX > 20 ? 1 : 0.6 }} dir="ltr">صح →</span>
                <span style={{ font: `800 16px/24px var(--font-arabic)`, color: 'var(--b-negative)', opacity: dragX < -20 ? 1 : 0.6 }} dir="ltr">← خطأ</span>
              </div>
            ) : (
              <div style={{ animation: 'bshStep .25s ease' }}>
                <div style={{ font: '800 16px/24px var(--font-arabic)', color: isCorrect ? 'var(--b-positive)' : 'var(--b-negative)' }}>
                  {isCorrect ? `قلت ${word(answered)}، وإجابتك صحيحة` : `قلت ${word(answered)}، والصواب ${word(correct)}`}
                </div>
                {card.explanation && <p className="b-read" style={{ margin: '6px 0 4px', font: '400 15px/26px var(--font-read)', color: 'var(--b-ink)' }}>{card.explanation}</p>}
                <span style={muted}>ترجع ليك {returnsIn(isCorrect ? 3 : 1)}</span>
              </div>
            )}
          </div>
        }
      >
        <div style={{ transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`, transition: dragX === 0 ? 'transform .25s ease' : 'none' }}>
          <TypeLabel text={TYPE_LABEL.TRUE_FALSE} color={color} />
          <p className="b-read" style={{ margin: 0, ...readingStyle(card.contentAr.length) }}>{card.contentAr}</p>
        </div>
      </CardFrame>
    </div>
  );
}
