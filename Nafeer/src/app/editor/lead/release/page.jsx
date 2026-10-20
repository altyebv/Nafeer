import { getCurrentUser } from '@/lib/auth';
import LeadReleasePage from '@/components/editor/pages/LeadReleasePage';

// The lead's release page (docs/team-leads.md L5). /api/lead/releases decides
// who may use it. The editor's subject is passed for the owner.
export default async function LeadReleaseRoute() {
  const user = await getCurrentUser();
  return <LeadReleasePage subjectId={user?.subject || null} />;
}
