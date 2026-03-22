'use client';
import { useState } from 'react';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

// ─── Subject groups for chip selector ─────────────────────────────────────

const SUBJECT_GROUPS = [
  { trackKey: 'COMMON',   label: 'مشترك'  },
  { trackKey: 'SCIENCE',  label: 'علمي'   },
  { trackKey: 'LITERARY', label: 'أدبي'   },
];

// ─── Step indicator ────────────────────────────────────────────────────────

function StepBar({ current = 1, total = 3 }) {
  const steps = [
    { n: 1, label: 'التعريف بنفسك'  },
    { n: 2, label: 'أسئلة قصيرة'   },
    { n: 3, label: 'مهمة صغيرة'    },
  ];
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            {/* Circle */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300"
                style={{
                  background: s.n === current
                    ? 'var(--accent)'
                    : s.n < current
                      ? 'rgba(212,137,30,0.2)'
                      : 'var(--bg-card)',
                  border: s.n === current
                    ? '2px solid var(--accent)'
                    : s.n < current
                      ? '2px solid rgba(212,137,30,0.4)'
                      : '1px solid var(--border-mid)',
                  color: s.n === current
                    ? '#0e0c09'
                    : s.n < current
                      ? 'var(--accent)'
                      : 'var(--text-muted)',
                }}
              >
                {s.n < current ? '✓' : s.n}
              </div>
              <span
                className="text-xs mt-1.5 text-center leading-tight hidden sm:block"
                style={{
                  color: s.n === current ? 'var(--text-secondary)' : 'var(--text-muted)',
                  fontSize: '10px',
                }}
              >
                {s.label}
              </span>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-2"
                style={{
                  background: s.n < current
                    ? 'rgba(212,137,30,0.35)'
                    : 'var(--border-subtle)',
                  transition: 'background 0.4s ease',
                }}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
        الخطوة {current} من {total}
      </p>
    </div>
  );
}

// ─── Subject chip ──────────────────────────────────────────────────────────

function SubjectChip({ subject, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(subject.id)}
      className="px-3 py-1.5 rounded-lg text-xs font-arabic transition-all duration-200"
      style={{
        background: selected ? 'rgba(212,137,30,0.15)' : 'var(--bg-card)',
        border: selected
          ? '1px solid rgba(212,137,30,0.5)'
          : '1px solid var(--border-subtle)',
        color: selected ? 'var(--accent)' : 'var(--text-muted)',
        transform: selected ? 'translateY(-1px)' : 'none',
      }}
    >
      {subject.nameAr}
    </button>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────

function SuccessScreen({ name }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vh] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(212,137,30,0.07), transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* Step bar frozen at step 1 */}
        <div className="mb-10 text-right" dir="rtl">
          <StepBar current={1} total={3} />
        </div>

        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'rgba(212,137,30,0.12)',
            border: '1px solid rgba(212,137,30,0.25)',
          }}
        >
          <span style={{ color: 'var(--accent)', fontSize: '22px' }}>✓</span>
        </div>

        <h1
          className="text-2xl font-arabic font-bold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          وصل طلبك، {name.split(' ')[0]}
        </h1>

        <p
          className="text-sm leading-loose mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          هذه كانت الخطوة الأولى فقط.
          سنراجع طلبك ونتواصل معك على بريدك الإلكتروني
          لنكمل باقي الخطوات معاً.
        </p>

        {/* Next steps preview */}
        <div
          className="p-5 rounded-xl text-right mb-8"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p className="text-xs font-mono mb-4" style={{ color: 'var(--text-muted)' }}>
            ما الذي سيأتي بعد ذلك؟
          </p>
          <div className="space-y-3">
            {[
              { n: '٢', text: 'بعض الأسئلة القصيرة لنفهمك أكثر' },
              { n: '٣', text: 'مهمة صغيرة تُظهر أسلوبك في الشرح' },
            ].map((item) => (
              <div key={item.n} className="flex items-start gap-3">
                <span
                  className="text-xs font-mono mt-0.5 shrink-0"
                  style={{ color: 'var(--accent)', opacity: 0.7 }}
                >{item.n}</span>
                <p className="text-xs leading-loose" style={{ color: 'var(--text-muted)' }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
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
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function JoinPage() {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name:               '',
    email:              '',
    background:         '',
    fieldOfStudy:       '',
    subjectsOfInterest: [],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSubject = (id) => {
    setForm((f) => ({
      ...f,
      subjectsOfInterest: f.subjectsOfInterest.includes(id)
        ? f.subjectsOfInterest.filter((s) => s !== id)
        : [...f.subjectsOfInterest, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.subjectsOfInterest.length === 0) {
      setError('يرجى اختيار مادة واحدة على الأقل');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contributors/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'حدث خطأ ما');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return <SuccessScreen name={form.name} />;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 relative" dir="rtl">

      {/* Ambient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[50vh] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(212,137,30,0.05), transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">

        {/* Back link */}
        <a
          href="/prejoin"
          className="inline-flex items-center gap-2 text-xs mb-8 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          ←
          <span>العودة لصفحة التعريف</span>
        </a>

        {/* Header */}
        <div className="mb-8">
          <a href="/" className="inline-block mb-5">
            <span className="text-2xl font-arabic font-bold" style={{ color: 'var(--accent)' }}>نفير</span>
          </a>
          <h1
            className="text-xl sm:text-2xl font-arabic font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            أخبرنا عن نفسك
          </h1>
          <p className="text-sm leading-loose" style={{ color: 'var(--text-muted)' }}>
            لا نطلب الكثير في البداية — فقط ما يكفي لنبدأ المحادثة.
          </p>
        </div>

        {/* Step bar */}
        <StepBar current={1} total={3} />

        {/* Card */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {error && (
            <div
              className="mb-6 p-3 rounded-lg text-sm text-center"
              style={{
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.2)',
                color: '#f87171',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <Field label="الاسم" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="اسمك الكريم"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={inputStyle}
              />
            </Field>

            {/* Email */}
            <Field label="البريد الإلكتروني" required>
              <input
                type="email"
                required
                dir="ltr"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={inputStyle}
              />
            </Field>

            {/* Background */}
            <Field label="الخلفية التعليمية" hint="جامعة، كلية، تخصص، أو أي وصف مختصر">
              <input
                type="text"
                value={form.background}
                onChange={(e) => set('background', e.target.value)}
                placeholder="مثلاً: طالب هندسة — جامعة الخرطوم"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={inputStyle}
              />
            </Field>

            {/* Field of study */}
            <Field label="مجال الدراسة أو الاهتمام" hint="حتى لو لم تكن في بيئة أكاديمية">
              <input
                type="text"
                value={form.fieldOfStudy}
                onChange={(e) => set('fieldOfStudy', e.target.value)}
                placeholder="مثلاً: علوم حاسوب، أو معلم رياضيات"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={inputStyle}
              />
            </Field>

            {/* Subjects of interest — chip multi-select */}
            <Field
              label="المواد التي تريد المساهمة فيها"
              hint="اختر واحدة أو أكثر"
              required
            >
              <div className="space-y-3 mt-1">
                {SUBJECT_GROUPS.map(({ trackKey, label }) => {
                  const subjects = SUBJECTS_CATALOG.filter((s) => s.track === trackKey);
                  return (
                    <div key={trackKey}>
                      <p
                        className="text-xs font-mono mb-2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {subjects.map((s) => (
                          <SubjectChip
                            key={s.id}
                            subject={s}
                            selected={form.subjectsOfInterest.includes(s.id)}
                            onToggle={toggleSubject}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selection count */}
              {form.subjectsOfInterest.length > 0 && (
                <p
                  className="text-xs mt-3 font-mono"
                  style={{ color: 'var(--accent)', opacity: 0.8 }}
                >
                  {form.subjectsOfInterest.length === 1
                    ? 'مادة واحدة مختارة'
                    : `${form.subjectsOfInterest.length} مواد مختارة`}
                </p>
              )}
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || form.subjectsOfInterest.length === 0}
              className="w-full py-3.5 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              style={{
                background: (loading || form.subjectsOfInterest.length === 0)
                  ? 'var(--bg-card)'
                  : 'var(--accent)',
                color: (loading || form.subjectsOfInterest.length === 0)
                  ? 'var(--text-muted)'
                  : '#0e0c09',
                border: (loading || form.subjectsOfInterest.length === 0)
                  ? '1px solid var(--border-subtle)'
                  : 'none',
                cursor: loading ? 'wait' : 'pointer',
              }}
              onMouseEnter={e => {
                if (!loading && form.subjectsOfInterest.length > 0) {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                  e.currentTarget.style.boxShadow  = '0 0 30px var(--glow)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = form.subjectsOfInterest.length > 0
                  ? 'var(--accent)' : 'var(--bg-card)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? (
                <span>جاري الإرسال...</span>
              ) : (
                <>
                  <span>متابعة التقديم</span>
                  <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>←</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between mt-6 px-1">
          <a
            href="/signin"
            className="text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            لديك حساب؟ سجّل الدخول
          </a>
          <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            خطوة ١ من ٣
          </p>
        </div>

      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="block mb-1.5">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {required && (
            <span className="mr-1" style={{ color: 'var(--accent)' }}>*</span>
          )}
        </span>
        {hint && (
          <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background:  'rgba(255,255,255,0.04)',
  border:      '1px solid var(--border-mid)',
  color:       'var(--text-primary)',
  outline:     'none',
};