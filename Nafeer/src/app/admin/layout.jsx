import { pageMetadata } from '@/lib/seo';

// Covers /admin/login and /admin/dashboard. The dashboard sits behind
// middleware, but /admin/login answers 200 to anyone who asks.
export const metadata = pageMetadata({
  title:       'لوحة التحكم',
  description: 'لوحة تحكم نفير.',
  path:        '/admin',
  noindex:     true,
});

export default function Layout({ children }) {
  return children;
}
