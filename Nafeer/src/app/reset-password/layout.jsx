import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'تعيين كلمة مرور جديدة',
  description: 'تعيين كلمة مرور جديدة لحساب المساهم في نفير.',
  path: '/reset-password',
  noindex: true,
});

export default function Layout({ children }) {
  return children;
}
