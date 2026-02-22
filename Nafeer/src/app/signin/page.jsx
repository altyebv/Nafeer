'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'حدث خطأ ما');
        return;
      }

      // Store token in cookie (handled by API) then redirect
      router.push('/editor');
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      {/* Background */}
      <div className="absolute inset-0 mesh-bg pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block">
            <h1 className="text-4xl font-arabic font-bold text-sand-400 mb-2">نفير</h1>
            <p className="text-ink-500 text-sm">بوابة المساهمين</p>
          </a>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-ink-700/40 p-8">
          <h2 className="text-xl font-bold text-sand-100 mb-8 text-center">تسجيل الدخول</h2>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-ink-400 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                required
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-ink-400 mb-2">كلمة المرور</label>
              <input
                type="password"
                required
                dir="ltr"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-sand-500 hover:bg-sand-400 disabled:bg-ink-700 disabled:cursor-not-allowed text-ink-950 disabled:text-ink-500 font-bold rounded-xl transition-all duration-200 hover:shadow-[0_0_30px_rgba(212,137,30,0.25)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  جاري التحقق...
                </span>
              ) : 'دخول'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-ink-800/60 text-center">
            <p className="text-ink-500 text-sm">
              لا يوجد لديك حساب؟{' '}
              <a href="/join" className="text-sand-400 hover:text-sand-300 transition-colors">
                طلب الانضمام
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-ink-700 text-xs mt-6">
          الوصول للأداة متاح للمساهمين المعتمدين فقط
        </p>
      </div>
    </div>
  );
}
