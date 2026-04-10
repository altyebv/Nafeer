'use client';
import { useState, useEffect, useRef } from 'react';
import BlockRenderer from '../blocks/BlockRenderer';
import { LESSON_BY_PATH, SUBJECT_COLORS } from '../demoData';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function formatTime(ms) {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const s    = secs % 60;
  if (mins === 0) return `${toAr(s)} ثانية`;
  if (s === 0)    return `${toAr(mins)} ${mins === 1 ? 'دقيقة' : 'دقائق'}`;
  return `${toAr(mins)} ${mins === 1 ? 'دقيقة' : 'دقائق'} و${toAr(s)} ثانية`;
}

// ─────────────────────────────────────────────────────────────────────────────
// LessonScreen — 5-phase state machine
//
// Phases:
//   hook        → provocative question to engage attention
//   orientation → lesson objectives + time estimate
//   content     → full block stream + "اختبر فهمك" CTA
//   checkpoint  → single MCQ with visual feedback + explanation
//   complete    → animated stats: streak ▲, time spent, XP gained, forward pull
//
// previewMode: when true (set by DemoApp during guided tour) skips hook/orientation
//              and starts directly at 'content'.
// ─────────────────────────────────────────────────────────────────────────────
export default function LessonScreen({ userPath, previewMode = false, onGoHome, setFullScreen }) {
  const lesson = LESSON_BY_PATH[userPath] || LESSON_BY_PATH.SCIENCE;
  const color  = SUBJECT_COLORS[lesson.subjectKey] || '#4A90D9';

  const [phase,         setPhase]         = useState(previewMode ? 'content' : 'hook');
  const [checkAnswer,   setCheckAnswer]   = useState(null);
  const [elapsed,       setElapsed]       = useState(0);
  const [timeSpent,     setTimeSpent]     = useState(0);
  const [displayStreak, setDisplayStreak] = useState(lesson.complete.streakBefore);
  const [xpVisible,     setXpVisible]     = useState(false);
  const startTimeRef  = useRef(null);
  const intervalRef   = useRef(null);

  // ── Timer: tick every second while reading content ──
  useEffect(() => {
    if (phase !== 'content') return;
    startTimeRef.current = startTimeRef.current || Date.now();
    intervalRef.current  = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [phase]);

  // ── Animate complete screen ──
  useEffect(() => {
    if (phase !== 'complete') return;
    setDisplayStreak(lesson.complete.streakBefore);
    setXpVisible(false);
    const t1 = setTimeout(() => setDisplayStreak(lesson.complete.streakBefore + 1), 700);
    const t2 = setTimeout(() => setXpVisible(true), 450);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, lesson]);

  function goToContent() {
    startTimeRef.current = Date.now();
    setElapsed(0);
    setPhase('content');
    if (setFullScreen) setFullScreen(true);
  }

  function goToCheckpoint() {
    clearInterval(intervalRef.current);
    const spent = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    setTimeSpent(spent);
    setCheckAnswer(null);
    setPhase('checkpoint');
    if (setFullScreen) setFullScreen(false);
  }

  function goToComplete() {
    setPhase('complete');
    if (setFullScreen) setFullScreen(false);
  }

  const progress = Math.round((lesson.currentSection / lesson.totalSections) * 100);

  // ── Phase routing ──
  if (phase === 'hook') {
    return <HookPhase lesson={lesson} color={color} onContinue={() => setPhase('orientation')} />;
  }
  if (phase === 'orientation') {
    return <OrientationPhase lesson={lesson} color={color} onStart={goToContent} />;
  }
  if (phase === 'checkpoint') {
    return (
      <CheckpointPhase
        lesson={lesson}
        color={color}
        checkAnswer={checkAnswer}
        setCheckAnswer={setCheckAnswer}
        onContinue={goToComplete}
      />
    );
  }
  if (phase === 'complete') {
    return (
      <CompletePhase
        lesson={lesson}
        color={color}
        timeSpent={timeSpent}
        displayStreak={displayStreak}
        xpVisible={xpVisible}
        streakBefore={lesson.complete.streakBefore}
        onContinue={() => {
          // Navigate back to home screen if the parent provided a handler,
          // otherwise fall back to restarting the lesson (e.g. in DemoSection)
          if (onGoHome) {
            if (setFullScreen) setFullScreen(false);
            onGoHome();
          } else {
            startTimeRef.current = null;
            setElapsed(0);
            setPhase('hook');
            if (setFullScreen) setFullScreen(false);
          }
        }}
      />
    );
  }

  // ── Content phase ──
  return (
    <div className="w-full">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-4 pt-3 pb-2.5"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }}
        dir="rtl"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-arabic text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {lesson.lessonTitle}
            </h2>
            <p className="font-arabic text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {lesson.subjectName} · {lesson.unitName}
            </p>
          </div>
          {/* Live reading timer */}
          <div
            className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: `${color}10`, border: `1px solid ${color}20` }}
          >
            <span style={{ fontSize: 9 }}>⏱</span>
            <span className="font-mono text-xs" style={{ color, fontSize: 10 }}>
              {Math.floor(elapsed / 60000) > 0
                ? `${toAr(Math.floor(elapsed/60000))}:${toAr(String(Math.floor((elapsed%60000)/1000)).padStart(2,'0'))}`
                : `${toAr(Math.floor(elapsed/1000))}ث`}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: color }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-arabic text-xs" style={{ color: 'var(--text-muted)' }}>
              {toAr(lesson.currentSection)} / {toAr(lesson.totalSections)} أقسام
            </span>
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{toAr(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Block stream */}
      <div className="py-1.5">
        {lesson.blocks.map(block => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>

      {/* Checkpoint CTA */}
      <div className="px-4 py-4 pb-8">
        <button
          onClick={goToCheckpoint}
          className="w-full py-3.5 rounded-2xl font-arabic font-bold text-sm flex items-center justify-center gap-2"
          style={{
            background: color, color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: `0 4px 20px ${color}35`,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          اختبر فهمك
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HookPhase — polished with subject icon + radial glow
// ─────────────────────────────────────────────────────────────────────────────
function HookPhase({ lesson, color, onContinue }) {
  const subjectIcons = {
    physics:   '⚡',
    chemistry: '🧪',
    biology:   '🧬',
    math:      '∑',
    history:   '📜',
    arabic:    'ع',
    islamic:   '☪',
    geography: '🌍',
    english:   'A',
  };
  const icon = subjectIcons[lesson.subjectKey] || '📖';

  return (
    <div
      className="w-full flex flex-col"
      dir="rtl"
      style={{ minHeight: '100%', padding: '28px 20px 24px' }}
    >
      {/* Subject chip */}
      <div className="flex justify-center mb-6">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
          <span className="font-arabic text-xs font-bold" style={{ color }}>{lesson.subjectName}</span>
        </div>
      </div>

      {/* Main hook content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Radial glow + large icon */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          {/* Glow */}
          <div style={{
            position:     'absolute',
            inset:        '-24px',
            borderRadius: '50%',
            background:   `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
            pointerEvents:'none',
          }} />
          {/* Icon circle */}
          <div style={{
            width:        72,
            height:       72,
            borderRadius: '50%',
            background:   `${color}12`,
            border:       `1.5px solid ${color}25`,
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            fontSize:     32,
            position:     'relative',
          }}>
            {icon}
          </div>
          {/* Orbiting question mark */}
          <div style={{
            position:   'absolute',
            top:        -4,
            right:      -6,
            width:      22,
            height:     22,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border:     `1.5px solid ${color}40`,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize:   13,
            fontFamily: 'var(--font-arabic, inherit)',
            color:      color,
            fontWeight: 700,
          }}>
            ؟
          </div>
        </div>

        <p className="font-arabic text-xs mb-3 font-medium" style={{ color: 'var(--text-muted)' }}>
          قبل أن تبدأ، فكّر في هذا...
        </p>

        <h2
          className="font-arabic font-bold leading-relaxed"
          style={{ fontSize: 15, color: 'var(--text-primary)', maxWidth: 290, lineHeight: 1.7 }}
        >
          {lesson.hook}
        </h2>

        {/* Decorative dots */}
        <div style={{ display: 'flex', gap: 5, marginTop: 20 }}>
          {[0.4, 0.7, 1, 0.7, 0.4].map((op, i) => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: color, opacity: op,
            }} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6">
        <button
          onClick={onContinue}
          className="w-full py-3.5 rounded-2xl font-arabic font-bold text-sm flex items-center justify-center gap-2"
          style={{
            background: color, color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: `0 4px 20px ${color}35`,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          يلا نكتشف ←
        </button>
        <p className="font-arabic text-xs text-center mt-2.5" style={{ color: 'var(--text-muted)', opacity: 0.65 }}>
          ⏱ {toAr(lesson.orientation.estimatedMins)} دقائق تقريباً
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrientationPhase
// ─────────────────────────────────────────────────────────────────────────────
function OrientationPhase({ lesson, color, onStart }) {
  return (
    <div className="w-full" dir="rtl" style={{ padding: '24px 20px 28px' }}>
      {/* Icon + subject + title */}
      <div className="mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl mb-3"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          {lesson.orientation.icon}
        </div>
        <p className="font-arabic text-xs mb-1 font-medium" style={{ color }}>
          {lesson.subjectName} · {lesson.unitName}
        </p>
        <h2 className="font-arabic text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          {lesson.lessonTitle}
        </h2>
      </div>

      {/* Learning objectives */}
      <div className="mb-5">
        <p className="font-arabic text-xs font-bold mb-3" style={{ color: 'var(--text-muted)' }}>
          ستتعلم في هذا الدرس:
        </p>
        <div className="flex flex-col gap-2.5">
          {lesson.orientation.points.map((point, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              </div>
              <p
                className="font-arabic text-sm leading-relaxed flex-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {point}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Time estimate */}
      <div
        className="flex items-center gap-2 mb-6 px-3 py-2.5 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <span style={{ fontSize: 14 }}>⏱</span>
        <p className="font-arabic text-xs" style={{ color: 'var(--text-muted)' }}>
          الوقت المتوقع: {toAr(lesson.orientation.estimatedMins)} دقائق تقريباً
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full py-3.5 rounded-2xl font-arabic font-bold text-sm flex items-center justify-center gap-2"
        style={{
          background: color, color: '#fff', border: 'none', cursor: 'pointer',
          boxShadow: `0 4px 20px ${color}35`,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        ابدأ الدرس
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CheckpointPhase — MCQ with visual feedback + explanation
// ─────────────────────────────────────────────────────────────────────────────
function CheckpointPhase({ lesson, color, checkAnswer, setCheckAnswer, onContinue }) {
  const { question, options, correctIndex, explanation } = lesson.checkpoint;
  const answered  = checkAnswer !== null;
  const isCorrect = checkAnswer === correctIndex;

  function optionStyle(i) {
    if (!answered) {
      return {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
      };
    }
    if (i === correctIndex) {
      return { background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.5)', color: '#27AE60' };
    }
    if (i === checkAnswer) {
      return { background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.5)', color: '#E74C3C' };
    }
    return {
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      color: 'var(--text-muted)', opacity: 0.4,
    };
  }

  const LETTERS = ['أ', 'ب', 'ج', 'د'];

  return (
    <div className="w-full" dir="rtl" style={{ padding: '20px 16px 24px' }}>
      {/* Header badge */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="px-3 py-1 rounded-full flex items-center gap-1.5"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span className="font-arabic text-xs font-bold" style={{ color }}>نقطة تحقق</span>
        </div>
        <p className="font-arabic text-xs" style={{ color: 'var(--text-muted)' }}>اختبر فهمك</p>
      </div>

      {/* Question */}
      <div
        className="mb-5 p-4 rounded-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="font-arabic text-sm font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {question}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5 mb-4">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !answered && setCheckAnswer(i)}
            style={{
              width: '100%', textAlign: 'right',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              cursor: answered ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font-arabic, inherit)', fontSize: 13, fontWeight: 500,
              ...optionStyle(i),
            }}
          >
            <span>{opt}</span>
            <span
              style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: answered && i === correctIndex
                  ? '#27AE60'
                  : answered && i === checkAnswer
                  ? '#E74C3C'
                  : `${color}15`,
                color: answered && (i === correctIndex || i === checkAnswer) ? '#fff' : color,
                fontFamily: 'var(--font-arabic, inherit)',
              }}
            >
              {answered && i === correctIndex ? '✓' : answered && i === checkAnswer ? '✗' : LETTERS[i]}
            </span>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {answered && (
        <div
          className="mb-4 rounded-2xl p-4"
          style={{
            background: isCorrect ? 'rgba(39,174,96,0.08)' : 'rgba(74,144,217,0.08)',
            border: `1px solid ${isCorrect ? 'rgba(39,174,96,0.3)' : 'rgba(74,144,217,0.25)'}`,
            animation: 'cpFadeUp 0.3s ease both',
          }}
        >
          <p
            className="font-arabic text-xs font-bold mb-1.5"
            style={{ color: isCorrect ? '#27AE60' : '#4A90D9' }}
          >
            {isCorrect ? 'ممتاز! إجابة صحيحة ✓' : 'ليست الإجابة الصحيحة — إليك التفسير:'}
          </p>
          <p className="font-arabic text-xs leading-loose" style={{ color: 'var(--text-secondary)' }}>
            {explanation}
          </p>
        </div>
      )}

      {/* Continue button */}
      {answered && (
        <button
          onClick={onContinue}
          className="w-full py-3.5 rounded-2xl font-arabic font-bold text-sm flex items-center justify-center gap-2"
          style={{
            background: color, color: '#fff', border: 'none', cursor: 'pointer',
            animation: 'cpFadeUp 0.3s ease 0.1s both',
            boxShadow: `0 4px 20px ${color}35`,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          التالي
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      )}

      <style>{`
        @keyframes cpFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CompletePhase — streak, time, XP + visual forward pull
// ─────────────────────────────────────────────────────────────────────────────
function CompletePhase({ lesson, color, timeSpent, displayStreak, xpVisible, streakBefore, onContinue }) {
  const { xpGained, forwardPull } = lesson.complete;
  const streakIncremented = displayStreak > streakBefore;

  // Progress bar: lesson is N of totalSections — visually show unit completion
  const unitProgress = Math.round((lesson.currentSection / lesson.totalSections) * 100);
  const nextProgress = Math.min(Math.round(((lesson.currentSection + 1) / lesson.totalSections) * 100), 100);

  return (
    <div className="w-full" dir="rtl" style={{ padding: '24px 20px 28px' }}>
      {/* Animated checkmark */}
      <div className="flex justify-center mb-5">
        <svg width="76" height="76" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r="34" fill="none" stroke={color} strokeWidth="2" opacity="0.15" />
          <circle
            cx="38" cy="38" r="34"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="214"
            strokeDashoffset="214"
            transform="rotate(-90 38 38)"
            style={{ animation: 'drawRing 0.8s ease forwards' }}
          />
          <polyline
            points="24,38 34,48 52,28"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="42"
            strokeDashoffset="42"
            style={{ animation: 'drawMark 0.4s ease 0.7s forwards' }}
          />
        </svg>
      </div>

      {/* Title */}
      <h2 className="font-arabic text-base font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
        أحسنت! أكملت الدرس
      </h2>
      <p className="font-arabic text-xs text-center mb-5" style={{ color: 'var(--text-muted)' }}>
        {lesson.lessonTitle}
      </p>

      {/* Stats row */}
      <div className="flex gap-2 mb-5">
        {/* Streak */}
        <div
          className="flex-1 rounded-2xl p-3 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            style={{
              fontSize: 26, lineHeight: 1,
              filter: streakIncremented ? 'drop-shadow(0 0 10px rgba(212,137,30,0.85))' : 'none',
              transition: 'filter 0.5s ease',
              animation: streakIncremented ? 'statPop 0.45s ease' : 'none',
            }}
          >
            🔥
          </div>
          <p
            className="font-arabic text-lg font-bold mt-1"
            style={{ color: 'var(--accent)', animation: streakIncremented ? 'statPop 0.45s ease 0.05s' : 'none' }}
          >
            {toAr(displayStreak)}
          </p>
          <p className="font-arabic" style={{ color: 'var(--text-muted)', fontSize: 10 }}>يوم</p>
          {streakIncremented && (
            <p
              className="font-arabic"
              style={{ color: 'var(--accent)', fontSize: 9, fontWeight: 700, marginTop: 2, animation: 'cpFadeUp 0.3s ease' }}
            >
              +١ جديد ✨
            </p>
          )}
        </div>

        {/* Time spent */}
        <div
          className="flex-1 rounded-2xl p-3 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div style={{ fontSize: 22, lineHeight: 1 }}>⏱</div>
          <p
            className="font-arabic font-bold mt-1"
            style={{ color: 'var(--text-primary)', fontSize: timeSpent > 60000 ? 11 : 13 }}
          >
            {timeSpent > 0 ? formatTime(timeSpent) : '—'}
          </p>
          <p className="font-arabic" style={{ color: 'var(--text-muted)', fontSize: 10 }}>وقت المذاكرة</p>
        </div>

        {/* XP */}
        <div
          className="flex-1 rounded-2xl p-3 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div style={{ fontSize: 22, lineHeight: 1 }}>⭐</div>
          <p
            className="font-arabic text-base font-bold mt-1"
            style={{
              color: '#9B59B6',
              opacity: xpVisible ? 1 : 0,
              transform: xpVisible ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(4px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            +{toAr(xpGained)}
          </p>
          <p className="font-arabic" style={{ color: 'var(--text-muted)', fontSize: 10 }}>نقطة XP</p>
        </div>
      </div>

      {/* Forward pull — visual with mini unit progress bar */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: `${color}08`, border: `1px solid ${color}22` }}
      >
        <div className="flex items-start gap-2.5 mb-3">
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🎯</span>
          <p className="font-arabic text-xs leading-loose" style={{ color: 'var(--text-secondary)' }}>
            {forwardPull}
          </p>
        </div>
        {/* Unit progress mini-bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-arabic text-xs" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              تقدّمك في الوحدة
            </span>
            <span className="font-arabic text-xs font-bold" style={{ color, fontSize: 10 }}>
              {toAr(lesson.currentSection)} / {toAr(lesson.totalSections)}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: 'var(--border-subtle)', overflow: 'hidden' }}>
            {/* Previous progress */}
            <div
              style={{
                height: '100%', borderRadius: 4,
                background: `${color}40`,
                width: `${unitProgress}%`,
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {/* Incremental gain */}
              <div
                style={{
                  position:   'absolute',
                  right:      0,
                  top:        0,
                  height:     '100%',
                  borderRadius: 4,
                  background: color,
                  width:      `${nextProgress - unitProgress}%`,
                  animation:  'progressGrow 0.8s ease 0.4s both',
                  transformOrigin: 'left',
                  boxShadow:  `0 0 8px ${color}60`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Continue → home */}
      <button
        onClick={onContinue}
        className="w-full py-3.5 rounded-2xl font-arabic font-bold text-sm"
        style={{
          background: color, color: '#fff', border: 'none', cursor: 'pointer',
          boxShadow: `0 4px 20px ${color}35`,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        العودة للرئيسية →
      </button>

      <style>{`
        @keyframes drawRing  { to { stroke-dashoffset: 0; } }
        @keyframes drawMark  { to { stroke-dashoffset: 0; } }
        @keyframes statPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.35); }
          70%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        @keyframes cpFadeUp {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}