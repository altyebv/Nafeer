'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Field, Input } from '@/components/ui';

export default function ResetPasswordPage() {
  return <ResetPassword />;
}

function ResetPassword() {
  const [token, setToken] = useState('');
  const [tokenReady, setTokenReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
    setToken(resetToken);
    if (resetToken) window.history.replaceState(null, '', '/reset-password');
    setTokenReady(true);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'تعذّر تغيير كلمة المرور. اطلب رابطاً جديداً وحاول مرة أخرى.');
        return;
      }
      setDone(true);
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
          {done ? (
            <div className="flex flex-col gap-4 text-center">
              <h1 className="t-h2 text-fg-strong">تم تغيير كلمة المرور</h1>
              <p role="status" className="t-body text-fg-muted">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
              <Link href="/signin" className="text-fg-accent hover:underline">الذهاب إلى تسجيل الدخول</Link>
            </div>
          ) : !tokenReady ? (
            <p className="t-body text-fg-muted text-center">جارٍ التحقق من الرابط…</p>
          ) : !token ? (
            <div className="flex flex-col gap-4 text-center">
              <h1 className="t-h2 text-fg-strong">رابط غير صالح</h1>
              <p className="t-body text-fg-muted">لا يوجد رابط إعادة تعيين في هذا العنوان.</p>
              <Link href="/forgot-password" className="text-fg-accent hover:underline">اطلب رابطاً جديداً</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <h1 className="t-h2 text-fg-strong text-center">تعيين كلمة مرور جديدة</h1>
              {error && (
                <p role="alert" className="p-3 rounded-control bg-danger-surface border border-danger-border t-label text-danger text-center">{error}</p>
              )}
              <Field label="كلمة المرور الجديدة" required hint="8 أحرف على الأقل.">
                <Input type="password" autoComplete="new-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="h-11" />
              </Field>
              <Field label="أعد كتابة كلمة المرور" required>
                <Input type="password" autoComplete="new-password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" />
              </Field>
              <Button type="submit" variant="primary" size="lg" block loading={loading}
                disabled={!password || !confirmPassword}>
                {loading ? 'جارٍ الحفظ…' : 'حفظ كلمة المرور'}
              </Button>
            </form>
          )}
        </Card>

        {!done && <p className="t-label text-fg-muted text-center">
          <Link href="/signin" className="text-fg-accent hover:underline">العودة إلى تسجيل الدخول</Link>
        </p>}
      </div>
    </div>
  );
}
