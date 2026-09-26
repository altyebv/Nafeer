import { pageMetadata } from '@/lib/seo';

// Auth screen — nothing to index.
export const metadata = pageMetadata({
  title:       'تسجيل الدخول',
  description: 'تسجيل دخول المساهمين إلى نفير.',
  path:        '/signin',
  noindex:     true,
});

export default function Layout({ children }) {
  return children;
}
