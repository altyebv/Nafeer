import { getCurrentUser } from '@/lib/auth';
import MediaPage from '@/components/editor/pages/MediaPage';

export default async function MediaRoute() {
  const contributor = await getCurrentUser();
  return <MediaPage subjectId={contributor?.subject} contributor={contributor} />;
}
