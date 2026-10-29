'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Field, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || data.error || 'تعذّر إرسال الطلب. حاول مرة أخرى.');
        return;
      }
      setSent(true);
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
          {sent ? (
            <div className="flex flex-col gap-4 text-center">
              <h1 className="t-h2 text-fg-strong">تحقّق من بريدك</h1>
              <p role="status" className="t-body text-fg-muted">
                إذا كان للبريد حساب مؤهل، فستصلك رسالة برابط إعادة التعيين. تحقق من البريد الوارد والرسائل غير المرغوب فيها.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <h1 className="t-h2 text-fg-strong text-center">نسيت كلمة المرور؟</h1>
              <p className="t-body text-fg-muted text-center">أدخل البريد المرتبط بحسابك وسنرسل رابطاً لإعادة تعيين كلمة المرور.</p>
              {error && (
                <p role="alert" className="p-3 rounded-control bg-danger-surface border border-danger-border t-label text-danger text-center">{error}</p>
              )}
              <Field label="البريد الإلكتروني" required>
                <Input type="email" autoComplete="email" dir="auto" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="h-11" />
              </Field>
              <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={!email.trim()}>
                {loading ? 'جارٍ الإرسال…' : 'إرسال رابط الاستعادة'}
              </Button>
            </form>
          )}
        </Card>

        <p className="t-label text-fg-muted text-center">
          <Link href="/signin" className="text-fg-accent hover:underline">العودة إلى تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
