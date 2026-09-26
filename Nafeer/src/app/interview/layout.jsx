import { pageMetadata } from '@/lib/seo';

// Token-gated interview flow. Must never be indexed.
export const metadata = pageMetadata({
  title:       'المقابلة',
  description: 'نموذج المقابلة للمساهمين.',
  path:        '/interview',
  noindex:     true,
});

export default function Layout({ children }) {
  return children;
}
