'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Field, Input } from '@/components/ui';

// ─── /signin ──────────────────────────────────────────────────────────────────
// DS3: the shared Card, Field and Button on role tokens. Returns to the page
// the contributor came from (the middleware passes it as ?from=), and points
// applicants who have no account yet to their status page.

export default function SignInPage() {
  return <Suspense fallback={null}><SignIn /></Suspense>;
}

function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const sessionExpired = searchParams.get('sessionExpired') === '1';
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.message || 'حدث خطأ ما'); return; }
      // Only same-site editor paths — never an open redirect.
      router.push(from && from.startsWith('/editor') ? from : '/editor');
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-fg font-ui flex items-center justify-center px-4 py-10" dir="rtl">
      <div className="w-full max-w-md flex flex-col gap-6">
        <Link href="/" className="flex flex-col items-center gap-1 text-center">
          <span className="t-display font-bold text-fg-accent">نفير</span>
          <span className="t-label text-fg-muted">بوابة المساهمين</span>
        </Link>

        <Card padding="lg">
          <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
            <h1 className="t-h2 text-fg-strong text-center">تسجيل الدخول</h1>
            {sessionExpired && (
              <p role="status" className="p-3 rounded-control bg-hover border border-line-strong t-label text-fg-muted text-center">
                تغيّرت كلمة المرور. سجّل الدخول مجدداً للمتابعة.
              </p>
            )}
            {error && (
              <p role="alert" className="p-3 rounded-control bg-danger-surface border border-danger-border t-label text-danger text-center">{error}</p>
            )}
            <Field label="اسم المستخدم أو البريد الإلكتروني" required>
              <Input type="text" autoComplete="username" dir="auto" value={form.identifier}
                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                placeholder="username أو you@example.com" className="h-11" />
            </Field>
            <Field label="كلمة المرور" required>
              <Input type="password" autoComplete="current-password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11" />
            </Field>
            <Link href="/forgot-password" className="t-label text-fg-accent hover:underline -mt-3 self-start">
              نسيت كلمة المرور؟
            </Link>
            <Button type="submit" variant="primary" size="lg" block loading={loading}
              disabled={!form.identifier.trim() || !form.password}>
              {loading ? 'جارٍ الدخول…' : 'دخول'}
            </Button>
          </form>
        </Card>

        <div className="flex flex-col items-center gap-2 t-label text-fg-muted text-center">
          <span>ليس لديك حساب؟ <Link href="/join" className="text-fg-accent hover:underline">قدّم طلب انضمام</Link></span>
          <span>قدّمت طلباً؟ <Link href="/join/status" className="text-fg-accent hover:underline">تابع حالته</Link></span>
        </div>
      </div>
    </div>
  );
}
