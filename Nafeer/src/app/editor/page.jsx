import { getCurrentUser } from '@/lib/auth';
import EditorShell from '@/components/editor/EditorShell';

export const metadata = {
  title: 'أداة التحرير — نفير',
};

export default async function EditorPage() {
  // Server-side: get current user from cookie
  const user = await getCurrentUser();

  return <EditorShell contributor={user} />;
}
