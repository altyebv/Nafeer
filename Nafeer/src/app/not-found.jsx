import Link from 'next/link';

// ── Root 404 ──────────────────────────────────────────────────────────────────
//
// Next already returns a real 404 status and its own noindex for this boundary —
// see the note in app/layout.jsx about why the root layout must not declare
// index/follow, which would contradict that. So this file is not about status
// codes; it is about not dead-ending.
//
// The default Next 404 is a black page with no links out. A crawler that lands
// on one — from a stale inbound link, a typo'd share, a removed URL — has
// nowhere to go and the crawl path simply ends. On a site with six indexable
// URLs, every internal link out of a dead end is worth having.
//
// No `export const metadata`: adding one here would override the noindex Next
// emits on this boundary.

const LINKS = [
  { href: '/',        label: 'الصفحة الرئيسية', hint: 'تعرّف على بشير' },
  { href: '/demo',    label: 'جرّب بشير',        hint: 'معاينة تفاعلية من المتصفح' },
  { href: '/prejoin', label: 'شارك في البناء',   hint: 'انضم إلى فريق نفير' },
];

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20 font-arabic"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <span className="text-5xl mb-6" style={{ color: 'var(--accent)', opacity: 0.35 }}>
        ◈
      </span>

      <p className="font-mono text-sm tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
        404
      </p>

      <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-center">
        الصفحة غير موجودة
      </h1>

      <p
        className="text-base leading-loose mb-10 max-w-md text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        الرابط الذي فتحته لم يعد موجوداً، أو ربما كتب بشكل غير صحيح.
      </p>

      <nav className="w-full max-w-md flex flex-col gap-3">
        {LINKS.map(({ href, label, hint }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-1 rounded-xl px-5 py-4 transition-colors"
            style={{
              border:     '1px solid var(--border-mid)',
              background: 'var(--bg-card)',
            }}
          >
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {label}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {hint}
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
