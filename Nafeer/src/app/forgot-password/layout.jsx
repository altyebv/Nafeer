import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'استعادة كلمة المرور',
  description: 'استعادة كلمة مرور حساب المساهم في نفير.',
  path: '/forgot-password',
  noindex: true,
});

export default function Layout({ children }) {
  return children;
}
