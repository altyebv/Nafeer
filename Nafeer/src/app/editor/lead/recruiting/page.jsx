import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { normaliseLead } from '@/lib/leads';
import RecruitingPage from '@/components/editor/pages/RecruitingPage';

// The lead's applicants and interview questions (docs/team-leads.md L3). Which
// tabs to show is read here; /api/lead/applicants and /api/lead/interview
// check again on every request. The editor's subject is passed for the owner.
export default async function RecruitingRoute() {
  const user = await getCurrentUser();
  let lead = null;
  if (user?.id) {
    await connectDB();
    const c = await Contributor.findById(user.id).select('lead subject').lean();
    lead = normaliseLead(c?.lead, c?.subject);
  }
  return (
    <RecruitingPage
      subjectId={user?.subject || null}
      canDecide={!!lead?.canDecideApplicants}
      canEditInterview={!!lead?.canEditInterview}
    />
  );
}
