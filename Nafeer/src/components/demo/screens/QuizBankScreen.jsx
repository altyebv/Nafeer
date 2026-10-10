'use client';
import { useState, useEffect, useRef } from 'react';
import { PRACTICE_QUESTIONS, MOCK_EXAMS } from '../quizData';

export const QUIZ_XP_REWARD = 240;

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}
const lerp = (a, b, t) => a + (b - a) * t;

const FONT = 'var(--font-arabic)';
const caption = { font: `600 12px/18px ${FONT}`, color: 'var(--b-ink2)' };

const Chevron = ({ color = 'currentColor' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
);
const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// QuizBankScreen — the bank (a cover holding the تدريب / امتحانات switch),
// a practice session on one shared question page, and the result.
// ─────────────────────────────────────────────────────────────────────────────
export default function QuizBankScreen({ onXpEarned, onNavigate, setFullScreen }) {
  const [view, setView] = useState('bank');     // bank | session | result
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    if (setFullScreen) setFullScreen(view === 'session');
    return () => { if (setFullScreen) setFullScreen(false); };
  }, [view, setFullScreen]);

  function startSession() { setView('session'); }
  function finish(res) { setOutcome(res); onXpEarned?.(QUIZ_XP_REWARD); setView('result'); }

  return (
    <div dir="rtl" style={{ position: 'absolute', inset: 0, background: 'var(--b-paper)', color: 'var(--b-ink)' }}>
      {view === 'bank'    && <BankPage onStart={startSession} />}
      {view === 'session' && <SessionPage onClose={() => setView('bank')} onFinish={finish} />}
      {view === 'result'  && <ResultPage outcome={outcome} onBank={() => setView('bank')} onNavigate={onNavigate} onAgain={startSession} />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BANK — a cover that collapses on scroll, then the page.
// ═════════════════════════════════════════════════════════════════════════════

const SPINE = 10;

function BankPage({ onStart }) {
  const [mode, setMode] = useState('PRACTICE');
  const [f, setF] = useState(0);
  const [notice, setNotice] = useState(false);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'color-mix(in srgb, var(--b-accent) 16%, var(--b-paper))' }}>
      <header style={{ position: 'relative', paddingRight: SPINE, flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: SPINE, background: 'var(--b-accent)' }} />
        <div style={{ height: lerp(56, 48, f), display: 'flex', alignItems: 'center', padding: '0 20px' }}>
          <h1 style={{ margin: 0, flex: 1, font: `800 ${lerp(22, 17, f)}px/32px ${FONT}` }}>بنك الأسئلة</h1>
          {f > 0.5 && <span style={{ ...caption, color: 'var(--b-ink)', opacity: (f - 0.5) * 2 }}>{toAr(1840)} سؤال</span>}
        </div>
        <div style={{ overflow: 'hidden', maxHeight: lerp(26, 0, f), opacity: Math.max(0, 1 - f / 0.5) }}>
          <div style={{ padding: '0 20px 6px', ...caption, color: 'var(--b-ink)' }}>{toAr(1840)} سؤال، {toAr(6)} مواد، {toAr(6)} أنواع</div>
        </div>
        {/* the two-way switch lives inside the cover */}
        <div role="tablist" style={{ display: 'flex', padding: '0 20px' }}>
          {[['PRACTICE', 'تدريب'], ['EXAMS', 'امتحانات']].map(([id, label]) => {
            const on = mode === id;
            return (
              <button key={id} role="tab" aria-selected={on} onClick={() => setMode(id)} style={{
                flex: 1, minHeight: 48, background: 'none', border: 0, cursor: 'pointer', color: 'var(--b-ink)',
                font: `${on ? 800 : 600} 15px/22px ${FONT}`, borderBottom: on ? '3px solid var(--b-ink)' : '3px solid transparent',
                opacity: on ? 1 : 0.7,
              }}>{label}</button>
            );
          })}
        </div>
      </header>

      <div
        onScroll={e => setF(Math.min(1, e.currentTarget.scrollTop / 80))}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', background: 'var(--b-paper)', borderTop: '1px solid var(--b-rule)' }}
      >
        {mode === 'PRACTICE' ? <PracticeList onStart={onStart} /> : <ExamList onOpen={() => setNotice(true)} />}
        <div style={{ height: 24 }} />
      </div>

      {notice && (
        <div role="dialog" onClick={() => setNotice(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--b-surface)', borderRadius: '16px 16px 0 0', padding: '20px 20px 24px' }}>
            <h3 style={{ margin: 0, font: `800 16px/24px ${FONT}` }}>الامتحانات في التطبيق</h3>
            <p style={{ margin: '4px 0 16px', font: `500 14px/24px ${FONT}`, color: 'var(--b-ink2)' }}>
              امتحانات الوزارة والمدارس بتتفتح بتوقيتها الكامل في التطبيق. هنا ممكن تجرّب التدريب.
            </p>
            <button className="b-btn" onClick={() => setNotice(false)}>تمام</button>
          </div>
        </div>
      )}
    </div>
  );
}

const WAYS = [
  ['مراجعة سريعة', 'عشرة أسئلة من كل موادك'],
  ['نقاط الضعف', 'الأسئلة اللي غلطت فيها قبل كده'],
  ['حسب الوحدة', 'اختار وحدة وتدرّب عليها'],
  ['حسب المفهوم', 'مفهوم واحد وأسئلته كلها'],
  ['حسب النوع', 'جداول، ترتيب، مطابقة وغيرها'],
];

function PracticeList({ onStart }) {
  return (
    <>
      {/* one next step */}
      <section style={{ padding: '22px 20px 20px' }}>
        <div style={{ font: `800 12px/18px ${FONT}`, color: 'var(--b-accent-text)' }}>خطوتك الجاية</div>
        <h2 style={{ margin: '2px 0 4px', font: `800 19px/28px ${FONT}` }}>جلسة ذكية</h2>
        <p style={{ margin: '0 0 14px', font: `500 14px/24px ${FONT}`, color: 'var(--b-ink2)' }}>
          ابدأ جلستك الأولى، وبعدها نعرف نقاط ضعفك ونرتّب ليك الأسئلة.
        </p>
        <button className="b-btn" onClick={onStart}>ابدأ الجلسة</button>
      </section>

      {/* the other ways, as rows */}
      <section style={{ borderTop: '1px solid var(--b-rule-strong)', background: 'var(--b-sunken)', padding: '18px 0 4px' }}>
        <h3 style={{ margin: '0 20px 6px', font: `800 16px/24px ${FONT}` }}>طرق تانية للتدريب</h3>
        {WAYS.map(([t, d]) => (
          <button key={t} onClick={onStart} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: '8px 20px', textAlign: 'right',
            background: 'none', border: 0, borderTop: '1px solid var(--b-rule)', cursor: 'pointer', color: 'var(--b-ink)',
          }}>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', font: `700 15px/24px ${FONT}` }}>{t}</span>
              <span style={{ display: 'block', ...caption, fontWeight: 500 }}>{d}</span>
            </span>
            <Chevron color="var(--b-ink3)" />
          </button>
        ))}
      </section>
    </>
  );
}

function ExamList({ onOpen }) {
  const group = (title, list) => (
    <section>
      <div style={{ padding: '18px 20px 6px', font: `800 16px/24px ${FONT}` }}>{title}</div>
      {list.map(e => (
        <button key={e.id} onClick={onOpen} style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: '8px 20px', textAlign: 'right',
          background: 'none', border: 0, borderTop: '1px solid var(--b-rule)', cursor: 'pointer', color: 'var(--b-ink)',
        }}>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', font: `700 15px/24px ${FONT}` }}>{e.title}</span>
            <span style={{ display: 'block', ...caption, fontWeight: 500 }}>
              {toAr(e.year)}، {toAr(e.minutes)} دقيقة، {toAr(e.questions)} سؤال
            </span>
          </span>
          <Chevron color="var(--b-ink3)" />
        </button>
      ))}
      <div style={{ borderTop: '1px solid var(--b-rule)' }} />
    </section>
  );
  return (
    <>
      {group('امتحانات الوزارة', MOCK_EXAMS.MINISTRY)}
      {group('امتحانات المدارس', MOCK_EXAMS.SCHOOL)}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SESSION — one shared question page. Practice moves on by itself after an
// answer; feedback appears in place. The close button and a hairline of
// progress are all the chrome.
// ═════════════════════════════════════════════════════════════════════════════

const ADVANCE_RIGHT_MS = 1500;
const ADVANCE_WRONG_MS = 3600;

function SessionPage({ onClose, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const results = useRef([]);
  const started = useRef(Date.now());
  const timer = useRef(null);
  const total = PRACTICE_QUESTIONS.length;
  const q = PRACTICE_QUESTIONS[idx];

  function advance() {
    clearTimeout(timer.current);
    if (idx + 1 >= total) {
      onFinish({ results: results.current, seconds: Math.round((Date.now() - started.current) / 1000) });
      return;
    }
    setIdx(idx + 1); setAnswered(false); setCorrect(false);
  }

  function mark(isCorrect) {
    if (answered) return;
    setAnswered(true);
    setCorrect(isCorrect);
    results.current = [...results.current, { q, correct: isCorrect }];
    timer.current = setTimeout(advance, isCorrect ? ADVANCE_RIGHT_MS : ADVANCE_WRONG_MS);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const common = { q, answered, onAnswer: mark };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--b-paper)' }}>
      <div style={{ height: 2, background: 'var(--b-rule)', flexShrink: 0 }}>
        <div style={{ width: `${((idx + (answered ? 1 : 0)) / total) * 100}%`, height: '100%', background: 'var(--b-ink)', marginLeft: 'auto', transition: 'width .3s' }} />
      </div>

      {/* quiet line: concept and where it sits */}
      <div style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 6px 0 20px', gap: 4 }}>
        <button onClick={onClose} aria-label="إغلاق" style={{ background: 'none', border: 0, color: 'var(--b-ink)', cursor: 'pointer', padding: 10 }}><CloseIcon /></button>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: q.subjectColor }} />
        <span style={{ font: `700 12px/18px ${FONT}`, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.concept}</span>
        <span style={caption}>{toAr(idx + 1)} من {toAr(total)}</span>
      </div>

      <div key={q.id} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '4px 20px 24px', animation: 'bshStep .25s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10 }}>
          <span style={{ width: 4, height: 18, borderRadius: 4, background: q.subjectColor }} />
          <span style={caption}>{q.subjectAr}، {q.typeAr}</span>
        </div>
        <p className="b-read" style={{ margin: '0 0 16px', font: '500 18px/32px var(--font-read)' }}>{q.text}</p>

        {q.type === 'MCQ'          && <ChoiceQuestion {...common} />}
        {q.type === 'TABLE'        && <TableQuestion {...common} />}
        {q.type === 'SORT'         && <SortQuestion {...common} />}
        {q.type === 'COMPARE'      && <CompareQuestion {...common} />}
        {q.type === 'SELF_EVAL'    && <SelfEvalQuestion {...common} />}
        {q.type === 'IMAGE_MARKER' && <ImageMarkerQuestion {...common} />}

        {answered && (
          <div onClick={advance} style={{ marginTop: 16, animation: 'bshStep .25s ease', cursor: 'pointer' }}>
            <div style={{ font: `800 16px/24px ${FONT}`, color: correct ? 'var(--b-positive)' : 'var(--b-negative)' }}>
              {correct ? 'صاح' : 'ما ظبطت المرة دي'}
            </div>
            {q.explanation && (
              <>
                <div style={{ font: `800 12px/18px ${FONT}`, color: 'var(--b-ink2)', paddingTop: 8 }}>{correct ? 'ليه؟' : 'الغلط وين؟'}</div>
                <p className="b-read" style={{ margin: 0, font: '400 15px/27px var(--font-read)' }}>{q.explanation}</p>
              </>
            )}
            <div style={{ ...caption, paddingTop: 10, color: 'var(--b-ink3)' }}>اضغط للمتابعة</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── answer choice, shared ────────────────────────────────────────────────────

function Choice({ text, state, onClick, disabled, letter }) {
  const fill = state === 'picked' ? 'var(--b-selected)' : state === 'right' ? 'var(--b-positive-bg)' : state === 'wrong' ? 'var(--b-negative-bg)' : 'var(--b-surface)';
  const border = state === 'picked' ? '2px solid var(--b-ink)' : state === 'right' ? '2px solid var(--b-positive)' : state === 'wrong' ? '2px solid var(--b-negative)' : state === 'dimmed' ? '1px solid var(--b-rule)' : '1px solid var(--b-rule-strong)';
  const judged = state === 'right' || state === 'wrong';
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 52, padding: '8px 14px', textAlign: 'right',
      background: fill, border, borderRadius: 10, cursor: disabled ? 'default' : 'pointer', boxSizing: 'border-box',
      color: state === 'dimmed' ? 'var(--b-ink2)' : 'var(--b-ink)',
    }}>
      {letter && <span style={{ width: 26, height: 26, borderRadius: 4, flexShrink: 0, border: '1.5px solid var(--b-rule-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `800 12px/18px ${FONT}` }}>{letter}</span>}
      <span className="b-read" style={{ flex: 1, font: `${judged || state === 'picked' ? 700 : 400} 15px/27px var(--font-read)` }}>{text}</span>
      {judged && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" stroke={state === 'right' ? 'var(--b-positive)' : 'var(--b-negative)'}>
          {state === 'right' ? <path d="m5 12 5 5 9-10" /> : <path d="M6 6l12 12M18 6 6 18" />}
        </svg>
      )}
    </button>
  );
}

const LETTERS = ['أ', 'ب', 'ج', 'د'];

function useChoices(q, answered, onAnswer) {
  const [selected, setSelected] = useState(null);
  const pick = id => {
    if (answered) return;
    setSelected(id);
    onAnswer(q.choices.find(c => c.id === id)?.correct ?? false);
  };
  const stateOf = c => {
    if (!answered) return 'idle';
    if (c.correct) return 'right';
    if (selected === c.id) return 'wrong';
    return 'dimmed';
  };
  return { pick, stateOf };
}

function ChoiceList({ q, answered, onAnswer }) {
  const { pick, stateOf } = useChoices(q, answered, onAnswer);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {q.choices.map((c, i) => (
        <Choice key={c.id} text={c.text} letter={q.choices.length > 2 ? LETTERS[i] : null} state={stateOf(c)} disabled={answered} onClick={() => pick(c.id)} />
      ))}
    </div>
  );
}

function ChoiceQuestion(props) { return <ChoiceList {...props} />; }

// ── table ────────────────────────────────────────────────────────────────────

function TableQuestion({ q, answered, onAnswer }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--b-ink)' }}>
            {q.tableHeaders.map((h, i) => <th key={i} style={{ padding: '7px 8px 7px 0', textAlign: 'right', font: `800 12px/20px ${FONT}` }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {q.tableRows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid var(--b-rule)' }}>
              {row.map((cell, ci) => (
                <td key={ci} className="b-read" style={{
                  padding: '7px 8px 7px 0', font: `${cell === '?' ? 800 : 400} 15px/26px var(--font-read)`,
                  color: cell === '?' ? 'var(--b-accent-text)' : 'var(--b-ink)',
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ChoiceList q={q} answered={answered} onAnswer={onAnswer} />
    </div>
  );
}

// ── sort: move rows up and down ──────────────────────────────────────────────

const Arrow = ({ up }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    {up ? <path d="m6 15 6-6 6 6" /> : <path d="m6 9 6 6 6-6" />}
  </svg>
);

function SortQuestion({ q, answered, onAnswer }) {
  const [items, setItems] = useState(() => [...q.items].sort((a, b) => a.correctOrder - b.correctOrder).reverse());
  function move(i, d) {
    if (answered) return;
    const n = [...items], j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    setItems(n);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it, i) => {
        const ok = answered ? it.correctOrder === i + 1 : null;
        return (
          <div key={it.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '6px 10px 6px 14px', borderRadius: 10, boxSizing: 'border-box',
            background: ok === null ? 'var(--b-surface)' : ok ? 'var(--b-positive-bg)' : 'var(--b-negative-bg)',
            border: ok === null ? '1px solid var(--b-rule-strong)' : `2px solid ${ok ? 'var(--b-positive)' : 'var(--b-negative)'}`,
          }}>
            <span style={{ width: 26, height: 26, borderRadius: 4, flexShrink: 0, border: '1.5px solid var(--b-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `800 12px/18px ${FONT}` }}>{toAr(i + 1)}</span>
            <span className="b-read" style={{ flex: 1, font: '400 15px/26px var(--font-read)' }}>{it.text}</span>
            {!answered && (
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <button aria-label="حرّك لفوق" onClick={() => move(i, -1)} style={{ background: 'none', border: 0, color: 'var(--b-ink)', cursor: 'pointer', height: 22, padding: '0 8px' }}><Arrow up /></button>
                <button aria-label="حرّك لتحت" onClick={() => move(i, 1)} style={{ background: 'none', border: 0, color: 'var(--b-ink)', cursor: 'pointer', height: 22, padding: '0 8px' }}><Arrow /></button>
              </span>
            )}
          </div>
        );
      })}
      {!answered && (
        <div style={{ marginTop: 6 }}>
          <button className="b-btn-ink" onClick={() => onAnswer(items.every((it, i) => it.correctOrder === i + 1))}>تحقّق</button>
        </div>
      )}
    </div>
  );
}

// ── compare: assign each item to one of two columns ──────────────────────────

function CompareQuestion({ q, answered, onAnswer }) {
  const [asg, setAsg] = useState({});
  const all = q.pairs.every(p => asg[p.id]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {q.pairs.map(p => {
        const v = asg[p.id];
        const ok = answered ? v === p.correct : null;
        return (
          <div key={p.id} style={{
            padding: 10, borderRadius: 10, background: ok === null ? 'var(--b-surface)' : ok ? 'var(--b-positive-bg)' : 'var(--b-negative-bg)',
            border: ok === null ? '1px solid var(--b-rule-strong)' : `2px solid ${ok ? 'var(--b-positive)' : 'var(--b-negative)'}`,
          }}>
            <p className="b-read" style={{ margin: '0 0 8px', font: '500 15px/26px var(--font-read)' }}>{p.text}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['LEFT', q.leftLabel], ['RIGHT', q.rightLabel]].map(([side, label]) => {
                const on = v === side;
                return (
                  <button key={side} disabled={answered} onClick={() => setAsg(a => ({ ...a, [p.id]: side }))} style={{
                    flex: 1, minHeight: 40, borderRadius: 10, cursor: answered ? 'default' : 'pointer', color: 'var(--b-ink)',
                    background: on ? 'var(--b-selected)' : 'transparent', border: on ? '2px solid var(--b-ink)' : '1px solid var(--b-rule-strong)',
                    font: `${on ? 800 : 600} 12px/18px ${FONT}`,
                  }}>{label}</button>
                );
              })}
            </div>
          </div>
        );
      })}
      {!answered && (
        <button className="b-btn-ink" disabled={!all} onClick={() => onAnswer(q.pairs.every(p => asg[p.id] === p.correct))}>تحقّق</button>
      )}
    </div>
  );
}

// ── self-evaluation: think, peek at hints, then grade yourself ───────────────

function SelfEvalQuestion({ q, answered, onAnswer }) {
  const [hints, setHints] = useState(false);
  const [picked, setPicked] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ borderTop: '1px solid var(--b-rule-strong)', borderBottom: '1px solid var(--b-rule-strong)', padding: '12px 0' }}>
        <div style={{ font: `800 12px/18px ${FONT}`, color: 'var(--b-accent-text)' }}>فكّر أول</div>
        <button onClick={() => setHints(h => !h)} style={{ background: 'none', border: 0, padding: '6px 0', cursor: 'pointer', color: 'var(--b-ink)', font: `700 14px/22px ${FONT}`, textDecoration: 'underline' }}>
          {hints ? 'أخفِ التلميحات' : 'اعرض التلميحات'}
        </button>
        {hints && (
          <ul style={{ margin: '6px 0 0', padding: '0 18px 0 0' }}>
            {q.hints.map((h, i) => <li key={i} className="b-read" style={{ font: '400 15px/27px var(--font-read)' }}>{h}</li>)}
          </ul>
        )}
      </div>
      <div style={{ font: `800 14px/22px ${FONT}` }}>قيّم إجابتك</div>
      {q.selfRubric.map((r, i) => {
        const on = picked === i;
        const state = !answered ? (on ? 'picked' : 'idle') : on ? (i < 2 ? 'right' : 'wrong') : 'dimmed';
        return (
          <Choice key={i} text={`${r.points === '٠' ? 'صفر' : r.points}، ${r.label}`} state={state} disabled={answered}
            onClick={() => { setPicked(i); onAnswer(i < 2); }} />
        );
      })}
    </div>
  );
}

// ── image markers: a diagram with numbered pins ──────────────────────────────

function ImageMarkerQuestion({ q, answered, onAnswer }) {
  const [active, setActive] = useState(null);
  const c = q.imagePlaceholder.color;
  const m = q.markers.find(x => x.id === active);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative', aspectRatio: '4/3', border: '1px solid var(--b-rule-strong)', borderRadius: 4, background: 'var(--b-surface)', overflow: 'hidden' }}>
        <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
          <ellipse cx="200" cy="150" rx="185" ry="135" fill={`${c}0d`} stroke={`${c}60`} strokeWidth="2" strokeDasharray="6 3" />
          <ellipse cx="200" cy="135" rx="50" ry="42" fill={`${c}25`} stroke={`${c}99`} strokeWidth="1.5" />
          <ellipse cx="200" cy="135" rx="24" ry="20" fill={`${c}40`} stroke={c} strokeWidth="1" />
          <ellipse cx="288" cy="105" rx="22" ry="12" fill={`${c}25`} stroke={`${c}99`} strokeWidth="1.2" />
          <path d="M272,105 Q280,98 288,105 Q296,112 304,105" fill="none" stroke={`${c}70`} strokeWidth="1" />
          <path d="M120,195 Q135,188 150,195 Q165,202 180,195 Q195,188 210,195" fill="none" stroke={`${c}70`} strokeWidth="1.5" />
          <path d="M120,205 Q135,198 150,205 Q165,212 180,205 Q195,198 210,205" fill="none" stroke={`${c}70`} strokeWidth="1.5" />
          {[[118, 190], [122, 200], [128, 195], [135, 190], [115, 208]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={`${c}99`} />)}
        </svg>
        {q.markers.map(mk => (
          <button key={mk.id} onClick={() => setActive(active === mk.id ? null : mk.id)} style={{
            position: 'absolute', left: `${mk.x * 100}%`, top: `${mk.y * 100}%`, transform: 'translate(-50%, -50%)',
            width: 26, height: 26, borderRadius: 4, cursor: 'pointer', zIndex: 2,
            background: active === mk.id ? 'var(--b-ink)' : 'var(--b-surface)', color: active === mk.id ? 'var(--b-paper)' : 'var(--b-ink)',
            border: '1.5px solid var(--b-ink)', font: `800 12px/18px ${FONT}`,
          }}>{mk.label}</button>
        ))}
        {m && (
          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, background: 'var(--b-surface)', border: '1px solid var(--b-rule-strong)', borderRadius: 10, padding: '6px 12px', font: `700 12px/20px ${FONT}` }}>
            {m.label}، {m.answer}
          </div>
        )}
      </div>
      <div style={caption}>{q.imagePlaceholder.label}</div>
      <ChoiceList q={q} answered={answered} onAnswer={onAnswer} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RESULT — the score leads as a giant figure; numbers as numbers; wrong
// answers first; ways onward, not a dead end.
// ═════════════════════════════════════════════════════════════════════════════

function ResultPage({ outcome, onBank, onNavigate, onAgain }) {
  const results = outcome?.results || [];
  const right = results.filter(r => r.correct).length;
  const total = results.length || PRACTICE_QUESTIONS.length;
  const seconds = outcome?.seconds || 0;
  const perQ = total ? Math.max(1, Math.round(seconds / total)) : 0;
  const wrong = results.filter(r => !r.correct);
  const concepts = [...new Set(results.map(r => r.q.concept))];
  const [showAll, setShowAll] = useState(false);
  const mins = Math.floor(seconds / 60), secs = seconds % 60;
  const timeText = mins > 0 ? `${toAr(mins)}:${toAr(String(secs).padStart(2, '0'))}` : `${toAr(secs)} ث`;

  const lead = wrong[0]?.q;
  const list = showAll ? results : wrong;

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', scrollbarWidth: 'none', background: 'var(--b-paper)' }}>
      {/* head, tinted: this session spans subjects, so it takes the accent */}
      <div style={{ background: 'color-mix(in srgb, var(--b-accent) 16%, var(--b-paper))', borderBottom: '1px solid var(--b-rule-strong)', padding: '20px 24px 22px', position: 'relative', paddingRight: SPINE + 24 }}>
        <span style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: SPINE, background: 'var(--b-accent)' }} />
        <div style={{ font: `700 12px/18px ${FONT}` }}>خلّصت جلسة التدريب</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '4px 0' }}>
          <span style={{ font: `800 88px/1.1 ${FONT}` }}>{toAr(right)}</span>
          <span style={{ font: `700 20px/28px ${FONT}` }}>من {toAr(total)}</span>
        </div>
        <div style={{ font: `600 14px/22px ${FONT}` }}>
          {right === total ? 'جاوبت الأسئلة كلها صاح.' : `جاوبت ${toAr(right)} من ${toAr(total)} صاح${wrong.length ? ` وغلطت في ${toAr(wrong.length)}.` : '.'}`}
        </div>
      </div>

      <div style={{ display: 'flex', margin: '0 24px', borderBottom: '1px solid var(--b-rule)' }}>
        <Num n={timeText} label="الوقت" />
        <span style={{ width: 1, background: 'var(--b-rule)' }} />
        <Num n={`${toAr(perQ)} ث`} label="لكل سؤال" />
        <span style={{ width: 1, background: 'var(--b-rule)' }} />
        <Num n={<span dir="ltr">{`+${toAr(QUIZ_XP_REWARD)}`}</span>} label="نقطة" />
      </div>

      <section style={{ padding: '18px 24px 4px' }}>
        <div style={{ font: `800 12px/18px ${FONT}`, color: 'var(--b-ink2)' }}>الجلسة غطّت</div>
        {concepts.map(c => <div key={c} className="b-read" style={{ font: '400 15px/27px var(--font-read)', borderBottom: '1px solid var(--b-rule)', padding: '2px 0' }}>{c}</div>)}
      </section>

      <section style={{ padding: '18px 24px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ margin: 0, font: `800 16px/24px ${FONT}` }}>{showAll ? 'كل الأسئلة' : wrong.length ? 'الأسئلة اللي غلطت فيها' : 'ما في أسئلة غلط'}</h3>
          {results.length > 0 && (
            <button onClick={() => setShowAll(s => !s)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--b-ink)', font: `700 12px/18px ${FONT}`, textDecoration: 'underline' }}>
              {showAll ? 'الغلط بس' : 'اعرض الكل'}
            </button>
          )}
        </div>
        {list.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--b-rule)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" stroke={r.correct ? 'var(--b-positive)' : 'var(--b-negative)'} style={{ flexShrink: 0, marginTop: 3 }}>
              {r.correct ? <path d="m5 12 5 5 9-10" /> : <path d="M6 6l12 12M18 6 6 18" />}
            </svg>
            <span style={{ flex: 1 }}>
              <span className="b-read" style={{ display: 'block', font: '500 15px/26px var(--font-read)' }}>{r.q.text}</span>
              <span style={{ display: 'block', ...caption, fontWeight: 500 }}>{r.q.concept}</span>
            </span>
          </div>
        ))}
      </section>

      {/* the way onward: one step, the rest as quiet rows */}
      <section style={{ padding: '14px 24px 28px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button className="b-btn" onClick={() => onNavigate?.('lesson')}>
          {lead ? `راجع «${lead.concept}» في الدروس` : 'كمّل دروسك'}
        </button>
        {[['جلسة تانية', onAgain], ['ارجع للبنك', onBank], ['الرئيسية', () => onNavigate?.('home')]].map(([t, fn]) => (
          <button key={t} onClick={fn} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, padding: 0, background: 'none',
            border: 0, borderBottom: '1px solid var(--b-rule)', cursor: 'pointer', color: 'var(--b-ink)', font: `700 14px/22px ${FONT}`,
          }}>{t}<Chevron color="var(--b-ink3)" /></button>
        ))}
      </section>
    </div>
  );
}

function Num({ n, label }) {
  return (
    <div style={{ flex: 1, padding: '14px 0', textAlign: 'center' }}>
      <div style={{ font: `800 24px/32px ${FONT}` }}>{n}</div>
      <div style={caption}>{label}</div>
    </div>
  );
}
