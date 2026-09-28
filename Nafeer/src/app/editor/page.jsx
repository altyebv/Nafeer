import { getCurrentUser } from '@/lib/auth';
import DashboardPage from '@/components/editor/pages/DashboardPage';

export default async function EditorHomeRoute() {
  const contributor = await getCurrentUser();
  return <DashboardPage contributor={contributor} />;
}
