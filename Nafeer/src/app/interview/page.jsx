'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

// ─── Constants ──────────────────────────────────────────────────────────────

const COMMITMENT_OPTIONS = [
  { value: 'occasional', label: 'بشكل متقطع',      sub: 'ساعة أو أقل أسبوعياً'   },
  { value: '2-3h',       label: '٢–٣ ساعات',        sub: 'أسبوعياً'                },
  { value: '5h+',        label: '٥ ساعات أو أكثر',  sub: 'أسبوعياً'                },
];

const MIN = 80;   // minimum answer length in chars to enable submit

// ─── Small components ───────────────────────────────────────────────────────

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

function CategoryTag({ text }) {
  return (
    <span
      className="inline-block text-xs font-mono mb-3 tracking-widest uppercase"
      style={{ color: 'var(--accent)', opacity: 0.7 }}
    >
      {text}
    </span>
  );
}

function CharCount({ value, min }) {
  const len     = (value || '').trim().length;
  const enough  = len >= min;
  return (
    <div className="flex items-center justify-between mt-2">
      <span className="text-xs" style={{ color: enough ? 'var(--accent)' : 'var(--text-muted)', opacity: 0.6 }}>
        {enough ? 'ممتاز' : `${min - len} حرفاً على الأقل`}
      </span>
      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
        {len}
      </span>
    </div>
  );
}

const inputStyle = {
  background:  'rgba(255,255,255,0.04)',
  border:      '1px solid var(--border-mid)',
  color:       'var(--text-primary)',
  outline:     'none',
  width:       '100%',
  borderRadius: '12px',
  padding:     '12px 16px',
  fontSize:    '14px',
  lineHeight:  '1.8',
  resize:      'vertical',
  fontFamily:  'var(--font-arabic, inherit)',
};

const focusStyle = { borderColor: 'rgba(212,137,30,0.5)' };

// ─── Question steps ─────────────────────────────────────────────────────────

function Q1({ value, onChange }) {
  return (
    <div>
      <CategoryTag text="الدوافع" />
      <h2 className="text-lg sm:text-xl font-arabic font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        لماذا تريد المساهمة في بشير؟
      </h2>
      <p className="text-sm leading-loose mb-5" style={{ color: 'var(--text-muted)' }}>
        لا توجد إجابة صحيحة. نريد أن نفهم ما الذي يجذبك لهذا المشروع تحديداً.
      </p>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="بصدق، ما الذي دفعك للتقديم؟"
        style={inputStyle}
        onFocus={e => Object.assign(e.target.style, focusStyle)}
        onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
      />
      <CharCount value={value} min={MIN} />
    </div>
  );
}

function Q2({ value, onChange }) {
  return (
    <div>
      <CategoryTag text="التعليم" />
      <h2 className="text-lg sm:text-xl font-arabic font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        ما الذي يُعلَّم بشكل سيئ في المدارس؟
      </h2>
      <p className="text-sm leading-loose mb-5" style={{ color: 'var(--text-muted)' }}>
        اختر أي مادة أو موضوع تعتقد أنه يحتاج إلى طريقة مختلفة. قل لنا لماذا.
      </p>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="موضوع أو مادة يمكن تعليمها بشكل أفضل..."
        style={inputStyle}
        onFocus={e => Object.assign(e.target.style, focusStyle)}
        onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
      />
      <CharCount value={value} min={MIN} />
    </div>
  );
}

function Q3({ value, onChange }) {
  return (
    <div>
      <CategoryTag text="قدرة التعليم" />
      <h2 className="text-lg sm:text-xl font-arabic font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        كيف تشرح فكرة صعبة لطالب يسمعها لأول مرة؟
      </h2>
      <p className="text-sm leading-loose mb-5" style={{ color: 'var(--text-muted)' }}>
        لا تصف الطريقة فقط — أعطنا مثالاً فعلياً من مادتك. ماذا ستقول؟
      </p>
      <textarea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="مثلاً: لشرح مفهوم المشتقة، أبدأ بـ..."
        style={inputStyle}
        onFocus={e => Object.assign(e.target.style, focusStyle)}
        onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
      />
      <CharCount value={value} min={MIN} />
    </div>
  );
}

function Q4({ value, onChange }) {
  return (
    <div>
      <CategoryTag text="الالتزام" />
      <h2 className="text-lg sm:text-xl font-arabic font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        كم وقتاً يمكنك إعطاءه أسبوعياً؟
      </h2>
      <p className="text-sm leading-loose mb-5" style={{ color: 'var(--text-muted)' }}>
        كن صادقاً — نفضّل شخصاً يعمل بانتظام على شخص يعد بالكثير ثم يختفي.
      </p>
      <div className="space-y-2.5">
        {COMMITMENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 text-right"
            style={{
              background: value === opt.value ? 'rgba(212,137,30,0.1)' : 'rgba(255,255,255,0.03)',
              border: value === opt.value
                ? '1px solid rgba(212,137,30,0.45)'
                : '1px solid var(--border-mid)',
            }}
          >
            <div
              className="w-4 h-4 rounded-full shrink-0 transition-all duration-200 flex items-center justify-center"
              style={{
                border: value === opt.value
                  ? '2px solid var(--accent)'
                  : '2px solid var(--border-mid)',
              }}
            >
              {value === opt.value && (
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold font-arabic" style={{ color: 'var(--text-primary)' }}>
                {opt.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Q5({ value, onChange, subjectsOfInterest }) {
  const subjectNames = subjectsOfInterest
    .map((id) => SUBJECTS_CATALOG.find((s) => s.id === id)?.nameAr)
    .filter(Boolean)
    .join(' أو ');

  return (
    <div>
      <CategoryTag text="المهمة الصغيرة" />
      <h2 className="text-lg sm:text-xl font-arabic font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        اشرح مفهوماً واحداً بأسلوبك
      </h2>
      <p className="text-sm leading-loose mb-2" style={{ color: 'var(--text-muted)' }}>
        اختر أي مفهوم من{subjectNames ? ` ${subjectNames}` : ' مادتك'} واشرحه كما لو كنت تشرحه لطالب
        يسمعه لأول مرة. لا تنقل من الكتاب — استخدم كلماتك الخاصة.
      </p>
      <div
        className="p-4 rounded-xl mb-4 text-sm leading-loose"
        style={{
          background: 'rgba(212,137,30,0.06)',
          border: '1px solid rgba(212,137,30,0.15)',
          color: 'var(--text-secondary)',
        }}
      >
        <span className="font-mono text-xs block mb-1" style={{ color: 'var(--accent)', opacity: 0.7 }}>
          مثال على ما نبحث عنه
        </span>
        «التفاضل هو قياس كيف تتغير الأشياء. تخيل سيارة تتسارع — التفاضل يخبرنا بالسرعة في كل لحظة بالضبط، لا المتوسط.»
      </div>
      <textarea
        rows={7}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="اختر مفهوماً وابدأ شرحك..."
        style={inputStyle}
        onFocus={e => Object.assign(e.target.style, focusStyle)}
        onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
      />
      <CharCount value={value} min={MIN} />
    </div>
  );
}

// ─── Success screen ─────────────────────────────────────────────────────────

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
        شكراً، {name?.split(' ')[0]}
      </h2>
      <p className="text-sm leading-loose mb-8 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
        وصلت إجاباتك. سنقرأها بعناية ونتواصل معك قريباً — إما للترحيب بك رسمياً أو لإخبارك بالخطوة التالية.
      </p>
      <div
        className="p-4 rounded-xl text-sm text-right mb-8"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="text-xs font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
          ماذا سيحدث الآن؟
        </p>
        {[
          'سنراجع إجاباتك خلال يومين إلى سبعة أيام',
          'إن اعتُمد طلبك، ستصلك رسالة تفعيل على بريدك الإلكتروني',
          'إن احتجنا لأي توضيح، سنتواصل معك مباشرة',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-3 mb-2 last:mb-0">
            <span className="text-xs font-mono mt-0.5 shrink-0" style={{ color: 'var(--accent)', opacity: 0.6 }}>
              {['٠١', '٠٢', '٠٣'][i]}
            </span>
            <p className="text-xs leading-loose" style={{ color: 'var(--text-muted)' }}>{text}</p>
          </div>
        ))}
      </div>
      <a
        href="/"
        className="text-sm transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        العودة للرئيسية
      </a>
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

const TOTAL = 5;

function InterviewContent() {
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  const [phase, setPhase]       = useState('loading'); // loading | error | interview | done
  const [errorMsg, setErrorMsg] = useState('');
  const [applicant, setApplicant] = useState({ name: '', subjectsOfInterest: [] });
  const [step, setStep]         = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const cardRef = useRef(null);

  const [answers, setAnswers] = useState({
    motivation:        '',
    educationCritique: '',
    teachingMoment:    '',
    weeklyCommitment:  '',
    microTask:         '',
  });

  const setAnswer = (key) => (val) => setAnswers((a) => ({ ...a, [key]: val }));

  // Validate token on mount
  useEffect(() => {
    if (!token) { setErrorMsg('لا يوجد رابط صالح في هذا العنوان.'); setPhase('error'); return; }
    fetch(`/api/interview?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) { setErrorMsg(data.error); setPhase('error'); return; }
        setApplicant(data.data);
        setPhase('interview');
      })
      .catch(() => { setErrorMsg('تعذّر الاتصال بالخادم.'); setPhase('error'); });
  }, [token]);

  // Animate card on step change
  const animateStep = (direction = 1) => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, x: direction * 24 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' }
    );
  };

  const goNext = () => {
    setStep((s) => { const next = s + 1; setTimeout(() => animateStep(-1), 0); return next; });
  };

  const goBack = () => {
    setStep((s) => { const prev = s - 1; setTimeout(() => animateStep(1), 0); return prev; });
  };

  // Validate current step before advancing
  const currentAnswerValid = () => {
    const keys = ['motivation', 'educationCritique', 'teachingMoment', 'weeklyCommitment', 'microTask'];
    const key  = keys[step - 1];
    const val  = answers[key];
    if (key === 'weeklyCommitment') return !!val;
    return (val || '').trim().length >= MIN;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/interview', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, ...answers }),
      });
      const data = await res.json();
      if (!data.ok) { setSubmitError(data.error || 'حدث خطأ ما'); setSubmitting(false); return; }
      setPhase('done');
    } catch {
      setSubmitError('تعذّر الاتصال بالخادم.');
      setSubmitting(false);
    }
  };

  // ── Render shells ───────────────────────────────────────────────────────

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

          {/* Loading */}
          {phase === 'loading' && (
            <div className="text-center py-12">
              <p className="text-sm font-arabic animate-pulse" style={{ color: 'var(--text-muted)' }}>
                جاري التحقق من الرابط...
              </p>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && <ErrorScreen message={errorMsg} />}

          {/* Done */}
          {phase === 'done' && <SuccessScreen name={applicant.name} />}

          {/* Interview */}
          {phase === 'interview' && (
            <>
              {/* Greeting header */}
              <div className="mb-6 pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-muted)' }}>
                  المقابلة — بشير × نفير
                </p>
                <h1 className="text-base font-arabic font-bold" style={{ color: 'var(--text-primary)' }}>
                  أهلاً {applicant.name?.split(' ')[0]} —{' '}
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                    خمسة أسئلة، لا توجد إجابات خاطئة
                  </span>
                </h1>
              </div>

              {/* Progress */}
              <ProgressLine current={step} total={TOTAL} />

              {/* Question card — animated */}
              <div ref={cardRef}>
                {step === 1 && <Q1 value={answers.motivation}        onChange={setAnswer('motivation')} />}
                {step === 2 && <Q2 value={answers.educationCritique} onChange={setAnswer('educationCritique')} />}
                {step === 3 && <Q3 value={answers.teachingMoment}    onChange={setAnswer('teachingMoment')} />}
                {step === 4 && <Q4 value={answers.weeklyCommitment}  onChange={setAnswer('weeklyCommitment')} />}
                {step === 5 && (
                  <Q5
                    value={answers.microTask}
                    onChange={setAnswer('microTask')}
                    subjectsOfInterest={applicant.subjectsOfInterest}
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
                {step > 1 ? (
                  <button
                    onClick={goBack}
                    className="text-sm px-4 py-2 rounded-lg transition-all"
                    style={{
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    ← السابق
                  </button>
                ) : (
                  <div />
                )}

                {step < TOTAL ? (
                  <button
                    onClick={goNext}
                    disabled={!currentAnswerValid()}
                    className="text-sm px-6 py-2.5 rounded-lg font-bold transition-all duration-200"
                    style={{
                      background: currentAnswerValid() ? 'var(--accent)' : 'var(--bg-card)',
                      color: currentAnswerValid() ? '#0e0c09' : 'var(--text-muted)',
                      border: currentAnswerValid() ? 'none' : '1px solid var(--border-subtle)',
                      cursor: currentAnswerValid() ? 'pointer' : 'not-allowed',
                    }}
                    onMouseEnter={e => {
                      if (currentAnswerValid()) e.currentTarget.style.background = 'var(--accent-hover)';
                    }}
                    onMouseLeave={e => {
                      if (currentAnswerValid()) e.currentTarget.style.background = 'var(--accent)';
                    }}
                  >
                    التالي →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !currentAnswerValid()}
                    className="text-sm px-6 py-2.5 rounded-lg font-bold transition-all duration-200"
                    style={{
                      background: (submitting || !currentAnswerValid()) ? 'var(--bg-card)' : 'var(--accent)',
                      color: (submitting || !currentAnswerValid()) ? 'var(--text-muted)' : '#0e0c09',
                      border: (submitting || !currentAnswerValid()) ? '1px solid var(--border-subtle)' : 'none',
                      cursor: submitting ? 'wait' : 'pointer',
                    }}
                    onMouseEnter={e => {
                      if (!submitting && currentAnswerValid())
                        e.currentTarget.style.background = 'var(--accent-hover)';
                    }}
                    onMouseLeave={e => {
                      if (!submitting && currentAnswerValid())
                        e.currentTarget.style.background = 'var(--accent)';
                    }}
                  >
                    {submitting ? 'جاري الإرسال...' : 'إرسال الإجابات ✓'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Reassurance note */}
        {phase === 'interview' && (
          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            يمكنك التنقل بين الأسئلة بحرية قبل الإرسال
          </p>
        )}

      </div>
    </div>
  );
}

// ─── Page export (Suspense wrapper required for useSearchParams) ─────────────

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