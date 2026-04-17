'use client';
import { useState, useEffect } from 'react';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

// ─── Curriculum subject groups ─────────────────────────────────────────────
const SUBJECT_GROUPS = [
  { trackKey: 'COMMON',   label: 'مشترك'  },
  { trackKey: 'SCIENCE',  label: 'علمي'   },
  { trackKey: 'LITERARY', label: 'أدبي'   },
];

// ─── Category meta — NO emojis ────────────────────────────────────────────
const CATEGORY_META = {
  learning:   { label: 'بناء التجربة التعليمية' },
  core:       { label: 'بناء المنصة'            },
  growth:     { label: 'نشر الفكرة'             },
  operations: { label: 'تنظيم نافير'            },
};

// Category accent colours (kept from existing system)
const CATEGORY_COLORS = {
  learning:    { active: 'rgba(212,137,30,0.15)',  border: 'rgba(212,137,30,0.45)',  text: 'var(--accent)'  },
  core:        { active: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  text: '#93c5fd'        },
  growth:      { active: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.35)',  text: '#d8b4fe'        },
  operations:  { active: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.30)',   text: '#86efac'        },
};

// ─── AI tools list ─────────────────────────────────────────────────────────
const AI_TOOLS = [
  { id: 'chatgpt',     label: 'ChatGPT'     },
  { id: 'gemini',      label: 'Gemini'      },
  { id: 'notebooklm',  label: 'NotebookLM'  },
  { id: 'claude',      label: 'Claude'      },
  { id: 'copilot',     label: 'Copilot'     },
  { id: 'perplexity',  label: 'Perplexity'  },
];

// ─── Age ranges ────────────────────────────────────────────────────────────
const AGE_RANGES = [
  { value: 'under-18', label: 'أقل من ١٨' },
  { value: '18-22',    label: '١٨ – ٢٢'  },
  { value: '23-27',    label: '٢٣ – ٢٧'  },
  { value: '28-35',    label: '٢٨ – ٣٥'  },
  { value: 'over-35',  label: 'فوق ٣٥'   },
];

// ─── Step bar ──────────────────────────────────────────────────────────────
function StepBar({ current = 1, total = 3 }) {
  const steps = [
    { n: 1, label: 'اختيار الدور'  },
    { n: 2, label: 'التعريف بنفسك' },
    { n: 3, label: 'إرسال الطلب'   },
  ];
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
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
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-2"
                style={{
                  background: s.n < current ? 'rgba(212,137,30,0.35)' : 'var(--border-subtle)',
                  transition: 'background 0.4s ease',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Role card ─────────────────────────────────────────────────────────────
function RoleCard({ role, selected, onSelect }) {
  const colors = CATEGORY_COLORS[role.category] || CATEGORY_COLORS.learning;
  const meta   = CATEGORY_META[role.category]   || {};
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className="w-full text-right p-4 rounded-xl transition-all duration-200"
      style={{
        background: selected ? colors.active : 'var(--bg-card)',
        border: selected ? `1px solid ${colors.border}` : '1px solid var(--border-subtle)',
        transform: selected ? 'translateY(-1px)' : 'none',
        boxShadow: selected ? `0 4px 20px ${colors.active}` : 'none',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <span className="font-arabic font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            {role.name}
          </span>
          {role.description && (
            <p className="text-sm leading-loose mt-1" style={{ color: 'var(--text-muted)' }}>
              {role.description}
            </p>
          )}
        </div>
        <div
          className="shrink-0 w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center"
          style={{
            borderColor: selected ? colors.text : 'var(--border-mid)',
            background:  selected ? colors.active : 'transparent',
          }}
        >
          {selected && <span className="text-[8px]" style={{ color: colors.text }}>✓</span>}
        </div>
      </div>
    </button>
  );
}

// ─── Role selector ─────────────────────────────────────────────────────────
function RoleSelector({ roles, selected, onSelect }) {
  const categoryOrder = ['learning', 'core', 'growth', 'operations'];
  const grouped = roles.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {categoryOrder.map((cat) => {
        const catRoles = grouped[cat];
        if (!catRoles?.length) return null;
        const meta = CATEGORY_META[cat];
        return (
          <div key={cat}>
            <p
              className="text-xs font-arabic mb-2.5 tracking-wide"
              style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}
            >
              {meta.label}
            </p>
            <div className="space-y-2">
              {catRoles.map((role) => (
                <RoleCard
                  key={role._id}
                  role={role}
                  selected={selected?._id === role._id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div>
        <p className="text-xs font-arabic mb-2.5" style={{ color: 'var(--text-muted)' }}>
          لست متأكداً بعد
        </p>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="w-full text-right p-3 rounded-xl transition-all duration-200 text-xs font-arabic"
          style={{
            background: selected === null ? 'rgba(212,137,30,0.08)' : 'transparent',
            border: selected === null ? '1px solid rgba(212,137,30,0.3)' : '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          سنساعدك في اختيار المسار المناسب
        </button>
      </div>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────
function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="block mb-1.5">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {required && <span className="mr-1" style={{ color: 'var(--accent)' }}>*</span>}
        </span>
        {hint && <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Section divider ───────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-mono tracking-widest" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border:     '1px solid var(--border-mid)',
  color:      'var(--text-primary)',
  outline:    'none',
};

// ─── Pill toggle (yes/no or option chips) ─────────────────────────────────
function PillGroup({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? null : opt.value)}
            className="px-4 py-2 rounded-lg text-sm font-arabic transition-all duration-200"
            style={{
              background: active ? 'rgba(212,137,30,0.15)' : 'var(--bg-card)',
              border:     active ? '1px solid rgba(212,137,30,0.5)' : '1px solid var(--border-subtle)',
              color:      active ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Boolean yes/no toggle ────────────────────────────────────────────────
function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[{ v: true, label: 'نعم' }, { v: false, label: 'لا' }].map(({ v, label }) => {
        const active = value === v;
        return (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(active ? null : v)}
            className="px-5 py-2 rounded-lg text-sm font-arabic transition-all duration-200"
            style={{
              background: active ? 'rgba(212,137,30,0.15)' : 'var(--bg-card)',
              border:     active ? '1px solid rgba(212,137,30,0.5)' : '1px solid var(--border-subtle)',
              color:      active ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── AI tool chip ──────────────────────────────────────────────────────────
function AiToolChip({ tool, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(tool.id)}
      className="px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
      style={{
        background: selected ? 'rgba(212,137,30,0.15)' : 'var(--bg-card)',
        border:     selected ? '1px solid rgba(212,137,30,0.5)' : '1px solid var(--border-subtle)',
        color:      selected ? 'var(--accent)' : 'var(--text-muted)',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {tool.label}
    </button>
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
        border:     selected ? '1px solid rgba(212,137,30,0.5)' : '1px solid var(--border-subtle)',
        color:      selected ? 'var(--accent)' : 'var(--text-muted)',
        transform:  selected ? 'translateY(-1px)' : 'none',
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
          style={{ background: 'radial-gradient(ellipse, rgba(212,137,30,0.07), transparent 70%)', filter: 'blur(40px)' }}
        />
      </div>
      <div className="relative z-10 text-center max-w-md">
        <div className="mb-10 text-right" dir="rtl"><StepBar current={3} total={3} /></div>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(212,137,30,0.12)', border: '1px solid rgba(212,137,30,0.25)' }}
        >
          <span style={{ color: 'var(--accent)', fontSize: '22px' }}>✓</span>
        </div>
        <h1 className="text-2xl font-arabic font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          وصل طلبك، {name.split(' ')[0]}
        </h1>
        <p className="text-sm leading-loose mb-8" style={{ color: 'var(--text-secondary)' }}>
          سنراجع طلبك ونتواصل معك على بريدك الإلكتروني لنكمل باقي الخطوات.
        </p>
        <div
          className="p-5 rounded-xl text-right mb-8"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-xs font-mono mb-4" style={{ color: 'var(--text-muted)' }}>ما الذي سيأتي بعد ذلك؟</p>
          <div className="space-y-3">
            {[
              { n: '٢', text: 'بعض الأسئلة القصيرة لنفهمك أكثر' },
              { n: '٣', text: 'مهمة صغيرة تُظهر أسلوبك في التفكير' },
            ].map((item) => (
              <div key={item.n} className="flex items-start gap-3">
                <span className="text-xs font-mono mt-0.5 shrink-0" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                  {item.n}
                </span>
                <p className="text-xs leading-loose" style={{ color: 'var(--text-muted)' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        <a href="/" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function JoinPage() {
  const [pageStep,     setPageStep]    = useState(1);
  const [roles,        setRoles]       = useState([]);
  const [rolesLoading, setRolesLoading]= useState(true);
  const [selectedRole, setSelectedRole]= useState(undefined); // undefined = not chosen, null = no role

  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState('');
  const [submitted, setSubmitted]= useState(false);

  const [form, setForm] = useState({
    // Identity
    name:               '',
    email:              '',
    gender:             null,   // 'male' | 'female' | null
    age:                null,   // age range string | null
    town:               '',
    // Background
    background:         '',
    fieldOfStudy:       '',
    subjectsOfInterest: [],
    // Readiness
    hasPcOrTablet:      null,
    hasStableInternet:  null,
    // AI familiarity
    usesAiTools:        null,
    aiToolsList:        [],
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

  const toggleAiTool = (id) => {
    setForm((f) => ({
      ...f,
      aiToolsList: f.aiToolsList.includes(id)
        ? f.aiToolsList.filter((t) => t !== id)
        : [...f.aiToolsList, id],
    }));
  };

  // Load active roles
  useEffect(() => {
    fetch('/api/admin/roles?active=true')
      .then((r) => r.json())
      .then((data) => { setRoles(data.roles || []); })
      .catch(() => {})
      .finally(() => setRolesLoading(false));
  }, []);

  const handleRoleContinue = () => {
    if (selectedRole === undefined) return;
    setPageStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedRole?.category === 'learning' && form.subjectsOfInterest.length === 0) {
      setError('يرجى اختيار مادة واحدة على الأقل');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contributors/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form,
          gender: form.gender || '',
          roleId: selectedRole?._id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'حدث خطأ ما'); return; }
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
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[50vh] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(212,137,30,0.05), transparent 70%)', filter: 'blur(50px)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">

        {/* Back */}
        {pageStep === 1 ? (
          <a
            href="/prejoin"
            className="inline-flex items-center gap-2 text-xs mb-8 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← العودة لصفحة التعريف
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setPageStep(1)}
            className="inline-flex items-center gap-2 text-xs mb-8 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← العودة لاختيار الدور
          </button>
        )}

        {/* Header */}
        <div className="mb-8">
          <a href="/" className="inline-block mb-5">
            <span className="text-2xl font-arabic font-bold" style={{ color: 'var(--accent)' }}>نفير</span>
          </a>
          <h1 className="text-xl sm:text-2xl font-arabic font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {pageStep === 1 ? 'كيف تريد المساهمة؟' : 'أخبرنا عن نفسك'}
          </h1>
          <p className="text-sm leading-loose" style={{ color: 'var(--text-muted)' }}>
            {pageStep === 1
              ? 'كل شخص يساهم بطريقة مختلفة — اختر المسار الأقرب لك'
              : 'لا نطلب الكثير في البداية — فقط ما يكفي لنبدأ المحادثة.'}
          </p>
        </div>

        {/* Step bar */}
        <StepBar current={pageStep} total={3} />

        {/* ── Step 1: Role selector ─────────────────────────────────────── */}
        {pageStep === 1 && (
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)' }}
          >
            {rolesLoading ? (
              <div className="py-12 text-center">
                <p className="text-sm font-arabic animate-pulse" style={{ color: 'var(--text-muted)' }}>
                  جاري تحميل الأدوار...
                </p>
              </div>
            ) : (
              <RoleSelector
                roles={roles}
                selected={selectedRole}
                onSelect={setSelectedRole}
              />
            )}

            <button
              type="button"
              onClick={handleRoleContinue}
              disabled={selectedRole === undefined || rolesLoading}
              className="w-full py-3.5 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-6"
              style={{
                background: (selectedRole === undefined || rolesLoading) ? 'var(--bg-card)' : 'var(--accent)',
                color:      (selectedRole === undefined || rolesLoading) ? 'var(--text-muted)' : '#0e0c09',
                border:     (selectedRole === undefined || rolesLoading) ? '1px solid var(--border-subtle)' : 'none',
                cursor:     (selectedRole === undefined || rolesLoading) ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (selectedRole !== undefined && !rolesLoading) { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 0 30px var(--glow)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = (selectedRole !== undefined && !rolesLoading) ? 'var(--accent)' : 'var(--bg-card)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span>متابعة</span>
              <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>←</span>
            </button>
          </div>
        )}

        {/* ── Step 2: Personal info ──────────────────────────────────────── */}
        {pageStep === 2 && (
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)' }}
          >
            {/* Selected role recap */}
            {selectedRole && (
              <div
                className="mb-6 p-3 rounded-xl flex items-center gap-3"
                style={{ background: 'rgba(212,137,30,0.06)', border: '1px solid rgba(212,137,30,0.15)' }}
              >
                <span style={{ color: 'var(--accent)', opacity: 0.7 }}>◆</span>
                <span className="text-xs font-arabic" style={{ color: 'var(--accent)' }}>{selectedRole.name}</span>
              </div>
            )}

            {error && (
              <div
                className="mb-6 p-3 rounded-lg text-sm text-center"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171' }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── الهوية ── */}
              <SectionLabel>الهوية</SectionLabel>

              <Field label="الاسم" required>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="اسمك الكريم"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                  style={inputStyle}
                />
              </Field>

              <Field label="البريد الإلكتروني" required>
                <input
                  type="email" required dir="ltr" value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                  style={inputStyle}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="الجنس">
                  <div className="flex gap-2">
                    {[{ v: 'male', label: 'ذكر' }, { v: 'female', label: 'أنثى' }].map(({ v, label }) => {
                      const active = form.gender === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => set('gender', active ? null : v)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-arabic transition-all duration-200"
                          style={{
                            background: active ? 'rgba(212,137,30,0.15)' : 'rgba(255,255,255,0.03)',
                            border:     active ? '1px solid rgba(212,137,30,0.5)' : '1px solid var(--border-subtle)',
                            color:      active ? 'var(--accent)' : 'var(--text-muted)',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="الفئة العمرية">
                  <select
                    value={form.age || ''}
                    onChange={(e) => set('age', e.target.value || null)}
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">اختر</option>
                    {AGE_RANGES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="المدينة أو الولاية" hint="أين تعيش حالياً؟">
                <input
                  type="text" value={form.town}
                  onChange={(e) => set('town', e.target.value)}
                  placeholder="مثلاً: الخرطوم، بورتسودان، أم درمان"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                  style={inputStyle}
                />
              </Field>

              {/* ── الخلفية ── */}
              <SectionLabel>الخلفية</SectionLabel>

              <Field label="الخلفية التعليمية أو المهنية" hint="جامعة، كلية، تخصص — أو وصف مختصر">
                <input
                  type="text" value={form.background}
                  onChange={(e) => set('background', e.target.value)}
                  placeholder="مثلاً: طالب هندسة — جامعة الخرطوم"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                  style={inputStyle}
                />
              </Field>

              {/* Subjects — for learning roles or undecided */}
              {(!selectedRole || selectedRole.category === 'learning') && (
                <Field
                  label="المواد التي تريد المساهمة فيها"
                  hint="اختر واحدة أو أكثر"
                  required={selectedRole?.category === 'learning'}
                >
                  <div className="space-y-3 mt-1">
                    {SUBJECT_GROUPS.map(({ trackKey, label }) => {
                      const subjects = SUBJECTS_CATALOG.filter((s) => s.track === trackKey);
                      return (
                        <div key={trackKey}>
                          <p className="text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
                          <div className="flex flex-wrap gap-2">
                            {subjects.map((s) => (
                              <SubjectChip key={s.id} subject={s}
                                selected={form.subjectsOfInterest.includes(s.id)}
                                onToggle={toggleSubject} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {form.subjectsOfInterest.length > 0 && (
                    <p className="text-xs mt-3 font-mono" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                      {form.subjectsOfInterest.length === 1 ? 'مادة واحدة مختارة' : `${form.subjectsOfInterest.length} مواد مختارة`}
                    </p>
                  )}
                </Field>
              )}

              {/* ── الاستعداد ── */}
              <SectionLabel>الاستعداد التقني</SectionLabel>

              <Field
                label="هل لديك وصول إلى حاسوب أو جهاز لوحي؟"
                hint="نستخدم نافير من المتصفح — لا يعمل من الجوال فقط"
              >
                <YesNo value={form.hasPcOrTablet} onChange={(v) => set('hasPcOrTablet', v)} />
              </Field>

              <Field label="هل لديك اتصال إنترنت مستقر؟">
                <YesNo value={form.hasStableInternet} onChange={(v) => set('hasStableInternet', v)} />
              </Field>

              {/* ── أدوات الذكاء الاصطناعي ── */}
              <SectionLabel>الذكاء الاصطناعي</SectionLabel>

              <Field label="هل تستخدم أدوات ذكاء اصطناعي؟">
                <YesNo value={form.usesAiTools} onChange={(v) => {
                  set('usesAiTools', v);
                  if (!v) set('aiToolsList', []);
                }} />
              </Field>

              {form.usesAiTools === true && (
                <Field label="أي منها؟" hint="اختر كل ما ينطبق">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {AI_TOOLS.map((tool) => (
                      <AiToolChip
                        key={tool.id}
                        tool={tool}
                        selected={form.aiToolsList.includes(tool.id)}
                        onToggle={toggleAiTool}
                      />
                    ))}
                  </div>
                </Field>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                style={{
                  background: loading ? 'var(--bg-card)' : 'var(--accent)',
                  color:      loading ? 'var(--text-muted)' : '#0e0c09',
                  border:     loading ? '1px solid var(--border-subtle)' : 'none',
                  cursor:     loading ? 'wait' : 'pointer',
                  marginTop:  '8px',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 0 30px var(--glow)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = loading ? 'var(--bg-card)' : 'var(--accent)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {loading
                  ? <span>جاري الإرسال...</span>
                  : <><span>إرسال الطلب</span><span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>←</span></>
                }
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
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
            خطوة {pageStep} من ٣
          </p>
        </div>

      </div>
    </div>
  );
}