import { getCurrentUser } from '@/lib/auth';
import LessonsPage from '@/components/editor/pages/LessonsPage';

export default async function LessonsRoute() {
  const contributor = await getCurrentUser();
  return <LessonsPage subjectId={contributor?.subject} />;
}
