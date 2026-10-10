'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { DefinitionCard, FlashCard, TrueFalseCard, MCQCard, ReviewCard } from '../feed/Feedcards';
import { FEED_CARDS_BY_PATH } from '../demoData';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// ─────────────────────────────────────────────────────────────────────────────
// FeedScreen — review as full-screen pages. The student swipes, always free,
// there is no next button. A hairline of progress at the top, a close button,
// and a pause page half-way where the session can stop. The stopping point and
// the end summary are separate screens with buttons.
// ─────────────────────────────────────────────────────────────────────────────

const REST_AFTER = 4;   // the pause page comes after this many cards

export default function FeedScreen({ userPath = 'SCIENCE', setFullScreen, onGoHome, onXpEarned }) {
  const rawCards   = FEED_CARDS_BY_PATH[userPath] || FEED_CARDS_BY_PATH.SCIENCE;
  const cards      = rawCards.filter(c => c.type !== 'SESSION_END');
  const sessionEnd = rawCards.find(c => c.type === 'SESSION_END');

  const pages = [
    ...cards.slice(0, REST_AFTER).map(c => ({ kind: 'card', card: c })),
    { kind: 'rest' },
    ...cards.slice(REST_AFTER).map(c => ({ kind: 'card', card: c })),
  ];
  const total = pages.length;

  const containerRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!setFullScreen) return;
    setFullScreen(true);
    return () => setFullScreen(false);
  }, [setFullScreen]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setIdx(Math.min(total - 1, Math.round(el.scrollTop / el.clientHeight)));
  }, [total]);

  // swiping past the last page ends the session
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function check() {
      if (el.scrollTop >= el.scrollHeight - el.clientHeight - 10 && idx === total - 1) {
        const t = setTimeout(() => setDone(true), 700);
        return () => clearTimeout(t);
      }
    }
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, [idx, total]);

  function close() {
    if (setFullScreen) setFullScreen(false);
    if (onGoHome) onGoHome();
  }
  function goTo(i) {
    const el = containerRef.current;
    if (el) el.scrollTo({ top: i * el.clientHeight, behavior: 'smooth' });
  }

  if (done && sessionEnd) {
    return <EndScreen data={sessionEnd} onGoHome={onGoHome} onXpEarned={onXpEarned} setFullScreen={setFullScreen}
      onAgain={() => { setDone(false); setIdx(0); }} />;
  }

  return (
    <div dir="rtl" style={{ position: 'absolute', inset: 0, background: 'var(--b-paper)' }}>
      {/* hairline progress */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--b-rule)', zIndex: 20 }}>
        <div style={{ width: `${((idx + 1) / total) * 100}%`, height: '100%', background: 'var(--b-ink)', marginLeft: 'auto', transition: 'width .3s ease' }} />
      </div>

      <div
        ref={containerRef}
        onScroll={onScroll}
        style={{
          position: 'absolute', inset: 0, overflowY: 'scroll', overflowX: 'hidden',
          scrollSnapType: 'y mandatory', scrollBehavior: 'smooth', scrollbarWidth: 'none',
        }}
      >
        {pages.map((p, i) => (
          <div key={p.kind === 'card' ? p.card.id : 'rest'} style={{
            height: '100%', flexShrink: 0, scrollSnapAlign: 'start', scrollSnapStop: 'always',
            display: 'flex', flexDirection: 'column', boxSizing: 'border-box', paddingTop: 2,
          }}>
            {p.kind === 'rest'
              ? <RestPage done={REST_AFTER} remaining={cards.length - REST_AFTER} onContinue={() => goTo(i + 1)} onStop={() => setDone(true)} />
              : <CardRouter card={p.card} first={i === 0} onXpEarned={onXpEarned} />}
          </div>
        ))}
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      </div>

      {/* close, always there */}
      <button onClick={close} aria-label="إغلاق المراجعة" style={{
        position: 'absolute', top: 10, right: 6, zIndex: 30, width: 44, height: 44, background: 'none', border: 0,
        color: 'var(--b-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>
  );
}

function CardRouter({ card, first, onXpEarned }) {
  if (card.type === 'FLASH_CARD') return <FlashCard card={card} />;
  if (card.type === 'TRUE_FALSE') return <TrueFalseCard card={card} onXpEarned={onXpEarned} />;
  if (card.type === 'MCQ')        return <MCQCard card={card} onXpEarned={onXpEarned} />;
  if (card.type === 'REVIEW')     return <ReviewCard card={card} />;
  return <DefinitionCard card={card} first={first} />;
}

// ── the pause: a place to stop ───────────────────────────────────────────────

function RestPage({ done, remaining, onContinue, onStop }) {
  const concepts = n => (n === 1 ? 'مفهوم واحد' : n === 2 ? 'مفهومين' : n <= 10 ? `${toAr(n)} مفاهيم` : `${toAr(n)} مفهوم`);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '72px 24px 24px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
        <span style={{ font: '800 12px/18px var(--font-arabic)', color: 'var(--b-accent-text)' }}>وقفة</span>
        <h2 style={{ margin: 0, font: '800 22px/32px var(--font-arabic)' }}>خلّصت {concepts(done)}</h2>
        <p style={{ margin: 0, font: '500 14px/24px var(--font-arabic)', color: 'var(--b-ink2)' }}>
          باقي {concepts(remaining)}، حوالي دقيقتين
        </p>
        <p className="b-read" style={{ margin: '8px 0 0', font: '400 15px/27px var(--font-read)', color: 'var(--b-ink2)' }}>
          لو وقفت هسي، الباقي بيستناك في جلستك الجاية.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="b-btn" onClick={onContinue}>كمّل</button>
        <button className="b-btn-quiet" onClick={onStop}>كفاية لليوم</button>
      </div>
    </div>
  );
}

// ── the end summary ──────────────────────────────────────────────────────────

function EndScreen({ data, onGoHome, onXpEarned, setFullScreen, onAgain }) {
  function home() {
    if (onXpEarned && data.xpEarned) onXpEarned(data.xpEarned);
    if (setFullScreen) setFullScreen(false);
    if (onGoHome) onGoHome();
  }
  return (
    <div dir="rtl" style={{ position: 'absolute', inset: 0, background: 'var(--b-paper)', display: 'flex', flexDirection: 'column', padding: '24px', animation: 'bshStep .35s ease' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ font: '700 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>مراجعة {data.subjectsHit.join(' و')}</span>
        <h2 style={{ margin: '4px 0 20px', font: '800 22px/32px var(--font-arabic)' }}>خلّصت مراجعة اليوم</h2>
        <div style={{ display: 'flex', borderTop: '2px solid var(--b-ink)', borderBottom: '1px solid var(--b-rule)' }}>
          <Stat n={toAr(data.cardsCompleted)} label="بطاقة" />
          <span style={{ width: 1, background: 'var(--b-rule)' }} />
          <Stat n={toAr(data.subjectsHit.length)} label="مواد" />
          <span style={{ width: 1, background: 'var(--b-rule)' }} />
          <Stat n={<span dir="ltr">{`+${toAr(data.xpEarned)}`}</span>} label="نقطة" />
        </div>
        <p style={{ margin: '16px 0 0', font: '500 14px/24px var(--font-arabic)', color: 'var(--b-ink2)' }}>
          كل مفهوم بيرجع ليك في المراجعة في يومه.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="b-btn" onClick={home}>رجوع للرئيسية</button>
        <button className="b-btn-quiet" onClick={onAgain}>جلسة تانية</button>
      </div>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div style={{ flex: 1, padding: '14px 0', textAlign: 'center' }}>
      <div style={{ font: '800 30px/40px var(--font-arabic)' }}>{n}</div>
      <div style={{ font: '600 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>{label}</div>
    </div>
  );
}
