import { requireLeadOfOwnSubject, ok, err } from '@/lib/api/guard';
import { getLeadInbox } from '@/lib/api/leadInbox';

// ─── GET /api/lead/inbox ──────────────────────────────────────────────────────
// The lead's inbox for their own subject (lib/api/leadInbox.js). The owner may
// open any subject's with ?subjectId=.
export async function GET(request) {
  try {
    const subjectParam = new URL(request.url).searchParams.get('subjectId');
    const { user, subjectId } = await requireLeadOfOwnSubject('canReview', subjectParam);
    return ok(await getLeadInbox(subjectId, user.role === 'admin' ? null : user.id));
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/lead/inbox]', e);
    return err('خطأ في الخادم', 500);
  }
}
