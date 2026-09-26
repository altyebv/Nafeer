import { pageMetadata } from '@/lib/seo';

// The application form itself: thin, multi-step and stateful. /prejoin carries
// the indexable copy for this journey.
export const metadata = pageMetadata({
  title:       'طلب الانضمام',
  description: 'أكمل طلب الانضمام إلى فريق نفير.',
  path:        '/join',
  noindex:     true,
});

export default function Layout({ children }) {
  return children;
}
