'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Field, Input, cx } from '@/components/ui';
import { formatDate, formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';

// ─── /join/status?token=… ─────────────────────────────────────────────────────
// The applicant's one lasting link (canvas board «صفحة حالة طلبك»): where the
// application is, who is waiting on whom and since when, and the link for the
// next step. Without a valid token it offers to re-send the link by email.

export default function StatusPage() {
  return <Suspense fallback={null}><Status /></Suspense>;
}

function Status() {
  const params = useSearchParams();
  const token = params.get('token');
  const justSent = params.get('sent') === '1';
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) { setError('no-token'); return; }
    fetch(`/api/contributors/status?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((j) => (j.ok ? setData(j.data) : setError(j.error || 'لم نجد الطلب')))
      .catch(() => setError('تعذّر الاتصال'));
  }, [token]);

  return (
    <div className="min-h-screen bg-page text-fg font-ui" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="t-title font-bold text-fg-accent">نفير</Link>
        </header>
        {error ? <Resend reason={error} /> : !data ? <p className="t-body text-fg-subtle">جارٍ التحميل…</p> : <Application d={data} justSent={justSent} />}
      </div>
    </div>
  );
}

const COPY = {
  new:        ['وصل طلبك', 'سنتواصل معك بالخطوة التالية.'],
  invited:    ['المقابلة بانتظارك', 'أسئلة قصيرة ومهمة صغيرة، نحو 15 دقيقة. تُحفظ إجاباتك على جهازك أولاً بأول.'],
  answered:   ['وصلت إجاباتك', 'فريق الإدارة يقرأ طلبك كاملاً. ستصلك رسالة حين يقرر، وتراه هنا أيضاً.'],
  onboarding: ['أهلاً بك في نفير', 'قُبل طلبك. بقيت خطوة واحدة: حسابك، ثم أول درس.'],
  approved:   ['أنت مساهم في نفير', 'حسابك جاهز.'],
  rejected:   ['شكراً لك', 'لم نقبل الطلب لهذا الدور الآن. يمكنك التقديم لدور آخر يحتاج متطوعين.'],
};

function Application({ d, justSent }) {
  const first = d.name.split(' ')[0];
  const [title, lead] = COPY[d.stage] || COPY.new;
  const subject = d.subjects.map((id) => SUBJECTS_BY_ID[id]?.nameAr).filter(Boolean).join('، ');

  const order = ['sent', 'interview', 'review', 'decision', 'account'];
  const at = { new: 1, invited: 1, answered: 2, onboarding: 4, approved: 5, rejected: 3 }[d.stage] ?? 1;
  const rejected = d.stage === 'rejected';
  const stages = [
    ['أرسلت طلبك', formatDate(d.submittedAt, 'medium')],
    ['المقابلة', d.answeredAt ? `أرسلتها ${formatDate(d.answeredAt, 'short')}` : d.interviewExpired ? 'انتهت صلاحية الرابط — اطلب رابطاً جديداً بالرد على بريدنا' : d.interviewExpiresAt ? `الرابط صالح حتى ${formatDate(d.interviewExpiresAt, 'short')}` : ''],
    ['فريق الإدارة يقرأ طلبك', d.stage === 'answered' ? `ينتظر ${formatRelative(d.answeredAt)}` : d.decidedAt ? 'قُرئ' : ''],
    [rejected ? 'القرار' : 'القبول', d.decidedAt ? `${rejected ? 'لم يُقبل' : 'قُبلت'} ${formatDate(d.decidedAt, 'short')}` : ''],
    ['حسابك ودرسك الأول', d.stage === 'approved' ? 'جاهز' : d.stage === 'onboarding' ? 'بانتظارك الآن' : ''],
  ];

  const action = d.stage === 'invited' && d.interviewToken
    ? { href: `/interview?token=${d.interviewToken}`, label: 'ابدأ المقابلة', text: 'المقابلة بانتظارك — نحو 15 دقيقة.' }
    : d.stage === 'onboarding' && d.onboardingToken
      ? { href: `/onboard?token=${d.onboardingToken}`, label: 'أنشئ حسابك', text: 'دقيقة واحدة: كلمة مرور ورابط ملفك.' }
      : d.stage === 'approved'
        ? { href: '/signin', label: 'ادخل', text: 'حسابك جاهز.' }
        : rejected
          ? { href: '/join', label: 'قدّم لدور آخر', text: 'أدوار ما زالت تحتاج متطوعين.' }
          : null;

  return (
    <>
      {justSent && (
        <p role="status" className="p-3 rounded-card bg-success-surface border border-success-border t-label text-success">
          وصل طلبك. أرسلنا هذا الرابط إلى بريدك — إن لم تجده فانظر في مجلد الرسائل غير المرغوبة.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <span className="t-caption text-fg-subtle">طلبك · {[d.roleName, subject].filter(Boolean).join(' · ')}</span>
        <h1 className="t-h1 text-fg-strong">{d.stage === 'rejected' ? `${title}، ${first}` : d.stage === 'onboarding' ? `${title} يا ${first}` : title}</h1>
        <p className="t-body text-fg-muted">{lead}</p>
      </div>

      <ol className="flex flex-col gap-4 p-5 rounded-card bg-raised border border-line">
        {stages.map(([label, note], k) => {
          const done = k < at;
          const cur = k === at && !rejected;
          const bad = rejected && k === 3;
          return (
            <li key={order[k]} className="flex gap-3 items-start" aria-current={cur ? 'step' : undefined}>
              <span className={cx('w-7 h-7 shrink-0 rounded-chip border inline-flex items-center justify-center t-caption',
                bad ? 'border-danger text-danger bg-danger-surface' : done ? 'border-success text-success bg-success-surface' : cur ? 'border-line-accent text-fg-accent bg-accent-wash' : 'border-line-strong text-fg-subtle')}>
                {bad ? '×' : done ? '✓' : k + 1}
              </span>
              <span className="flex flex-col gap-0.5">
                <strong className={cx('t-ui', done || cur ? 'text-fg-strong' : 'text-fg-subtle')}>{label}</strong>
                {note && <span className="t-caption text-fg-muted">{note}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {action && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-card border border-line-accent bg-selected">
          <span className="t-label text-fg">{action.text}</span>
          <Button as={Link} href={action.href} variant="primary">{action.label}</Button>
        </div>
      )}

      {!['approved', 'onboarding'].includes(d.stage) && (
        <div className="flex flex-col gap-2">
          <span className="t-caption text-fg-subtle">في الانتظار</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/demo" className="flex flex-col gap-1 p-4 rounded-card border border-line bg-raised hover:border-line-strong">
              <strong className="t-ui text-fg-strong">جرّب بشير كما يراه الطالب</strong>
              <span className="t-caption text-fg-muted">العرض التجريبي · دقيقتان</span>
            </Link>
            <Link href="/prejoin" className="flex flex-col gap-1 p-4 rounded-card border border-line bg-raised hover:border-line-strong">
              <strong className="t-ui text-fg-strong">لماذا نفير؟</strong>
              <span className="t-caption text-fg-muted">القصة كاملة</span>
            </Link>
          </div>
        </div>
      )}
      <p className="t-caption text-fg-subtle">هذه الصفحة على رابط في بريدك يبقى صالحاً حتى ينتهي طلبك.</p>
    </>
  );
}

// No (valid) link: offer to email it again. The answer is the same whether or
// not the address applied, so nobody can probe for applicants.
function Resend({ reason }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const send = async () => {
    setBusy(true);
    await fetch('/api/contributors/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => {});
    setBusy(false); setSent(true);
  };
  return (
    <div className="flex flex-col gap-4">
      <h1 className="t-h1 text-fg-strong">رابط طلبك</h1>
      <p className="t-body text-fg-muted">
        {reason === 'no-token' ? 'تتابع طلبك من الرابط الذي أرسلناه إلى بريدك.' : 'هذا الرابط غير صالح أو انتهى.'} اكتب بريدك ونرسل إليه رابط طلبك من جديد.
      </p>
      {sent ? (
        <p role="status" className="p-3 rounded-card bg-success-surface border border-success-border t-label text-success">
          إن كان لهذا البريد طلب، فقد أرسلنا إليه الرابط الآن. انظر أيضاً في مجلد الرسائل غير المرغوبة.
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <Field label="البريد الإلكتروني" className="flex-1"><Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
          <Button variant="primary" loading={busy} disabled={!email.includes('@')} onClick={send}>أرسل الرابط</Button>
        </div>
      )}
      <p className="t-caption text-fg-subtle">لم تقدّم بعد؟ <Link href="/join" className="text-fg-accent hover:underline">قدّم الآن</Link></p>
    </div>
  );
}
