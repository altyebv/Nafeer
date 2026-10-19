import { getCurrentUser } from '@/lib/auth';
import LeadInboxPage from '@/components/editor/pages/LeadInboxPage';

// The lead's inbox (docs/team-leads.md). Who may see it is decided by
// /api/lead/inbox on every load; anyone else gets its refusal on the page.
// The editor's subject is passed along for the owner, who has none of their
// own; for a lead the route ignores it and uses theirs.
export default async function LeadRoute() {
  const user = await getCurrentUser();
  return <LeadInboxPage subjectId={user?.subject || null} />;
}
