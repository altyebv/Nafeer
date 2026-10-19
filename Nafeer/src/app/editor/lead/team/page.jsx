import { getCurrentUser } from '@/lib/auth';
import LeadTeamPage from '@/components/editor/pages/LeadTeamPage';

// The lead's team page (docs/team-leads.md L2). /api/lead/team decides who may
// see it on every load. The editor's subject is passed for the owner, who has
// none of their own; for a lead the route ignores it.
export default async function LeadTeamRoute() {
  const user = await getCurrentUser();
  return <LeadTeamPage subjectId={user?.subject || null} viewerId={user?.id || null} />;
}
