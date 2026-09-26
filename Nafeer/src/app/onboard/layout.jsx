import { pageMetadata } from '@/lib/seo';

// Token-gated: the credential is in the URL. Must never be indexed.
export const metadata = pageMetadata({
  title:       'إكمال التسجيل',
  description: 'إكمال بيانات المساهم.',
  path:        '/onboard',
  noindex:     true,
});

export default function Layout({ children }) {
  return children;
}
