import { getCurrentUser } from '@/lib/auth';
import ConceptsPage from '@/components/editor/pages/ConceptsPage';

export default async function ConceptsRoute() {
  const contributor = await getCurrentUser();
  return <ConceptsPage subjectId={contributor?.subject} />;
}
