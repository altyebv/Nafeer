import { getCurrentUser } from '@/lib/auth';
import FeedItemsPage from '@/components/editor/pages/FeedItemsPage';

export default async function FeedsRoute() {
  const contributor = await getCurrentUser();
  return <FeedItemsPage subjectId={contributor?.subject} />;
}
