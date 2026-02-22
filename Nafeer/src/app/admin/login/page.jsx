'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'بيانات غير صحيحة');
        return;
      }

      router.push('/admin/dashboard');
    } catch {
      setError('تعذّر الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-ink-950">
      <div className="absolute inset-0 mesh-bg pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sand-800/50 bg-sand-900/20 text-sand-600 text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-sand-600" />
            ADMIN ACCESS
          </div>
          <h1 className="text-3xl font-arabic font-bold text-sand-400 mb-1">نافير</h1>
          <p className="text-ink-500 text-sm">لوحة التحكم</p>
        </div>

        <div className="glass rounded-2xl border border-ink-700/40 p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-ink-500 mb-2 font-mono uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                required
                dir="ltr"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/30 transition-all font-mono"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs text-ink-500 mb-2 font-mono uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                dir="ltr"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/30 transition-all font-mono"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-sand-600 hover:bg-sand-500 disabled:bg-ink-800 disabled:cursor-not-allowed text-ink-950 disabled:text-ink-600 font-bold rounded-xl transition-all duration-200 font-mono text-sm tracking-wide"
            >
              {loading ? 'VERIFYING...' : 'LOGIN'}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-800 text-xs mt-6 font-mono">
          nafeer admin — restricted access
        </p>
      </div>
    </div>
  );
}
