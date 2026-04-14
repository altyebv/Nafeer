'use client';
import { useState, useEffect } from 'react';

// ─── Design tokens matching Android QuizbankDesignSystem ─────────────────────
const ACCENT_EXAM     = '#F59E0B';   // Amber — official, high-stakes
const ACCENT_PRACTICE = '#0EA5E9';   // Sky Blue — dynamic, flexible
const SCORE_HIGH      = '#10B981';
const SCORE_MID       = '#F59E0B';
const SCORE_LOW       = '#EF4444';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// ─── Mock practice questions ──────────────────────────────────────────────────
const PRACTICE_QUESTIONS = [
  {
    id: 'q1',
    subjectAr: 'الفيزياء',
    subjectColor: '#4A90D9',
    initial: 'ف',
    typeAr: 'اختيار من متعدد',
    text: 'جسم كتلته ٥ كغ يتسارع بمعدل ٢ م/ث² — ما مقدار القوة المؤثرة عليه؟',
    concept: 'القانون الثاني لنيوتن',
    choices: [
      { id: 'a', text: '٢.٥ نيوتن', correct: false },
      { id: 'b', text: '١٠ نيوتن', correct: true  },
      { id: 'c', text: '٧ نيوتن',  correct: false },
      { id: 'd', text: '١٥ نيوتن', correct: false },
    ],
    explanation: 'القانون الثاني لنيوتن: ق = ك × ت ← ٥ × ٢ = ١٠ نيوتن',
  },
  {
    id: 'q2',
    subjectAr: 'الكيمياء',
    subjectColor: '#E67E22',
    initial: 'ك',
    typeAr: 'اختيار من متعدد',
    text: 'ما عدد الإلكترونات في المستوى الخارجي لذرة الكلور (العدد الذري ١٧)؟',
    concept: 'التوزيع الإلكتروني',
    choices: [
      { id: 'a', text: '٥ إلكترونات', correct: false },
      { id: 'b', text: '٦ إلكترونات', correct: false },
      { id: 'c', text: '٧ إلكترونات', correct: true  },
      { id: 'd', text: '٨ إلكترونات', correct: false },
    ],
    explanation: 'التوزيع: 2,8,7 — المستوى الخارجي الثالث يحتوي على ٧ إلكترونات',
  },
  {
    id: 'q3',
    subjectAr: 'الأحياء',
    subjectColor: '#27AE60',
    initial: 'أح',
    typeAr: 'صح أم خطأ',
    text: 'الميتوكوندريا هي الموقع الرئيسي لعملية التنفس الخلوي الهوائي.',
    concept: 'التنفس الخلوي',
    choices: [
      { id: 'a', text: 'صحيح ✓', correct: true  },
      { id: 'b', text: 'خطأ ✗',  correct: false },
    ],
    explanation: 'نعم — الميتوكوندريا هي محطة إنتاج الطاقة (ATP) في الخلية عبر التنفس الهوائي',
  },
];

const MOCK_EXAM_LIST = [
  { id: 'e1', emoji: '🏆', titleAr: 'امتحان الفيزياء النهائي ٢٠٢٣', year: '٢٠٢٣', duration: '٩٠ د', questionsCount: '٤٠', type: 'نهائي', score: null },
  { id: 'e2', emoji: '📝', titleAr: 'امتحان الكيمياء نصف السنة ٢٠٢٣', year: '٢٠٢٣', duration: '٦٠ د', questionsCount: '٣٠', type: 'نصف سنوي', score: null },
  { id: 'e3', emoji: '🗓', titleAr: 'اختبار الأحياء الشهري — أكتوبر', year: '٢٠٢٣', duration: '٤٥ د', questionsCount: '٢٠', type: 'شهري', score: null },
];

// ─── XP reward for completing a practice session ──────────────────────────────
export const QUIZ_XP_REWARD = 240; // enough to tip over a threshold when starting near one

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function QuizBankScreen({ onXpEarned }) {
  const [mode, setMode] = useState('PRACTICE'); // EXAMS | PRACTICE

  return (
    <div className="w-full pb-6" dir="rtl">
      {/* ── PulseStrip — stats header ── */}
      <PulseStrip />

      {/* ── Mode switcher ── */}
      <div className="px-4 mb-4">
        <ModeSwitcher selected={mode} onSelect={setMode} />
      </div>

      {/* ── Content ── */}
      {mode === 'PRACTICE' ? (
        <PracticeModeContent onXpEarned={onXpEarned} />
      ) : (
        <ExamsModeContent />
      )}
    </div>
  );
}

// ─── PulseStrip ───────────────────────────────────────────────────────────────
function PulseStrip() {
  return (
    <div
      className="mx-4 mb-4 rounded-2xl flex items-center justify-between px-4 py-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      <StatItem value="–" label="متوسط الدقة" color="var(--text-muted)" />
      <div style={{ width: 1, height: 36, background: 'var(--border-subtle)' }} />
      <StatItem value={toAr(1840)} label="سؤال متاح" color={ACCENT_PRACTICE} />
      <div style={{ width: 1, height: 36, background: 'var(--border-subtle)' }} />
      <StatItem value={toAr(0)} label="جلسة مكتملة" color={ACCENT_EXAM} />
    </div>
  );
}

function StatItem({ value, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'var(--font-arabic, inherit)', lineHeight: 1 }}>{value}</p>
      <p className="font-arabic" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{label}</p>
    </div>
  );
}

// ─── Mode Switcher ────────────────────────────────────────────────────────────
function ModeSwitcher({ selected, onSelect }) {
  return (
    <div
      className="flex p-1 rounded-2xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      <ModeTab
        label="الامتحانات"
        emoji="🏆"
        active={selected === 'EXAMS'}
        accent={ACCENT_EXAM}
        onClick={() => onSelect('EXAMS')}
      />
      <ModeTab
        label="التدريب"
        emoji="⚡"
        active={selected === 'PRACTICE'}
        accent={ACCENT_PRACTICE}
        onClick={() => onSelect('PRACTICE')}
      />
    </div>
  );
}

function ModeTab({ label, emoji, active, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
      style={{
        background: active ? `${accent}18` : 'transparent',
        border: `1px solid ${active ? `${accent}40` : 'transparent'}`,
        color: active ? accent : 'var(--text-muted)',
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ fontSize: 15 }}>{emoji}</span>
      {label}
    </button>
  );
}

// ─── Practice Mode Content ────────────────────────────────────────────────────
function PracticeModeContent({ onXpEarned }) {
  const [sessionState, setSessionState] = useState('idle'); // idle | active | result

  if (sessionState === 'active') {
    return <PracticeSession onFinish={(xp) => { onXpEarned?.(xp); setSessionState('result'); }} />;
  }
  if (sessionState === 'result') {
    return <PracticeResultScreen onBack={() => setSessionState('idle')} />;
  }

  return (
    <div className="px-4 flex flex-col gap-4">
      {/* Smart recommendation card */}
      <SmartRecommendationCard onStart={() => setSessionState('active')} />

      {/* Quick mode chips */}
      <QuickModeStrip onStart={() => setSessionState('active')} />

      {/* Stats note */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <span style={{ fontSize: 18 }}>📊</span>
        <div>
          <p className="font-arabic" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>إحصائيات البنك</p>
          <p className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {toAr(1840)} سؤال · {toAr(6)} مواد · {toAr(4)} أنواع أسئلة
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Smart Recommendation Card ────────────────────────────────────────────────
function SmartRecommendationCard({ onStart }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: `linear-gradient(135deg, ${ACCENT_EXAM}1A 0%, ${ACCENT_EXAM}0D 100%)`,
        border: `1px solid ${ACCENT_EXAM}40`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span style={{ fontSize: 22 }}>🧭</span>
        <div>
          <p className="font-arabic" style={{ fontSize: 13, fontWeight: 700, color: ACCENT_EXAM }}>جلسة ذكية</p>
          <p className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            ابدأ جلستك الأولى لتحديد نقاط ضعفك
          </p>
        </div>
      </div>

      {/* Tags + CTA */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <SmartTag label="جلسة تمهيدية" color={ACCENT_EXAM} />
          <SmartTag label="نقاط ضعف" color={ACCENT_EXAM} />
        </div>
        <button
          onClick={onStart}
          className="rounded-xl px-4 py-2.5 font-arabic"
          style={{
            background: ACCENT_EXAM,
            border: 'none',
            color: '#1a0f00',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 16px ${ACCENT_EXAM}40`,
          }}
        >
          ابدأ الآن
        </button>
      </div>
    </div>
  );
}

function SmartTag({ label, color }) {
  return (
    <span
      className="font-arabic rounded-full px-2.5 py-1"
      style={{ fontSize: 10, background: `${color}15`, color, border: `1px solid ${color}25` }}
    >
      {label}
    </span>
  );
}

// ─── Quick Mode Strip ─────────────────────────────────────────────────────────
function QuickModeStrip({ onStart }) {
  const chips = [
    { emoji: '⚡', label: 'مراجعة سريعة', color: ACCENT_PRACTICE },
    { emoji: '📉', label: 'نقاط الضعف',   color: SCORE_LOW       },
    { emoji: '🗂', label: 'حسب الوحدة',   color: '#2980B9'       },
    { emoji: '💡', label: 'حسب المفهوم',  color: '#E67E22'       },
    { emoji: '🔤', label: 'حسب النوع',    color: '#16A085'       },
  ];

  return (
    <div>
      <p className="font-arabic mb-2" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
        جلسات سريعة
      </p>
      <div
        className="flex gap-2.5"
        style={{ overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}
      >
        {chips.map((chip, i) => (
          <button
            key={i}
            onClick={onStart}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3"
            style={{
              background: `${chip.color}14`,
              border: `1px solid ${chip.color}28`,
              cursor: 'pointer',
              minWidth: 72,
            }}
          >
            <span style={{ fontSize: 20 }}>{chip.emoji}</span>
            <span className="font-arabic" style={{ fontSize: 10, color: chip.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {chip.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Practice Session (interactive MCQ flow) ──────────────────────────────────
function PracticeSession({ onFinish }) {
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [selected, setSelected]       = useState(null);   // choice id
  const [revealed, setRevealed]       = useState(false);
  const [answers, setAnswers]         = useState([]);     // { correct: bool }[]

  const q = PRACTICE_QUESTIONS[currentIdx];
  const isTrueFalse = q.choices.length === 2;

  function handleChoose(choiceId) {
    if (revealed) return;
    setSelected(choiceId);
    setRevealed(true);
    const isCorrect = q.choices.find(c => c.id === choiceId)?.correct ?? false;
    setAnswers(prev => [...prev, { correct: isCorrect }]);
  }

  function handleNext() {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= PRACTICE_QUESTIONS.length) {
      onFinish(QUIZ_XP_REWARD);
      return;
    }
    setCurrentIdx(nextIdx);
    setSelected(null);
    setRevealed(false);
  }

  const correctChoice = q.choices.find(c => c.correct);

  return (
    <div className="px-4 flex flex-col gap-3" dir="rtl">
      {/* Progress bar */}
      <div className="flex gap-1.5 items-center">
        {PRACTICE_QUESTIONS.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full"
            style={{
              background: i < currentIdx ? ACCENT_PRACTICE
                        : i === currentIdx ? `${ACCENT_PRACTICE}80`
                        : 'var(--border-subtle)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'monospace', marginRight: 4 }}>
          {toAr(currentIdx + 1)}/{toAr(PRACTICE_QUESTIONS.length)}
        </span>
      </div>

      {/* Question card */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Subject + type row */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: `${q.subjectColor}18`, fontSize: 9, fontWeight: 700, color: q.subjectColor, fontFamily: 'var(--font-arabic, inherit)' }}
          >
            {q.initial}
          </div>
          <span className="font-arabic" style={{ fontSize: 11, color: q.subjectColor, fontWeight: 600 }}>{q.subjectAr}</span>
          <span className="font-arabic mr-auto" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{q.typeAr}</span>
        </div>

        {/* Concept tag */}
        <div
          className="inline-block rounded-full px-2.5 py-0.5 mb-2.5 font-arabic"
          style={{ fontSize: 10, background: `${ACCENT_PRACTICE}12`, color: ACCENT_PRACTICE, border: `1px solid ${ACCENT_PRACTICE}25` }}
        >
          {q.concept}
        </div>

        {/* Question text */}
        <p className="font-arabic leading-relaxed" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
          {q.text}
        </p>
      </div>

      {/* Choices */}
      <div className="flex flex-col gap-2">
        {q.choices.map((choice) => {
          const isSelected  = selected === choice.id;
          const isCorrect   = choice.correct;
          let borderColor   = 'var(--border-subtle)';
          let bgColor       = 'var(--bg-card)';
          let textColor     = 'var(--text-primary)';
          let labelColor    = 'var(--text-muted)';

          if (revealed) {
            if (isCorrect) {
              borderColor = `${SCORE_HIGH}60`;
              bgColor     = `${SCORE_HIGH}10`;
              textColor   = SCORE_HIGH;
              labelColor  = SCORE_HIGH;
            } else if (isSelected && !isCorrect) {
              borderColor = `${SCORE_LOW}60`;
              bgColor     = `${SCORE_LOW}10`;
              textColor   = SCORE_LOW;
              labelColor  = SCORE_LOW;
            }
          } else if (isSelected) {
            borderColor = `${ACCENT_PRACTICE}60`;
            bgColor     = `${ACCENT_PRACTICE}10`;
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleChoose(choice.id)}
              className="rounded-xl px-3.5 py-3 flex items-center gap-2.5 text-right w-full"
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                cursor: revealed ? 'default' : 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Choice indicator */}
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{
                  border: `1.5px solid ${labelColor}`,
                  background: revealed && isCorrect ? SCORE_HIGH : revealed && isSelected && !isCorrect ? SCORE_LOW : 'transparent',
                  transition: 'all 0.25s ease',
                }}
              >
                {revealed && isCorrect && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
                {revealed && isSelected && !isCorrect && (
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <span className="font-arabic flex-1" style={{ fontSize: 12, color: textColor, fontWeight: isSelected || (revealed && isCorrect) ? 600 : 400, textAlign: 'right' }}>
                {choice.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation (after reveal) */}
      {revealed && (
        <div
          style={{
            background: selected === correctChoice.id ? `${SCORE_HIGH}0D` : `${SCORE_LOW}0D`,
            border: `1px solid ${selected === correctChoice.id ? SCORE_HIGH : SCORE_LOW}30`,
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>{selected === correctChoice.id ? '✅' : '📖'}</span>
          <p className="font-arabic" style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {q.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {revealed && (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-2xl font-arabic"
          style={{
            background: ACCENT_PRACTICE,
            border: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 16px ${ACCENT_PRACTICE}40`,
          }}
        >
          {currentIdx + 1 >= PRACTICE_QUESTIONS.length ? 'إنهاء الجلسة ←' : 'السؤال التالي ←'}
        </button>
      )}
    </div>
  );
}

// ─── Practice Result Screen ───────────────────────────────────────────────────
function PracticeResultScreen({ onBack }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div
      className="px-4 flex flex-col items-center gap-4 pt-4"
      dir="rtl"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.4s ease' }}
    >
      {/* Score ring */}
      <div
        className="flex flex-col items-center gap-2 rounded-2xl p-6 w-full"
        style={{ background: 'var(--bg-card)', border: `1px solid ${SCORE_HIGH}40` }}
      >
        <div style={{ position: 'relative', width: 88, height: 88 }}>
          <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="44" cy="44" r="36" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
            <circle
              cx="44" cy="44" r="36"
              fill="none"
              stroke={SCORE_HIGH}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="226"
              strokeDashoffset={visible ? 226 * (1 - 2/3) : 226}
              style={{ transition: 'stroke-dashoffset 1s ease 0.2s' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: SCORE_HIGH, fontFamily: 'var(--font-arabic, inherit)' }}>
              {toAr(2)}/{toAr(3)}
            </span>
            <span className="font-arabic" style={{ fontSize: 9, color: 'var(--text-muted)' }}>إجابة صحيحة</span>
          </div>
        </div>

        <p className="font-arabic" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
          أداء ممتاز! 🎉
        </p>
        <p className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          أجبت على {toAr(2)} من {toAr(3)} أسئلة بشكل صحيح
        </p>

        {/* XP badge */}
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ background: `${ACCENT_EXAM}15`, border: `1px solid ${ACCENT_EXAM}35` }}
        >
          <span style={{ fontSize: 16 }}>⭐</span>
          <span className="font-arabic" style={{ fontSize: 12, fontWeight: 700, color: ACCENT_EXAM }}>
            +{toAr(240)} نقطة خبرة
          </span>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="w-full py-3 rounded-2xl font-arabic"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ← العودة للبنك
      </button>
    </div>
  );
}

// ─── Exams Mode Content (locked with overlay) ─────────────────────────────────
function ExamsModeContent() {
  const [sourceFilter, setSourceFilter] = useState(null);

  return (
    <div className="px-4 flex flex-col gap-3" style={{ position: 'relative' }}>
      {/* Filter chips */}
      <div className="flex gap-2" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { label: 'الكل',   value: null       },
          { label: 'وزارة',  value: 'MINISTRY' },
          { label: 'مدارس',  value: 'SCHOOL'   },
        ].map(f => (
          <button
            key={f.label}
            className="flex-shrink-0 rounded-full px-3 py-1.5 font-arabic"
            style={{
              fontSize: 11,
              background: sourceFilter === f.value ? `${ACCENT_EXAM}18` : 'var(--bg-card)',
              border: `1px solid ${sourceFilter === f.value ? `${ACCENT_EXAM}40` : 'var(--border-subtle)'}`,
              color: sourceFilter === f.value ? ACCENT_EXAM : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Exam cards (blurred behind overlay) */}
      {MOCK_EXAM_LIST.map((exam) => (
        <div
          key={exam.id}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            filter: 'blur(1.5px)',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          <div
            className="rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ width: 44, height: 44, background: `${ACCENT_EXAM}15`, fontSize: 20 }}
          >
            {exam.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <p className="font-arabic" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{exam.titleAr}</p>
            <div className="flex gap-2">
              <MetaChip icon="📅" label={exam.year} />
              <MetaChip icon="⏱" label={exam.duration} />
              <MetaChip icon="📋" label={`${exam.questionsCount} سؤال`} />
            </div>
          </div>
        </div>
      ))}

      {/* Lock overlay */}
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(14,12,9,0.72)',
          backdropFilter: 'blur(2px)',
          borderRadius: 16,
          zIndex: 10,
        }}
      >
        <div
          className="rounded-2xl px-6 py-5 flex flex-col items-center gap-2.5 text-center"
          style={{ background: 'var(--bg-card)', border: `1px solid ${ACCENT_EXAM}30`, maxWidth: 200 }}
        >
          <span style={{ fontSize: 28 }}>🔒</span>
          <p className="font-arabic" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            قريباً
          </p>
          <p className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            امتحانات وزارية ومدرسية من السنوات الماضية — قادمة قريباً.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetaChip({ icon, label }) {
  return (
    <span
      className="font-arabic flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{ fontSize: 9, background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
    >
      <span>{icon}</span>{label}
    </span>
  );
}