import { after } from 'next/server';
import { requireLeadOfOwnSubject, ok, err } from '@/lib/api/guard';
import { getLeadInbox } from '@/lib/api/leadInbox';
import { applyDueReleases } from '@/lib/releases';

// ─── GET /api/lead/inbox ──────────────────────────────────────────────────────
// The lead's inbox for their own subject (lib/api/leadInbox.js). The owner may
// open any subject's with ?subjectId=.
export async function GET(request) {
  try {
    const subjectParam = new URL(request.url).searchParams.get('subjectId');
    const { user, subjectId } = await requireLeadOfOwnSubject('canReview', subjectParam);
    // A held release whose time has come goes live after this response (lib/releases.js).
    after(() => applyDueReleases().catch((e) => console.warn('[release sweep]', e.message)));
    return ok(await getLeadInbox(subjectId, user.role === 'admin' ? null : user.id));
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/lead/inbox]', e);
    return err('خطأ في الخادم', 500);
  }
}
