'use client';
import { useState, useEffect } from 'react';

// ─── Design tokens matching Android QuizbankDesignSystem ─────────────────────
const ACCENT_EXAM     = '#F59E0B';
const ACCENT_PRACTICE = '#0EA5E9';
const SCORE_HIGH      = '#10B981';
const SCORE_MID       = '#F59E0B';
const SCORE_LOW       = '#EF4444';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE QUESTIONS — showcasing all question types
// ─────────────────────────────────────────────────────────────────────────────

const PRACTICE_QUESTIONS = [
  // ── 1. MCQ (standard) ────────────────────────────────────────────────────
  {
    id: 'q1',
    type: 'MCQ',
    subjectAr: 'الفيزياء',
    subjectColor: '#4A90D9',
    initial: 'ف',
    typeAr: 'اختيار من متعدد',
    text: 'جسم كتلته ٥ كغ يتسارع بمعدل ٢ م/ث² — ما مقدار القوة المؤثرة عليه؟',
    concept: 'القانون الثاني لنيوتن',
    choices: [
      { id: 'a', text: '٢.٥ نيوتن', correct: false },
      { id: 'b', text: '١٠ نيوتن',  correct: true  },
      { id: 'c', text: '٧ نيوتن',   correct: false },
      { id: 'd', text: '١٥ نيوتن',  correct: false },
    ],
    explanation: 'القانون الثاني لنيوتن: ق = ك × ت → ٥ × ٢ = ١٠ نيوتن',
  },

  // ── 2. TABLE — read values and identify pattern ───────────────────────────
  {
    id: 'q2',
    type: 'TABLE',
    subjectAr: 'الفيزياء',
    subjectColor: '#4A90D9',
    initial: 'ف',
    typeAr: 'سؤال جدول',
    concept: 'القانون الثاني لنيوتن',
    text: 'ادرس الجدول التالي ثم اختر العبارة الصحيحة.',
    tableHeaders: ['الكتلة (كغ)', 'القوة (ن)', 'التسارع (م/ث²)'],
    tableRows: [
      ['٢', '١٠', '٥'],
      ['٤', '١٠', '٢.٥'],
      ['٥', '١٠', '٢'],
      ['١٠', '١٠', '?'],
    ],
    choices: [
      { id: 'a', text: 'التسارع في الصف الأخير = ٥ م/ث²',  correct: false },
      { id: 'b', text: 'التسارع في الصف الأخير = ١ م/ث²',  correct: true  },
      { id: 'c', text: 'التسارع في الصف الأخير = ٢ م/ث²',  correct: false },
      { id: 'd', text: 'التسارع في الصف الأخير = ٠.٥ م/ث²', correct: false },
    ],
    explanation: 'عند ثبات القوة، التسارع = ق ÷ ك = ١٠ ÷ ١٠ = ١ م/ث². كلما ضاعفت الكتلة، تناصف التسارع.',
  },

  // ── 3. SORT — arrange events chronologically ──────────────────────────────
  {
    id: 'q3',
    type: 'SORT',
    subjectAr: 'التاريخ',
    subjectColor: '#C0392B',
    initial: 'ت',
    typeAr: 'رتّب بالترتيب',
    concept: 'الثورة المهدية',
    text: 'رتّب أحداث الثورة المهدية من الأقدم إلى الأحدث.',
    items: [
      { id: 's1', text: 'معركة أم درمان ونهاية الدولة المهدية',  correctOrder: 4 },
      { id: 's2', text: 'إعلان المهدية من جزيرة أبا',             correctOrder: 1 },
      { id: 's3', text: 'سقوط الخرطوم ومقتل غردون باشا',          correctOrder: 3 },
      { id: 's4', text: 'هزيمة هيكس باشا في معركة شيكان',         correctOrder: 2 },
    ],
    explanation: 'الترتيب الصحيح: جزيرة أبا ١٨٨١ ← شيكان ١٨٨٣ ← سقوط الخرطوم ١٨٨٥ ← أم درمان ١٨٩٨.',
  },

  // ── 4. COMPARE — two-column matching ─────────────────────────────────────
  {
    id: 'q4',
    type: 'COMPARE',
    subjectAr: 'التاريخ',
    subjectColor: '#C0392B',
    initial: 'ت',
    typeAr: 'مقارنة',
    concept: 'الثورة المهدية vs ثورة عرابي',
    text: 'طابق كل وصف بالثورة المناسبة.',
    leftLabel:  'الثورة المهدية',
    rightLabel: 'ثورة عرابي',
    pairs: [
      { id: 'c1', text: 'قامت في السودان',              correct: 'LEFT'  },
      { id: 'c2', text: 'قامت في مصر',                  correct: 'RIGHT' },
      { id: 'c3', text: 'أسست دولة مستقلة فعلياً',      correct: 'LEFT'  },
      { id: 'c4', text: 'قمعتها القوات البريطانية ١٨٨٢', correct: 'RIGHT' },
    ],
    explanation: 'الثورة المهدية: السودان، أسست دولة عاشت ١٣ عاماً. ثورة عرابي: مصر، قمعتها بريطانيا عام ١٨٨٢.',
  },

  // ── 5. SELF_EVAL — explain/mention-two open question ─────────────────────
  {
    id: 'q5',
    type: 'SELF_EVAL',
    subjectAr: 'الأحياء',
    subjectColor: '#27AE60',
    initial: 'أح',
    typeAr: 'تقييم ذاتي',
    concept: 'التنفس الخلوي',
    text: 'اذكر سببَين يجعلان الميتوكوندريا تختلف عن سائر العضيات الخلوية، ثم قيّم إجابتك.',
    hints: [
      'تملك DNA خاصاً بها',
      'تملك غشاءً مزدوجاً (غشاء داخلي ومطوي)',
      'تنقسم باستقلالية عن انقسام الخلية',
      'نظرية الطفيل الداخلي: كانت بكتيريا مستقلة',
    ],
    selfRubric: [
      { label: 'ذكرت نقطتين صحيحتين', points: '٢' },
      { label: 'ذكرت نقطة واحدة صحيحة', points: '١' },
      { label: 'لم أتذكر — سأراجع الدرس', points: '٠' },
    ],
  },

  // ── 6. IMAGE_MARKER — tap regions on diagram ─────────────────────────────
  {
    id: 'q6',
    type: 'IMAGE_MARKER',
    subjectAr: 'الأحياء',
    subjectColor: '#27AE60',
    initial: 'أح',
    typeAr: 'تفاعل مع الصورة',
    concept: 'مكونات الخلية الحيوانية',
    text: 'طابق كل رقم في الرسم بالعضية الصحيحة.',
    // Placeholder cell diagram — markers reference relative positions
    imagePlaceholder: { color: '#27AE60', label: 'مقطع تخطيطي للخلية الحيوانية' },
    markers: [
      { id: 'm1', x: 0.50, y: 0.45, label: '١', answer: 'النواة' },
      { id: 'm2', x: 0.72, y: 0.35, label: '٢', answer: 'الميتوكوندريا' },
      { id: 'm3', x: 0.30, y: 0.65, label: '٣', answer: 'الريبوسوم' },
      { id: 'm4', x: 0.60, y: 0.70, label: '٤', answer: 'الشبكة الإندوبلازمية' },
    ],
    // Multiple choice per marker for demo interactivity
    choices: [
      { id: 'a', text: '١ = النواة · ٢ = الميتوكوندريا',          correct: true  },
      { id: 'b', text: '١ = الميتوكوندريا · ٢ = النواة',          correct: false },
      { id: 'c', text: '١ = الريبوسوم · ٢ = الشبكة الإندوبلازمية', correct: false },
    ],
    explanation: 'النواة دائماً في مركز الخلية (١)، والميتوكوندريا أكبر من الريبوسومات وبيضاوية الشكل (٢).',
  },

  // ── 7. TRUE/FALSE ─────────────────────────────────────────────────────────
  {
    id: 'q7',
    type: 'MCQ',
    subjectAr: 'الكيمياء',
    subjectColor: '#E67E22',
    initial: 'ك',
    typeAr: 'صح أم خطأ',
    text: 'ذرة الكلور (العدد الذري ١٧) تحتوي على ٧ إلكترونات في مستواها الخارجي.',
    concept: 'التوزيع الإلكتروني',
    choices: [
      { id: 'a', text: 'صحيح ✓', correct: true  },
      { id: 'b', text: 'خطأ ✗',  correct: false },
    ],
    explanation: 'التوزيع الإلكتروني: 2,8,7 — المستوى الثالث يحمل ٧ إلكترونات ويحتاج ١ لاكتماله.',
  },
];

export const QUIZ_XP_REWARD = 240;

const MOCK_EXAM_LIST = [
  { id: 'e1', emoji: '🏆', titleAr: 'امتحان الفيزياء النهائي ٢٠٢٣', year: '٢٠٢٣', duration: '٩٠ د', questionsCount: '٤٠', type: 'نهائي', score: null },
  { id: 'e2', emoji: '📝', titleAr: 'امتحان الكيمياء نصف السنة ٢٠٢٣', year: '٢٠٢٣', duration: '٦٠ د', questionsCount: '٣٠', type: 'نصف سنوي', score: null },
  { id: 'e3', emoji: '🗓', titleAr: 'اختبار الأحياء الشهري — أكتوبر', year: '٢٠٢٣', duration: '٤٥ د', questionsCount: '٢٠', type: 'شهري', score: null },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function QuizBankScreen({ onXpEarned }) {
  const [mode, setMode] = useState('PRACTICE');
  return (
    <div className="w-full pb-6" dir="rtl">
      <PulseStrip />
      <div className="px-4 mb-4">
        <ModeSwitcher selected={mode} onSelect={setMode} />
      </div>
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
    <div className="mx-4 mb-4 rounded-2xl flex items-center justify-between px-4 py-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
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
    <div className="flex p-1 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <ModeTab label="الامتحانات" emoji="🏆" active={selected === 'EXAMS'} accent={ACCENT_EXAM} onClick={() => onSelect('EXAMS')} />
      <ModeTab label="التدريب" emoji="⚡" active={selected === 'PRACTICE'} accent={ACCENT_PRACTICE} onClick={() => onSelect('PRACTICE')} />
    </div>
  );
}

function ModeTab({ label, emoji, active, accent, onClick }) {
  return (
    <button onClick={onClick} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
      style={{
        background: active ? `${accent}18` : 'transparent',
        border: `1px solid ${active ? `${accent}40` : 'transparent'}`,
        color: active ? accent : 'var(--text-muted)',
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
      }}>
      <span style={{ fontSize: 15 }}>{emoji}</span>
      {label}
    </button>
  );
}

// ─── Practice Mode ────────────────────────────────────────────────────────────
function PracticeModeContent({ onXpEarned }) {
  const [sessionState, setSessionState] = useState('idle');
  if (sessionState === 'active') {
    return <PracticeSession onFinish={(xp) => { onXpEarned?.(xp); setSessionState('result'); }} />;
  }
  if (sessionState === 'result') {
    return <PracticeResultScreen onBack={() => setSessionState('idle')} />;
  }
  return (
    <div className="px-4 flex flex-col gap-4">
      <SmartRecommendationCard onStart={() => setSessionState('active')} />
      <QuickModeStrip onStart={() => setSessionState('active')} />
      <div className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 18 }}>📊</span>
        <div>
          <p className="font-arabic" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>إحصائيات البنك</p>
          <p className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {toAr(1840)} سؤال · {toAr(6)} مواد · {toAr(6)} أنواع أسئلة
          </p>
        </div>
      </div>
    </div>
  );
}

function SmartRecommendationCard({ onStart }) {
  return (
    <div className="rounded-2xl p-4"
      style={{ background: `linear-gradient(135deg, ${ACCENT_EXAM}1A 0%, ${ACCENT_EXAM}0D 100%)`, border: `1px solid ${ACCENT_EXAM}40` }}>
      <div className="flex items-center gap-2.5 mb-3">
        <span style={{ fontSize: 22 }}>🧭</span>
        <div>
          <p className="font-arabic" style={{ fontSize: 13, fontWeight: 700, color: ACCENT_EXAM }}>جلسة ذكية</p>
          <p className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            ابدأ جلستك الأولى لتحديد نقاط ضعفك
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <SmartTag label="جلسة تمهيدية" color={ACCENT_EXAM} />
          <SmartTag label="نقاط ضعف" color={ACCENT_EXAM} />
        </div>
        <button onClick={onStart} className="rounded-xl px-4 py-2.5 font-arabic"
          style={{ background: ACCENT_EXAM, border: 'none', color: '#1a0f00', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px ${ACCENT_EXAM}40` }}>
          ابدأ الآن
        </button>
      </div>
    </div>
  );
}

function SmartTag({ label, color }) {
  return (
    <span className="font-arabic rounded-full px-2.5 py-1"
      style={{ fontSize: 10, background: `${color}15`, color, border: `1px solid ${color}25` }}>
      {label}
    </span>
  );
}

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
      <p className="font-arabic mb-2" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>جلسات سريعة</p>
      <div className="flex gap-2.5" style={{ overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {chips.map((chip, i) => (
          <button key={i} onClick={onStart}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3"
            style={{ background: `${chip.color}14`, border: `1px solid ${chip.color}28`, cursor: 'pointer', minWidth: 72 }}>
            <span style={{ fontSize: 20 }}>{chip.emoji}</span>
            <span className="font-arabic" style={{ fontSize: 10, color: chip.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Practice Session — multi-type question renderer ─────────────────────────
function PracticeSession({ onFinish }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered]     = useState(false);
  const [correct, setCorrect]       = useState(false);
  const [answers, setAnswers]       = useState([]);

  const q = PRACTICE_QUESTIONS[currentIdx];

  function markAnswer(isCorrect) {
    if (answered) return;
    setAnswered(true);
    setCorrect(isCorrect);
    setAnswers(prev => [...prev, { correct: isCorrect }]);
  }

  function handleNext() {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= PRACTICE_QUESTIONS.length) {
      onFinish(QUIZ_XP_REWARD);
      return;
    }
    setCurrentIdx(nextIdx);
    setAnswered(false);
    setCorrect(false);
  }

  return (
    <div className="px-4 flex flex-col gap-3" dir="rtl">
      {/* Progress bar */}
      <div className="flex gap-1.5 items-center">
        {PRACTICE_QUESTIONS.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full"
            style={{
              background: i < currentIdx ? ACCENT_PRACTICE
                        : i === currentIdx ? `${ACCENT_PRACTICE}80`
                        : 'var(--border-subtle)',
              transition: 'background 0.3s ease',
            }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'monospace', marginRight: 4 }}>
          {toAr(currentIdx + 1)}/{toAr(PRACTICE_QUESTIONS.length)}
        </span>
      </div>

      {/* Type badge */}
      <QuestionMeta q={q} />

      {/* Question body — switches by type */}
      {q.type === 'MCQ'          && <McqQuestion      q={q} answered={answered} onAnswer={markAnswer} />}
      {q.type === 'TABLE'        && <TableQuestion    q={q} answered={answered} onAnswer={markAnswer} />}
      {q.type === 'SORT'         && <SortQuestion     q={q} answered={answered} onAnswer={markAnswer} />}
      {q.type === 'COMPARE'      && <CompareQuestion  q={q} answered={answered} onAnswer={markAnswer} />}
      {q.type === 'SELF_EVAL'    && <SelfEvalQuestion q={q} answered={answered} onAnswer={markAnswer} />}
      {q.type === 'IMAGE_MARKER' && <ImageMarkerQuestion q={q} answered={answered} onAnswer={markAnswer} />}

      {/* Explanation */}
      {answered && q.explanation && (
        <div style={{
          background: correct ? `${SCORE_HIGH}0D` : `${SCORE_LOW}0D`,
          border: `1px solid ${correct ? SCORE_HIGH : SCORE_LOW}30`,
          borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{correct ? '✅' : '📖'}</span>
          <p className="font-arabic" style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {q.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {answered && (
        <button onClick={handleNext} className="w-full py-3 rounded-2xl font-arabic"
          style={{ background: ACCENT_PRACTICE, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px ${ACCENT_PRACTICE}40` }}>
          {currentIdx + 1 >= PRACTICE_QUESTIONS.length ? 'إنهاء الجلسة ←' : 'السؤال التالي ←'}
        </button>
      )}
    </div>
  );
}

function QuestionMeta({ q }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${q.subjectColor}18`, fontSize: 9, fontWeight: 700, color: q.subjectColor, fontFamily: 'var(--font-arabic, inherit)' }}>
          {q.initial}
        </div>
        <span className="font-arabic" style={{ fontSize: 11, color: q.subjectColor, fontWeight: 600 }}>{q.subjectAr}</span>
        <span className="font-arabic mr-auto" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{q.typeAr}</span>
      </div>
      <div className="inline-block rounded-full px-2.5 py-0.5 mb-2.5 font-arabic"
        style={{ fontSize: 10, background: `${ACCENT_PRACTICE}12`, color: ACCENT_PRACTICE, border: `1px solid ${ACCENT_PRACTICE}25` }}>
        {q.concept}
      </div>
      <p className="font-arabic leading-relaxed" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
        {q.text}
      </p>
    </div>
  );
}

// ── MCQ (standard choices) ────────────────────────────────────────────────────
function McqQuestion({ q, answered, onAnswer }) {
  const [selected, setSelected] = useState(null);

  function handleChoose(choiceId) {
    if (answered) return;
    setSelected(choiceId);
    const isCorrect = q.choices.find(c => c.id === choiceId)?.correct ?? false;
    onAnswer(isCorrect);
  }

  return (
    <div className="flex flex-col gap-2">
      {q.choices.map((choice) => {
        const isSelected = selected === choice.id;
        const isCorrect  = choice.correct;
        let borderColor  = 'var(--border-subtle)', bgColor = 'var(--bg-card)', textColor = 'var(--text-primary)', labelColor = 'var(--text-muted)';
        if (answered) {
          if (isCorrect)                    { borderColor = `${SCORE_HIGH}60`; bgColor = `${SCORE_HIGH}10`; textColor = SCORE_HIGH; labelColor = SCORE_HIGH; }
          else if (isSelected && !isCorrect){ borderColor = `${SCORE_LOW}60`;  bgColor = `${SCORE_LOW}10`;  textColor = SCORE_LOW;  labelColor = SCORE_LOW;  }
        } else if (isSelected) {
          borderColor = `${ACCENT_PRACTICE}60`; bgColor = `${ACCENT_PRACTICE}10`;
        }
        return (
          <button key={choice.id} onClick={() => handleChoose(choice.id)}
            className="rounded-xl px-3.5 py-3 flex items-center gap-2.5 text-right w-full"
            style={{ background: bgColor, border: `1px solid ${borderColor}`, cursor: answered ? 'default' : 'pointer', transition: 'all 0.25s ease' }}>
            <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ border: `1.5px solid ${labelColor}`, background: answered && isCorrect ? SCORE_HIGH : answered && isSelected && !isCorrect ? SCORE_LOW : 'transparent', transition: 'all 0.25s ease' }}>
              {answered && isCorrect && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>}
              {answered && isSelected && !isCorrect && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            </div>
            <span className="font-arabic flex-1" style={{ fontSize: 12, color: textColor, fontWeight: isSelected || (answered && isCorrect) ? 600 : 400, textAlign: 'right' }}>
              {choice.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── TABLE question ────────────────────────────────────────────────────────────
function TableQuestion({ q, answered, onAnswer }) {
  const [selected, setSelected] = useState(null);

  function handleChoose(id) {
    if (answered) return;
    setSelected(id);
    const isCorrect = q.choices.find(c => c.id === id)?.correct ?? false;
    onAnswer(isCorrect);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
          <thead>
            <tr style={{ background: `${ACCENT_PRACTICE}14` }}>
              {q.tableHeaders.map((h, i) => (
                <th key={i} className="font-arabic" style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700, color: ACCENT_PRACTICE, textAlign: 'center', borderBottom: `1px solid ${ACCENT_PRACTICE}25` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.tableRows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} className="font-arabic" style={{
                    padding: '7px 10px', fontSize: 12, textAlign: 'center', color: cell === '?' ? ACCENT_EXAM : 'var(--text-primary)',
                    fontWeight: cell === '?' ? 800 : 400,
                    borderBottom: `1px solid var(--border-subtle)`,
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Choices */}
      <div className="flex flex-col gap-2">
        {q.choices.map((choice) => {
          const isSelected = selected === choice.id;
          const isCorrect  = choice.correct;
          let borderColor = 'var(--border-subtle)', bgColor = 'var(--bg-card)', textColor = 'var(--text-primary)';
          if (answered) {
            if (isCorrect)                    { borderColor = `${SCORE_HIGH}60`; bgColor = `${SCORE_HIGH}10`; textColor = SCORE_HIGH; }
            else if (isSelected && !isCorrect){ borderColor = `${SCORE_LOW}60`;  bgColor = `${SCORE_LOW}10`;  textColor = SCORE_LOW;  }
          } else if (isSelected) {
            borderColor = `${ACCENT_PRACTICE}60`; bgColor = `${ACCENT_PRACTICE}10`;
          }
          return (
            <button key={choice.id} onClick={() => handleChoose(choice.id)}
              className="rounded-xl px-3.5 py-3 w-full text-right font-arabic"
              style={{ background: bgColor, border: `1px solid ${borderColor}`, cursor: answered ? 'default' : 'pointer', color: textColor, fontSize: 12, transition: 'all 0.25s ease' }}>
              {choice.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── SORT question — drag-style reordering with up/down arrows ─────────────────
function SortQuestion({ q, answered, onAnswer }) {
  const [items, setItems] = useState(() =>
    [...q.items].sort(() => Math.random() - 0.5)
  );
  const [submitted, setSubmitted] = useState(false);

  function move(index, dir) {
    if (answered) return;
    const next = [...items];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setItems(next);
  }

  function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    const isCorrect = items.every((item, i) => item.correctOrder === i + 1);
    onAnswer(isCorrect);
  }

  function itemStatus(item, index) {
    if (!answered) return null;
    return item.correctOrder === index + 1 ? 'correct' : 'wrong';
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const status = itemStatus(item, i);
        const borderColor = !answered ? 'var(--border-subtle)' : status === 'correct' ? `${SCORE_HIGH}60` : `${SCORE_LOW}60`;
        const bgColor     = !answered ? 'var(--bg-card)'       : status === 'correct' ? `${SCORE_HIGH}10` : `${SCORE_LOW}10`;
        const textColor   = !answered ? 'var(--text-primary)'  : status === 'correct' ? SCORE_HIGH        : SCORE_LOW;
        return (
          <div key={item.id} className="rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{ background: bgColor, border: `1px solid ${borderColor}`, transition: 'all 0.25s ease' }}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} disabled={answered}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: answered ? 'default' : 'pointer', fontSize: 10, lineHeight: 1, padding: '1px 3px' }}>▲</button>
              <button onClick={() => move(i, 1)} disabled={answered}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: answered ? 'default' : 'pointer', fontSize: 10, lineHeight: 1, padding: '1px 3px' }}>▼</button>
            </div>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: answered ? (status === 'correct' ? SCORE_HIGH : SCORE_LOW) : `${ACCENT_PRACTICE}20`, fontSize: 10, fontWeight: 800, color: answered ? '#fff' : ACCENT_PRACTICE, fontFamily: 'monospace' }}>
              {toAr(i + 1)}
            </div>
            <span className="font-arabic flex-1" style={{ fontSize: 12, color: textColor, textAlign: 'right' }}>{item.text}</span>
          </div>
        );
      })}
      {!answered && (
        <button onClick={handleSubmit} className="w-full py-2.5 rounded-xl font-arabic mt-1"
          style={{ background: `${ACCENT_PRACTICE}18`, border: `1px solid ${ACCENT_PRACTICE}40`, color: ACCENT_PRACTICE, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          تأكيد الترتيب ✓
        </button>
      )}
    </div>
  );
}

// ── COMPARE question — assign each item to left or right column ───────────────
function CompareQuestion({ q, answered, onAnswer }) {
  const [assignments, setAssignments] = useState({});

  function assign(pairId, side) {
    if (answered) return;
    setAssignments(prev => ({ ...prev, [pairId]: side }));
  }

  function handleSubmit() {
    const allAssigned = q.pairs.every(p => assignments[p.id]);
    if (!allAssigned) return;
    const isCorrect = q.pairs.every(p => assignments[p.id] === p.correct);
    onAnswer(isCorrect);
  }

  const allAssigned = q.pairs.every(p => assignments[p.id]);

  return (
    <div className="flex flex-col gap-3">
      {/* Column headers */}
      <div className="flex gap-2">
        {[q.leftLabel, q.rightLabel].map((label, i) => (
          <div key={i} className="flex-1 rounded-xl py-2 text-center font-arabic"
            style={{ background: i === 0 ? `${ACCENT_PRACTICE}15` : `${ACCENT_EXAM}15`, border: `1px solid ${i === 0 ? ACCENT_PRACTICE : ACCENT_EXAM}30`, fontSize: 11, fontWeight: 700, color: i === 0 ? ACCENT_PRACTICE : ACCENT_EXAM }}>
            {label}
          </div>
        ))}
      </div>

      {/* Pairs */}
      {q.pairs.map((pair) => {
        const val = assignments[pair.id];
        const isCorrect = answered && val === pair.correct;
        const isWrong   = answered && val && val !== pair.correct;
        return (
          <div key={pair.id} className="flex flex-col gap-1.5 rounded-xl p-2.5"
            style={{ background: !answered ? 'var(--bg-card)' : isCorrect ? `${SCORE_HIGH}10` : `${SCORE_LOW}10`, border: `1px solid ${!answered ? 'var(--border-subtle)' : isCorrect ? `${SCORE_HIGH}40` : `${SCORE_LOW}40`}`, transition: 'all 0.25s' }}>
            <p className="font-arabic" style={{ fontSize: 12, color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>{pair.text}</p>
            <div className="flex gap-2">
              {['LEFT', 'RIGHT'].map((side, si) => {
                const label   = si === 0 ? q.leftLabel : q.rightLabel;
                const accent  = si === 0 ? ACCENT_PRACTICE : ACCENT_EXAM;
                const isChosen = val === side;
                return (
                  <button key={side} onClick={() => assign(pair.id, side)}
                    className="flex-1 rounded-lg py-1.5 font-arabic"
                    style={{
                      fontSize: 10, cursor: answered ? 'default' : 'pointer',
                      background: isChosen ? (answered ? (isCorrect ? `${SCORE_HIGH}20` : `${SCORE_LOW}20`) : `${accent}20`) : 'transparent',
                      border: `1px solid ${isChosen ? (answered ? (isCorrect ? SCORE_HIGH : SCORE_LOW) : accent) : 'var(--border-subtle)'}`,
                      color: isChosen ? (answered ? (isCorrect ? SCORE_HIGH : SCORE_LOW) : accent) : 'var(--text-muted)',
                      fontWeight: isChosen ? 700 : 400,
                      transition: 'all 0.2s',
                    }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!answered && (
        <button onClick={handleSubmit} disabled={!allAssigned} className="w-full py-2.5 rounded-xl font-arabic mt-1"
          style={{ background: allAssigned ? `${ACCENT_PRACTICE}18` : 'var(--bg-card)', border: `1px solid ${allAssigned ? `${ACCENT_PRACTICE}40` : 'var(--border-subtle)'}`, color: allAssigned ? ACCENT_PRACTICE : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: allAssigned ? 'pointer' : 'default', transition: 'all 0.2s' }}>
          تأكيد المطابقة ✓
        </button>
      )}
    </div>
  );
}

// ── SELF_EVAL — show hints, student picks their score ────────────────────────
function SelfEvalQuestion({ q, answered, onAnswer }) {
  const [showHints, setShowHints] = useState(false);
  const [picked, setPicked]       = useState(null);

  function handlePick(idx) {
    if (answered) return;
    setPicked(idx);
    // Self-eval: first two rubric options count as "correct" for XP purposes
    onAnswer(idx < 2);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Think zone */}
      <div className="rounded-xl p-4" style={{ background: `${ACCENT_EXAM}0D`, border: `1px dashed ${ACCENT_EXAM}40` }}>
        <p className="font-arabic" style={{ fontSize: 11, color: ACCENT_EXAM, fontWeight: 600, marginBottom: 6 }}>💭 فكّر في الإجابة أولاً...</p>
        <button onClick={() => setShowHints(!showHints)}
          className="font-arabic rounded-lg px-3 py-1.5"
          style={{ background: `${ACCENT_EXAM}15`, border: `1px solid ${ACCENT_EXAM}30`, color: ACCENT_EXAM, fontSize: 11, cursor: 'pointer' }}>
          {showHints ? 'إخفاء التلميحات' : 'عرض التلميحات'}
        </button>
        {showHints && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {q.hints.map((h, i) => (
              <li key={i} className="font-arabic flex items-start gap-2" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                <span style={{ color: SCORE_HIGH, flexShrink: 0 }}>•</span>{h}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Self-rubric */}
      <p className="font-arabic" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>قيّم إجابتك:</p>
      {q.selfRubric.map((r, i) => {
        const isChosen = picked === i;
        const borderColor = !answered ? (isChosen ? `${ACCENT_PRACTICE}60` : 'var(--border-subtle)') : isChosen && i < 2 ? `${SCORE_HIGH}60` : isChosen ? `${SCORE_LOW}60` : 'var(--border-subtle)';
        const bgColor     = !answered ? (isChosen ? `${ACCENT_PRACTICE}10` : 'var(--bg-card)') : isChosen && i < 2 ? `${SCORE_HIGH}10` : isChosen ? `${SCORE_LOW}10` : 'var(--bg-card)';
        return (
          <button key={i} onClick={() => handlePick(i)}
            className="rounded-xl px-3.5 py-3 flex items-center gap-3 w-full"
            style={{ background: bgColor, border: `1px solid ${borderColor}`, cursor: answered ? 'default' : 'pointer', transition: 'all 0.2s' }}>
            <div className="rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0"
              style={{ background: `${ACCENT_EXAM}15`, fontSize: 12, fontWeight: 800, color: ACCENT_EXAM, fontFamily: 'monospace' }}>
              {r.points}
            </div>
            <span className="font-arabic flex-1 text-right" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: isChosen ? 600 : 400 }}>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── IMAGE_MARKER question — visual cell diagram with pin labels ───────────────
function ImageMarkerQuestion({ q, answered, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  function handleChoose(id) {
    if (answered) return;
    setSelected(id);
    const isCorrect = q.choices.find(c => c.id === id)?.correct ?? false;
    onAnswer(isCorrect);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Diagram placeholder */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: `${q.imagePlaceholder.color}0D`, border: `1px solid ${q.imagePlaceholder.color}30`, aspectRatio: '4/3' }}>

        {/* SVG Cell Illustration */}
        <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
          {/* Cell membrane */}
          <ellipse cx="200" cy="150" rx="185" ry="135" fill={`${q.imagePlaceholder.color}08`} stroke={`${q.imagePlaceholder.color}40`} strokeWidth="2" strokeDasharray="6 3" />
          {/* Nucleus */}
          <ellipse cx="200" cy="135" rx="50" ry="42" fill={`${q.imagePlaceholder.color}20`} stroke={`${q.imagePlaceholder.color}80`} strokeWidth="1.5" />
          <ellipse cx="200" cy="135" rx="24" ry="20" fill={`${q.imagePlaceholder.color}35`} stroke={`${q.imagePlaceholder.color}`} strokeWidth="1" />
          {/* Mitochondria */}
          <ellipse cx="288" cy="105" rx="22" ry="12" fill={`${q.imagePlaceholder.color}20`} stroke={`${q.imagePlaceholder.color}70`} strokeWidth="1.2" />
          <path d="M272,105 Q280,98 288,105 Q296,112 304,105" fill="none" stroke={`${q.imagePlaceholder.color}50`} strokeWidth="1" />
          {/* ER wavy lines */}
          <path d="M120,195 Q135,188 150,195 Q165,202 180,195 Q195,188 210,195" fill="none" stroke={`${q.imagePlaceholder.color}50`} strokeWidth="1.5" />
          <path d="M120,205 Q135,198 150,205 Q165,212 180,205 Q195,198 210,205" fill="none" stroke={`${q.imagePlaceholder.color}50`} strokeWidth="1.5" />
          {/* Ribosomes (dots) */}
          {[[118,190],[122,200],[128,195],[135,190],[115,208]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="3" fill={`${q.imagePlaceholder.color}70`} />
          ))}
          {/* Label */}
          <text x="200" y="285" textAnchor="middle" style={{ fontSize: 10, fill: `${q.imagePlaceholder.color}80`, fontFamily: 'var(--font-arabic, sans-serif)' }}>
            {q.imagePlaceholder.label}
          </text>
        </svg>

        {/* Marker pins */}
        {q.markers.map((marker) => (
          <button key={marker.id}
            onClick={() => setActiveMarker(activeMarker === marker.id ? null : marker.id)}
            style={{
              position: 'absolute',
              left: `${marker.x * 100}%`,
              top:  `${marker.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              background: activeMarker === marker.id ? q.imagePlaceholder.color : `${q.imagePlaceholder.color}CC`,
              border: '2px solid #fff',
              borderRadius: '50%',
              width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: '#fff',
              cursor: 'pointer',
              boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
              zIndex: 2,
              fontFamily: 'var(--font-arabic, sans-serif)',
              transition: 'all 0.15s',
            }}>
            {marker.label}
          </button>
        ))}

        {/* Marker tooltip */}
        {activeMarker && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8, left: 8,
            background: 'rgba(14,12,9,0.88)', backdropFilter: 'blur(4px)',
            borderRadius: 10, padding: '7px 12px',
            border: `1px solid ${q.imagePlaceholder.color}40`,
            zIndex: 3,
          }}>
            <p className="font-arabic" style={{ fontSize: 11, color: '#fff' }}>
              <span style={{ color: q.imagePlaceholder.color, fontWeight: 700 }}>
                {q.markers.find(m => m.id === activeMarker)?.label} —
              </span>{' '}
              {q.markers.find(m => m.id === activeMarker)?.answer}
            </p>
          </div>
        )}
      </div>

      {/* MCQ choices for image question */}
      <div className="flex flex-col gap-2">
        {q.choices.map((choice) => {
          const isSelected = selected === choice.id;
          const isCorrect  = choice.correct;
          let borderColor = 'var(--border-subtle)', bgColor = 'var(--bg-card)', textColor = 'var(--text-primary)';
          if (answered) {
            if (isCorrect)                    { borderColor = `${SCORE_HIGH}60`; bgColor = `${SCORE_HIGH}10`; textColor = SCORE_HIGH; }
            else if (isSelected && !isCorrect){ borderColor = `${SCORE_LOW}60`;  bgColor = `${SCORE_LOW}10`;  textColor = SCORE_LOW;  }
          } else if (isSelected) {
            borderColor = `${ACCENT_PRACTICE}60`; bgColor = `${ACCENT_PRACTICE}10`;
          }
          return (
            <button key={choice.id} onClick={() => handleChoose(choice.id)}
              className="rounded-xl px-3.5 py-3 w-full text-right font-arabic"
              style={{ background: bgColor, border: `1px solid ${borderColor}`, cursor: answered ? 'default' : 'pointer', color: textColor, fontSize: 12, transition: 'all 0.25s ease' }}>
              {choice.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Practice Result Screen ───────────────────────────────────────────────────
function PracticeResultScreen({ onBack }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div className="px-4 flex flex-col items-center gap-4 pt-4" dir="rtl"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.4s ease' }}>
      <div className="flex flex-col items-center gap-2 rounded-2xl p-6 w-full"
        style={{ background: 'var(--bg-card)', border: `1px solid ${SCORE_HIGH}40` }}>
        <div style={{ position: 'relative', width: 88, height: 88 }}>
          <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="44" cy="44" r="36" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
            <circle cx="44" cy="44" r="36" fill="none" stroke={SCORE_HIGH} strokeWidth="6"
              strokeLinecap="round" strokeDasharray="226"
              strokeDashoffset={visible ? 226 * (1 - 5/7) : 226}
              style={{ transition: 'stroke-dashoffset 1s ease 0.2s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: SCORE_HIGH, fontFamily: 'var(--font-arabic, inherit)', lineHeight: 1 }}>{toAr(5)}/{toAr(7)}</span>
            <span className="font-arabic" style={{ fontSize: 9, color: 'var(--text-muted)' }}>إجابة صحيحة</span>
          </div>
        </div>
        <p className="font-arabic" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>أداء ممتاز! 🎉</p>
        <p className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          أجبت على {toAr(5)} من {toAr(7)} أسئلة بشكل صحيح — بما فيها أسئلة المطابقة والترتيب!
        </p>
        <div className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ background: `${ACCENT_EXAM}15`, border: `1px solid ${ACCENT_EXAM}35` }}>
          <span style={{ fontSize: 16 }}>⭐</span>
          <span className="font-arabic" style={{ fontSize: 12, fontWeight: 700, color: ACCENT_EXAM }}>+{toAr(240)} نقطة خبرة</span>
        </div>
      </div>
      <button onClick={onBack} className="w-full py-3 rounded-2xl font-arabic"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        ← العودة للبنك
      </button>
    </div>
  );
}

// ─── Exams Mode (locked) ──────────────────────────────────────────────────────
function ExamsModeContent() {
  const [sourceFilter, setSourceFilter] = useState(null);
  return (
    <div className="px-4 flex flex-col gap-3" style={{ position: 'relative' }}>
      <div className="flex gap-2" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[{ label: 'الكل', value: null }, { label: 'وزارة', value: 'MINISTRY' }, { label: 'مدارس', value: 'SCHOOL' }].map(f => (
          <button key={f.label} className="flex-shrink-0 rounded-full px-3 py-1.5 font-arabic"
            style={{ fontSize: 11, background: sourceFilter === f.value ? `${ACCENT_EXAM}18` : 'var(--bg-card)', border: `1px solid ${sourceFilter === f.value ? `${ACCENT_EXAM}40` : 'var(--border-subtle)'}`, color: sourceFilter === f.value ? ACCENT_EXAM : 'var(--text-muted)', cursor: 'pointer' }}>
            {f.label}
          </button>
        ))}
      </div>
      {MOCK_EXAM_LIST.map((exam) => (
        <div key={exam.id} className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', filter: 'blur(1.5px)', opacity: 0.5, pointerEvents: 'none' }}>
          <div className="rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ width: 44, height: 44, background: `${ACCENT_EXAM}15`, fontSize: 20 }}>
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
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,12,9,0.72)', backdropFilter: 'blur(2px)', borderRadius: 16, zIndex: 10 }}>
        <div className="rounded-2xl px-6 py-5 flex flex-col items-center gap-2.5 text-center"
          style={{ background: 'var(--bg-card)', border: `1px solid ${ACCENT_EXAM}30`, maxWidth: 200 }}>
          <span style={{ fontSize: 28 }}>🔒</span>
          <p className="font-arabic" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>قريباً</p>
          <p className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>امتحانات وزارية ومدرسية من السنوات الماضية — قادمة قريباً.</p>
        </div>
      </div>
    </div>
  );
}

function MetaChip({ icon, label }) {
  return (
    <span className="font-arabic flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{ fontSize: 9, background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
      <span>{icon}</span>{label}
    </span>
  );
}
