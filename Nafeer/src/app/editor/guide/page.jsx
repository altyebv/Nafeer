import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { leadCan, normaliseLead } from '@/lib/leads';
import GuidePage from '@/components/editor/pages/GuidePage';

// «دليل المادة» — the subject's handbook and review checklist
// (docs/team-leads.md L2). Every member reads it; the lead may edit. Whether
// to show the editor is read here; the PUT checks again.
export default async function GuideRoute() {
  const user = await getCurrentUser();
  let canEdit = false;
  if (user?.id && user.subject) {
    await connectDB();
    const c = await Contributor.findById(user.id).select('lead subject').lean();
    const me = { ...user, subject: c?.subject, lead: normaliseLead(c?.lead, c?.subject) };
    canEdit = leadCan(me, 'canManageTeam', c?.subject);
  }
  return <GuidePage subjectId={user?.subject || null} canEdit={canEdit} />;
}
