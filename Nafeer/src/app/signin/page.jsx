'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'حدث خطأ ما');
        return;
      }

      router.push('/editor');
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
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
              <label className="block text-sm text-ink-400 mb-2">اسم المستخدم أو البريد الإلكتروني</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={form.identifier}
                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all"
                placeholder="username أو you@example.com"
                dir="auto"
              />
            </div>

            <div>
              <label className="block text-sm text-ink-400 mb-2">كلمة المرور</label>
              <input
                type="password"
                required
                autoComplete="current-password"
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
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a href="/join" className="text-ink-600 hover:text-sand-500 text-sm transition-colors">
            لا يوجد لديك حساب؟ قدّم طلب انضمام
          </a>
        </div>
      </div>
    </div>
  );
}
