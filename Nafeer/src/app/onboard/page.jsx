'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
          i < current   ? 'w-6 bg-sand-500' :
          i === current ? 'w-10 bg-sand-400' :
          'w-4 bg-ink-700'
        }`} />
      ))}
    </div>
  );
}

// ─── Step 1: Password ─────────────────────────────────────────────────────────

function StepPassword({ onNext, loading }) {
  const [pw, setPw]   = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    if (pw.length < 8) { setErr('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    if (pw !== pw2)    { setErr('كلمتا المرور غير متطابقتين'); return; }
    onNext(pw);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-2xl font-arabic font-bold text-sand-100 mb-2">أنشئ كلمة مرور</h2>
        <p className="text-ink-400 text-sm">ستستخدمها مع اسم المستخدم للدخول</p>
      </div>
      {err && <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm text-center">{err}</div>}
      <div>
        <label className="block text-sm text-ink-400 mb-2">كلمة المرور</label>
        <input type="password" required autoComplete="new-password" value={pw}
          onChange={(e) => setPw(e.target.value)} minLength={8}
          className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all"
          placeholder="8 أحرف على الأقل" />
      </div>
      <div>
        <label className="block text-sm text-ink-400 mb-2">تأكيد كلمة المرور</label>
        <input type="password" required autoComplete="new-password" value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all"
          placeholder="أعد كتابة كلمة المرور" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-3.5 bg-sand-500 hover:bg-sand-400 disabled:bg-ink-700 disabled:cursor-not-allowed text-ink-950 disabled:text-ink-500 font-bold rounded-xl transition-all">
        {loading ? 'جاري الحفظ...' : 'التالي'}
      </button>
    </form>
  );
}

// ─── Step 2: Bio ──────────────────────────────────────────────────────────────

function StepBio({ onNext, onSkip }) {
  const [bio, setBio] = useState('');
  const MAX = 280;

  return (
    <div className="space-y-5">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">✍️</div>
        <h2 className="text-2xl font-arabic font-bold text-sand-100 mb-2">عرّف بنفسك</h2>
        <p className="text-ink-400 text-sm">بضع كلمات تظهر في ملفك الشخصي</p>
      </div>
      <div className="relative">
        <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value.slice(0, MAX))}
          className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all resize-none"
          placeholder="معلم رياضيات، أحب مساعدة الطلاب على الفهم العميق..." />
        <span className={`absolute bottom-3 left-3 text-xs ${bio.length > MAX * 0.9 ? 'text-amber-500' : 'text-ink-600'}`}>
          {bio.length}/{MAX}
        </span>
      </div>
      <button onClick={() => onNext(bio)}
        className="w-full py-3.5 bg-sand-500 hover:bg-sand-400 text-ink-950 font-bold rounded-xl transition-all">
        التالي
      </button>
      <button onClick={onSkip}
        className="w-full py-2 text-ink-600 hover:text-ink-400 text-sm transition-colors font-arabic">
        تخطّى الآن
      </button>
    </div>
  );
}

// ─── Step 3: Avatar ───────────────────────────────────────────────────────────

function StepAvatar({ onFinish, loading }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile]       = useState(null);
  const [err, setErr]         = useState('');
  const inputRef              = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr('الصورة يجب أن تكون أقل من 5 ميغابايت'); return; }
    setErr('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🖼️</div>
        <h2 className="text-2xl font-arabic font-bold text-sand-100 mb-2">صورتك الشخصية</h2>
        <p className="text-ink-400 text-sm">ستظهر مع مساهماتك في المشروع</p>
      </div>
      {err && <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm text-center">{err}</div>}
      <div onClick={() => inputRef.current?.click()}
        className="relative mx-auto w-36 h-36 rounded-full overflow-hidden border-2 border-dashed border-ink-600 hover:border-sand-600 transition-colors cursor-pointer group">
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-500 group-hover:text-sand-500 transition-colors">
            <span className="text-3xl mb-1">+</span>
            <span className="text-xs font-arabic">اختر صورة</span>
          </div>
        )}
        {preview && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-arabic">تغيير</span>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-ink-600">JPEG أو PNG أو WebP — حتى 5 ميغابايت</p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
      <button onClick={() => onFinish(file)} disabled={loading}
        className="w-full py-3.5 bg-sand-500 hover:bg-sand-400 disabled:bg-ink-700 disabled:cursor-not-allowed text-ink-950 disabled:text-ink-500 font-bold rounded-xl transition-all">
        {loading ? 'جاري الرفع...' : file ? 'رفع الصورة والدخول' : 'الدخول بدون صورة'}
      </button>
    </div>
  );
}

// ─── Main onboarding page ─────────────────────────────────────────────────────

function OnboardContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  const [phase,       setPhase]       = useState('loading'); // loading | invalid | step1 | step2 | step3
  const [contributor, setContributor] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [globalErr,   setGlobalErr]   = useState('');
  const [stepData,    setStepData]    = useState({ password: '', bio: '' });

  useEffect(() => {
    if (!token) { setPhase('invalid'); return; }
    fetch(`/api/auth/onboard?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) { setGlobalErr(data.error || 'الرابط غير صالح'); setPhase('invalid'); return; }
        setContributor(data.data);
        setPhase('step1');
      })
      .catch(() => { setGlobalErr('تعذّر التحقق من الرابط'); setPhase('invalid'); });
  }, [token]);

  // Step 1 → Set password (calls POST /api/auth/onboard)
  const handlePassword = async (password) => {
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/onboard', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password, bio: '' }),
      });
      const data = await res.json();
      if (!data.ok) { setGlobalErr(data.error || 'حدث خطأ'); return; }
      setStepData((s) => ({ ...s, password }));
      setPhase('step2');
    } catch {
      setGlobalErr('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → Bio (PATCH /api/contributors/me)
  const handleBio = async (bio) => {
    if (bio.trim()) {
      fetch('/api/contributors/me', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bio }),
      }).catch(() => {});
    }
    setStepData((s) => ({ ...s, bio }));
    setPhase('step3');
  };

  // Step 3 → Avatar (POST /api/contributors/me/avatar) then redirect
  const handleAvatar = async (file) => {
    setLoading(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await fetch('/api/contributors/me/avatar', { method: 'POST', body: fd });
      }
    } catch {
      // Non-fatal — proceed to editor anyway
    } finally {
      setLoading(false);
      router.push('/editor');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500 text-sm font-arabic animate-pulse">جاري التحقق من الرابط...</div>
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 mesh-bg pointer-events-none" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="text-5xl mb-6">🔗</div>
          <h2 className="text-xl font-arabic font-bold text-sand-100 mb-3">رابط غير صالح</h2>
          <p className="text-ink-400 text-sm leading-loose mb-6">
            {globalErr || 'هذا الرابط غير صالح أو انتهت صلاحيته. تواصل مع المسؤول للحصول على رابط جديد.'}
          </p>
          <a href="/" className="text-sand-500 hover:text-sand-400 text-sm transition-colors">
            العودة للرئيسية
          </a>
        </div>
      </div>
    );
  }

  const STEPS     = ['step1', 'step2', 'step3'];
  const stepIndex = STEPS.indexOf(phase);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="absolute inset-0 mesh-bg pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-arabic font-bold text-sand-400 mb-1">نفير</h1>
          {contributor && (
            <p className="text-ink-400 text-sm">
              مرحباً <span className="text-sand-300">{contributor.name}</span> — أكمل إعداد حسابك
            </p>
          )}
        </div>

        <StepIndicator current={stepIndex} total={3} />

        {globalErr && (
          <div className="mb-6 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm text-center">
            {globalErr}
          </div>
        )}

        <div className="glass rounded-2xl border border-ink-700/40 p-8">
          {phase === 'step1' && <StepPassword onNext={handlePassword} loading={loading} />}
          {phase === 'step2' && <StepBio onNext={handleBio} onSkip={() => setPhase('step3')} />}
          {phase === 'step3' && <StepAvatar onFinish={handleAvatar} loading={loading} />}
        </div>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500 text-sm font-arabic animate-pulse">جاري التحميل...</div>
      </div>
    }>
      <OnboardContent />
    </Suspense>
  );
}