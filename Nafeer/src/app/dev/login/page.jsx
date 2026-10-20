import { notFound } from 'next/navigation';
import { DEV_APPLICANTS, DEV_PERSONAS } from '@/lib/devPersonas';
import { DB_NAME, isDevDatabase } from '@/lib/db';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';

// ─── /dev/login — development only ────────────────────────────────────────────
// One click to be any test persona of the dev database (docs/dev-database.md),
// or the owner. Each link replaces the current session.

export const metadata = { title: 'دخول تجريبي', robots: { index: false, follow: false } };

export default function DevLoginPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  return (
    <main dir="rtl" className="min-h-screen bg-page text-fg font-ui px-4 py-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="t-h2 text-fg-strong">دخول تجريبي</h1>
          <p className="t-label text-fg-muted">
            قاعدة البيانات: <strong dir="ltr">{DB_NAME || 'الحيّة (live)'}</strong>
            {!isDevDatabase() && ' — الدخول التجريبي معطّل عليها. اضبط MONGODB_DB=nafeer_dev.'}
          </p>
        </header>

        <section className="flex flex-col gap-2">
          <h2 className="t-title text-fg-strong">المالك</h2>
          <a href="/api/dev/admin-login" className="p-3 rounded-card border border-line bg-raised hover:border-line-strong t-ui">
            لوحة التحكم كمالك ←
          </a>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="t-title text-fg-strong">المساهمون</h2>
          {DEV_PERSONAS.map((p) => (
            <a key={p.username} href={`/api/dev/autologin?as=${p.username}`}
              className="flex flex-col gap-0.5 p-3 rounded-card border border-line bg-raised hover:border-line-strong">
              <span className="t-ui text-fg-strong">{p.name} <span className="t-caption text-fg-subtle" dir="ltr">@{p.username}</span></span>
              <span className="t-caption text-fg-muted">{SUBJECTS_BY_ID[p.subject]?.nameAr} · {p.about}</span>
            </a>
          ))}
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="t-title text-fg-strong">المتقدمون</h2>
          <p className="t-caption text-fg-subtle">لا دخول لهم — يظهرون في صفحة «المتقدمون» لقائدة الجغرافيا.</p>
          {DEV_APPLICANTS.map((a) => <span key={a.key} className="t-label text-fg-muted">• {a.name}: {a.about}</span>)}
        </section>
      </div>
    </main>
  );
}
