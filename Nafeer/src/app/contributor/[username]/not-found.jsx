import Link from 'next/link';

// Rendered by notFound() in page.jsx — and, unlike the old client-side "not
// found" state, this one comes with an actual HTTP 404. Previously every
// /contributor/<anything> returned 200, which handed crawlers an unbounded
// space of soft-404 URLs to index.
export default function ContributorNotFound() {
  return (
    <div dir="rtl" className="min-h-screen bg-page font-ui flex flex-col items-center justify-center gap-3 px-6 text-center">
      <span aria-hidden="true" className="t-display text-fg-subtle">◈</span>
      <p className="t-title text-fg-muted">ما لقينا المٌساهِم ده</p>
      <p dir="ltr" className="t-caption text-fg-subtle">contributor not found</p>
      <Link href="/" className="t-label text-fg-accent hover:underline mt-2">العودة للرئيسية</Link>
    </div>
  );
}
