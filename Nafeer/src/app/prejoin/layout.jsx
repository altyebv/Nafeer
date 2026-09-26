import { pageMetadata } from '@/lib/seo';

// Contributor-facing entry point — the page that should rank for volunteering
// queries. /join is only the form behind it, and is kept out of the index.
export const metadata = pageMetadata({
  title:       'شارك في بناء بشير',
  description:
    'نفير مشروع مفتوح لبناء محتوى الشهادة السودانية. معلمون، طلاب، مصممون ' +
    'ومبرمجون — لكل مساهم مكان.',
  path:        '/prejoin',
});

export default function Layout({ children }) {
  return children;
}
