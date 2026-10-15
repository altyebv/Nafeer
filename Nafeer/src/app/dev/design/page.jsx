import { notFound } from 'next/navigation';
import Gallery from './Gallery';

// ─── /dev/design ──────────────────────────────────────────────────────────────
// The living reference for docs/design-system.md: every role token and every
// ui/ component in both themes. It is the review surface for any token change.
//
// Development only, like /api/dev/autologin — in a production build it is a
// 404, so it costs nothing on the free tier and is never indexed.

export const metadata = {
  title: 'نظام التصميم',
  robots: { index: false, follow: false },
};

export default function DesignPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <Gallery />;
}
