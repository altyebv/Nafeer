'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import { Button, Card, Textarea, cx } from '@/components/ui';

// ─── /interview?token=… ───────────────────────────────────────────────────────
// DS3: the written interview on the shared components and role tokens — one
// question per screen, a draft kept on this device, a link to the status page
// at the end (canvas board «المقابلة الآن»).

const MIN = 80; // fallback minimum

// ─── Progress ────────────────────────────────────────────────────────────────

function ProgressLine({ current, total }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label={`${current} من ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cx('flex-1 h-1 rounded-chip', i < current - 1 ? 'bg-success' : i === current - 1 ? 'bg-accent' : 'bg-hover')} />
        ))}
      </div>
      <span className="t-caption text-fg-muted">{current} من {total}</span>
    </div>
  );
}

// ─── Character counter ───────────────────────────────────────────────────────

function CharCount({ value, min }) {
  const len = (value || '').trim().length;
  const enough = len >= min;
  return (
    <div className="flex items-center justify-between gap-3 t-caption">
      <span className={enough ? 'text-success' : 'text-fg-subtle'}>{enough ? `${len} حرفاً ✓` : `${len} من ${min} حرفاً على الأقل`}</span>
      <span className="text-fg-subtle">لا إجابة صحيحة واحدة — نريد أن نرى طريقة تفكيرك.</span>
    </div>
  );
}

// ─── One step: a question, or the task at the end ────────────────────────────

function Step({ kicker, prompt, hint, value, onChange, min, rows = 7, placeholder }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="t-label text-fg-accent">{kicker}</span>
      <h2 className="read t-h3 leading-relaxed text-fg-strong">{prompt}</h2>
      {hint && <p className="t-label font-normal text-fg-muted">{hint}</p>}
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        aria-label={prompt} className="read text-base leading-loose" />
      <CharCount value={value} min={min} />
    </div>
  );
}

function QuestionStep({ question, index, value, onChange }) {
  return (
    <Step kicker={`السؤال ${index + 1}`} prompt={question.text} hint="فقرة أو فقرتان تكفيان."
      value={value} onChange={onChange} min={question.minChars ?? MIN} placeholder={question.placeholder || 'اكتب إجابتك هنا…'} />
  );
}

function MicroTaskStep({ microTask, value, onChange }) {
  return (
    <Step kicker="المهمة الأخيرة · نحو 5 دقائق" prompt={microTask.prompt} hint="اكتبها كما ستظهر للطالب في بشير."
      value={value} onChange={onChange} min={microTask.minChars ?? MIN} rows={8} placeholder="اكتب هنا…" />
  );
}

// ─── Done ────────────────────────────────────────────────────────────────────

function SuccessScreen({ name, statusToken }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <span aria-hidden="true" className="w-14 h-14 rounded-chip bg-success-surface border border-success-border text-success inline-flex items-center justify-center t-h3">✓</span>
      <h2 className="t-h2 text-fg-strong">شكراً {name?.split(' ')[0]}</h2>
      <p className="t-body text-fg-muted max-w-md">وصلت إجاباتك. فريق الإدارة يقرأ طلبك كاملاً، وتتابع القرار من رابط طلبك.</p>
      {statusToken
        ? <Button as={Link} href={`/join/status?token=${statusToken}`} variant="primary">تابع حالة طلبك ←</Button>
        : <Link href="/" className="t-label text-fg-accent hover:underline">العودة للرئيسية</Link>}
    </div>
  );
}

// ─── Error ───────────────────────────────────────────────────────────────────

function ErrorScreen({ message }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <span aria-hidden="true" className="w-14 h-14 rounded-chip bg-danger-surface border border-danger-border text-danger inline-flex items-center justify-center t-h3">✕</span>
      <h2 className="t-h2 text-fg-strong">تعذّر فتح المقابلة</h2>
      <p className="t-body text-fg-muted max-w-md">{message || 'الرابط غير صالح أو انتهت صلاحيته.'}</p>
      <p className="t-label text-fg-muted">تجد رابطاً صالحاً في <Link href="/join/status" className="text-fg-accent hover:underline">صفحة حالة طلبك</Link>.</p>
    </div>
  );
}

// ─── Main interview content ──────────────────────────────────────────────────

const draftKey = (token) => `nafeer-interview-draft:${String(token || '').slice(0, 12)}`;

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
  const [savedAt,     setSavedAt]    = useState(null);

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
        // Answers typed earlier on this device come back (draft below).
        let draft = null;
        try { draft = JSON.parse(localStorage.getItem(draftKey(token)) || 'null'); } catch { /* storage blocked */ }
        setAnswers({ ...init, ...(draft?.answers || {}) });
        if (draft?.micro) setMicroAnswer(draft.micro);
        if (Number.isInteger(draft?.step)) setStep(draft.step);
        setPhase('interview');
      })
      .catch(() => { setErrorMsg('تعذّر الاتصال بالخادم.'); setPhase('error'); });
  }, [token]);

  // Keep a draft on this device: a dropped connection or a closed tab loses nothing.
  useEffect(() => {
    if (phase !== 'interview') return;
    try {
      localStorage.setItem(draftKey(token), JSON.stringify({ answers, micro: microAnswer, step }));
      setSavedAt(Date.now());
    } catch { /* storage blocked */ }
  }, [answers, microAnswer, step, phase, token]);

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
      try { localStorage.removeItem(draftKey(token)); } catch { /* ignore */ }
      setPhase('done');
    } catch {
      setSubmitError('تعذّر الاتصال بالخادم.');
      setSubmitting(false);
    }
  };

  const valid = isCurrentValid();
  return (
    <div className="min-h-screen bg-page text-fg font-ui" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="t-title font-bold text-fg-accent">نفير</Link>
          {phase === 'interview' && savedAt && (
            <span role="status" className="t-caption text-success">✓ حُفظت مسودتك على هذا الجهاز</span>
          )}
        </div>

        <Card padding="lg">
          {phase === 'loading' && <p className="py-12 text-center t-body text-fg-subtle">جارٍ التحقق من الرابط…</p>}
          {phase === 'error' && <ErrorScreen message={errorMsg} />}
          {phase === 'done' && <SuccessScreen name={config?.name} statusToken={config?.statusToken} />}

          {phase === 'interview' && total > 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1 pb-4 border-b border-line">
                <span className="t-caption text-fg-subtle">مقابلة{config.roleName ? ` · ${config.roleName}` : ''}</span>
                <h1 className="t-title text-fg-strong">أهلاً {config.name?.split(' ')[0]}</h1>
              </div>

              <ProgressLine current={step + 1} total={total} />

              <div ref={cardRef}>
                {currentStep?.type === 'question' && (
                  <QuestionStep question={currentStep.data} index={step} value={currentValue()} onChange={setCurrentValue} />
                )}
                {currentStep?.type === 'microtask' && (
                  <MicroTaskStep microTask={currentStep.data} value={currentValue()} onChange={setCurrentValue} />
                )}
              </div>

              {submitError && (
                <p role="alert" className="p-3 rounded-control bg-danger-surface border border-danger-border t-label text-danger text-center">{submitError}</p>
              )}

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-line">
                {step > 0
                  ? <Button variant="secondary" onClick={goBack}>→ السابق</Button>
                  : <span />}
                {step < total - 1
                  ? <Button variant="primary" onClick={goNext} disabled={!valid}>التالي ←</Button>
                  : <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={!valid}>أرسل المقابلة</Button>}
              </div>
            </div>
          )}
        </Card>

        {phase === 'interview' && (
          <p className="text-center t-caption text-fg-subtle">
            يمكنك التنقل بين الأسئلة قبل الإرسال، والإغلاق والعودة من الرابط في بريدك.
          </p>
        )}
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" />}>
      <InterviewContent />
    </Suspense>
  );
}
