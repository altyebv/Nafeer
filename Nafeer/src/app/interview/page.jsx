'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';

const MIN = 80; // fallback minimum

// ─── Progress bar ────────────────────────────────────────────────────────────

function ProgressLine({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          سؤال {current} من {total}
        </span>
        <span className="text-xs font-mono" style={{ color: 'var(--accent)', opacity: 0.7 }}>
          {pct}%
        </span>
      </div>
      <div className="w-full h-0.5 rounded-full" style={{ background: 'var(--border-subtle)' }}>
        <div
          className="h-0.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: 'var(--accent)' }}
        />
      </div>
    </div>
  );
}

// ─── Character counter ───────────────────────────────────────────────────────

function CharCount({ value, min }) {
  const len    = (value || '').trim().length;
  const enough = len >= min;
  return (
    <div className="flex items-center justify-between mt-2">
      <span className="text-xs" style={{ color: enough ? 'var(--accent)' : 'var(--text-muted)', opacity: 0.6 }}>
        {enough ? 'ممتاز' : `${min - len} حرفاً على الأقل`}
      </span>
      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>{len}</span>
    </div>
  );
}

// ─── Textarea input style ────────────────────────────────────────────────────

const textareaStyle = {
  background:   'rgba(255,255,255,0.04)',
  border:       '1px solid var(--border-mid)',
  color:        'var(--text-primary)',
  outline:      'none',
  width:        '100%',
  borderRadius: '12px',
  padding:      '12px 16px',
  fontSize:     '14px',
  lineHeight:   '1.8',
  resize:       'vertical',
  fontFamily:   'var(--font-arabic, inherit)',
};

// ─── A single open-text question step ───────────────────────────────────────

function QuestionStep({ question, value, onChange }) {
  const minChars = question.minChars ?? MIN;
  return (
    <div>
      <span
        className="inline-block text-xs font-mono mb-3 tracking-widest uppercase"
        style={{ color: 'var(--accent)', opacity: 0.7 }}
      >
        سؤال
      </span>
      <h2 className="text-lg sm:text-xl font-arabic font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {question.text}
      </h2>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || 'اكتب إجابتك هنا...'}
        style={textareaStyle}
        onFocus={(e)  => { e.target.style.borderColor = 'rgba(212,137,30,0.5)'; }}
        onBlur={(e)   => { e.target.style.borderColor = 'var(--border-mid)';    }}
      />
      <CharCount value={value} min={minChars} />
    </div>
  );
}

// ─── Micro task step ─────────────────────────────────────────────────────────

function MicroTaskStep({ microTask, value, onChange }) {
  const minChars = microTask.minChars ?? MIN;
  return (
    <div>
      <span
        className="inline-block text-xs font-mono mb-3 tracking-widest uppercase"
        style={{ color: 'var(--accent)', opacity: 0.7 }}
      >
        مهمة تطبيقية
      </span>
      <h2 className="text-lg sm:text-xl font-arabic font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {microTask.prompt}
      </h2>
      <p className="text-sm mb-5 leading-loose" style={{ color: 'var(--text-muted)' }}>
        لا توجد إجابة مثالية — نريد أن نرى أسلوبك في التفكير والتعبير.
      </p>
      <textarea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="اكتب هنا..."
        style={textareaStyle}
        onFocus={(e)  => { e.target.style.borderColor = 'rgba(212,137,30,0.5)'; }}
        onBlur={(e)   => { e.target.style.borderColor = 'var(--border-mid)';    }}
      />
      <CharCount value={value} min={minChars} />
    </div>
  );
}

// ─── Done screen ─────────────────────────────────────────────────────────────

function SuccessScreen({ name }) {
  return (
    <div className="text-center py-8">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(212,137,30,0.12)', border: '1px solid rgba(212,137,30,0.25)' }}
      >
        <span style={{ color: 'var(--accent)', fontSize: '22px' }}>✓</span>
      </div>
      <h2 className="text-xl font-arabic font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        شكراً {name?.split(' ')[0]}
      </h2>
      <p className="text-sm leading-loose mb-6" style={{ color: 'var(--text-secondary)' }}>
        وصلت إجاباتك. سنراجعها ونتواصل معك قريباً.
      </p>
      <a href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>العودة للرئيسية</a>
    </div>
  );
}

// ─── Error screen ────────────────────────────────────────────────────────────

function ErrorScreen({ message }) {
  return (
    <div className="text-center py-8">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
      >
        <span style={{ color: '#f87171', fontSize: '20px' }}>✕</span>
      </div>
      <h2 className="text-lg font-arabic font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        تعذّر تحميل المقابلة
      </h2>
      <p className="text-sm leading-loose mb-6" style={{ color: 'var(--text-secondary)' }}>
        {message || 'الرابط غير صالح أو انتهت صلاحيته.'}
      </p>
      <a href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>العودة للرئيسية</a>
    </div>
  );
}

// ─── Main interview content ──────────────────────────────────────────────────

function InterviewContent() {
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  const [phase,       setPhase]      = useState('loading'); // loading | error | interview | done
  const [errorMsg,    setErrorMsg]   = useState('');
  const [config,      setConfig]     = useState(null);      // { name, roleName, questions, microTask, isDynamic }
  const [step,        setStep]       = useState(0);         // 0-based index into steps[]
  const [answers,     setAnswers]    = useState({});        // questionId → string
  const [microAnswer, setMicroAnswer] = useState('');
  const [submitting,  setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const cardRef = useRef(null);

  useEffect(() => {
    if (!token) { setErrorMsg('لا يوجد رابط صالح في هذا العنوان.'); setPhase('error'); return; }
    fetch(`/api/interview?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) { setErrorMsg(data.error); setPhase('error'); return; }
        setConfig(data.data);
        // Init answers keyed by question _id
        const init = {};
        (data.data.questions || []).forEach((q) => { init[String(q._id)] = ''; });
        setAnswers(init);
        setPhase('interview');
      })
      .catch(() => { setErrorMsg('تعذّر الاتصال بالخادم.'); setPhase('error'); });
  }, [token]);

  if (!config && phase === 'interview') return null;

  // Build step list: questions + optional micro task as last step
  const steps = config
    ? [
        ...(config.questions || []).map((q) => ({ type: 'question', data: q })),
        ...(config.microTask?.prompt ? [{ type: 'microtask', data: config.microTask }] : []),
      ]
    : [];

  const total       = steps.length;
  const currentStep = steps[step];

  const currentValue = () => {
    if (!currentStep) return '';
    if (currentStep.type === 'microtask') return microAnswer;
    return answers[String(currentStep.data._id)] || '';
  };

  const currentMin = () => currentStep?.data?.minChars ?? MIN;

  const isCurrentValid = () => {
    const val = currentValue();
    return val.trim().length >= currentMin();
  };

  const setCurrentValue = (val) => {
    if (!currentStep) return;
    if (currentStep.type === 'microtask') { setMicroAnswer(val); return; }
    setAnswers((a) => ({ ...a, [String(currentStep.data._id)]: val }));
  };

  const animateStep = (direction = 1) => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, x: direction * 24 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' }
    );
  };

  const goNext = () => {
    setStep((s) => { const n = s + 1; setTimeout(() => animateStep(-1), 0); return n; });
  };

  const goBack = () => {
    setStep((s) => { const n = s - 1; setTimeout(() => animateStep(1), 0); return n; });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    const questionList = (config.questions || []);

    // Build payload for dynamic flow
    const answersArray = questionList.map((q) => ({
      questionId: q._id,
      answer:     answers[String(q._id)] || '',
    }));

    try {
      const res = await fetch('/api/interview', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          token,
          answers:   answersArray,
          microTask: microAnswer,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setSubmitError(data.error || 'حدث خطأ ما'); setSubmitting(false); return; }
      setPhase('done');
    } catch {
      setSubmitError('تعذّر الاتصال بالخادم.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 relative" dir="rtl">

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[50vh] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(212,137,30,0.05), transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl">

        {/* Logo */}
        <div className="mb-8">
          <a href="/" className="inline-block">
            <span className="text-xl font-arabic font-bold" style={{ color: 'var(--accent)' }}>نفير</span>
          </a>
        </div>

        {/* Main card */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {phase === 'loading' && (
            <div className="text-center py-12">
              <p className="text-sm font-arabic animate-pulse" style={{ color: 'var(--text-muted)' }}>
                جاري التحقق من الرابط...
              </p>
            </div>
          )}

          {phase === 'error' && <ErrorScreen message={errorMsg} />}
          {phase === 'done'  && <SuccessScreen name={config?.name} />}

          {phase === 'interview' && total > 0 && (
            <>
              {/* Greeting header */}
              <div className="mb-6 pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-muted)' }}>
                  المقابلة — بشير × نفير{config.roleName ? ` — ${config.roleName}` : ''}
                </p>
                <h1 className="text-base font-arabic font-bold" style={{ color: 'var(--text-primary)' }}>
                  أهلاً {config.name?.split(' ')[0]} —{' '}
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                    {total} {total === 1 ? 'سؤال' : total <= 10 ? 'أسئلة' : 'سؤالاً'}، لا توجد إجابات خاطئة
                  </span>
                </h1>
              </div>

              {/* Progress */}
              <ProgressLine current={step + 1} total={total} />

              {/* Animated step */}
              <div ref={cardRef}>
                {currentStep?.type === 'question' && (
                  <QuestionStep
                    question={currentStep.data}
                    value={currentValue()}
                    onChange={setCurrentValue}
                  />
                )}
                {currentStep?.type === 'microtask' && (
                  <MicroTaskStep
                    microTask={currentStep.data}
                    value={currentValue()}
                    onChange={setCurrentValue}
                  />
                )}
              </div>

              {/* Submit error */}
              {submitError && (
                <div
                  className="mt-4 p-3 rounded-lg text-sm text-center"
                  style={{
                    background: 'rgba(220,38,38,0.08)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    color: '#f87171',
                  }}
                >
                  {submitError}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                {step > 0 ? (
                  <button
                    onClick={goBack}
                    className="text-sm px-4 py-2 rounded-lg transition-all"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    ← السابق
                  </button>
                ) : (
                  <div />
                )}

                {step < total - 1 ? (
                  <button
                    onClick={goNext}
                    disabled={!isCurrentValid()}
                    className="text-sm px-6 py-2.5 rounded-lg font-bold transition-all duration-200"
                    style={{
                      background: isCurrentValid() ? 'var(--accent)' : 'var(--bg-card)',
                      color:      isCurrentValid() ? '#0e0c09'        : 'var(--text-muted)',
                      border:     isCurrentValid() ? 'none'            : '1px solid var(--border-subtle)',
                      cursor:     isCurrentValid() ? 'pointer'         : 'not-allowed',
                    }}
                    onMouseEnter={e => { if (isCurrentValid()) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                    onMouseLeave={e => { if (isCurrentValid()) e.currentTarget.style.background = 'var(--accent)'; }}
                  >
                    التالي →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !isCurrentValid()}
                    className="text-sm px-6 py-2.5 rounded-lg font-bold transition-all duration-200"
                    style={{
                      background: (submitting || !isCurrentValid()) ? 'var(--bg-card)' : 'var(--accent)',
                      color:      (submitting || !isCurrentValid()) ? 'var(--text-muted)' : '#0e0c09',
                      border:     (submitting || !isCurrentValid()) ? '1px solid var(--border-subtle)' : 'none',
                      cursor:     submitting ? 'wait' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!submitting && isCurrentValid()) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                    onMouseLeave={e => { if (!submitting && isCurrentValid()) e.currentTarget.style.background = 'var(--accent)'; }}
                  >
                    {submitting ? 'جاري الإرسال...' : 'إرسال الإجابات ✓'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {phase === 'interview' && (
          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            يمكنك التنقل بين الأسئلة بحرية قبل الإرسال
          </p>
        )}
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm font-arabic animate-pulse" style={{ color: 'var(--text-muted)' }}>
          جاري التحميل...
        </p>
      </div>
    }>
      <InterviewContent />
    </Suspense>
  );
}
