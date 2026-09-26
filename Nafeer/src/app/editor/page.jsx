import { getCurrentUser } from '@/lib/auth';
import EditorShell from '@/components/editor/layout/EditorShell';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title:       'أداة التحرير',
  description: 'أداة تحرير المحتوى للمساهمين.',
  path:        '/editor',
  noindex:     true,
});

export default async function EditorPage() {
  // Server-side: get current user from cookie
  const user = await getCurrentUser();

  return <EditorShell contributor={user} />;
}
