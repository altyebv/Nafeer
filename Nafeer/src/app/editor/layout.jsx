import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { isPaused, normaliseLead } from '@/lib/leads';
import EditorChrome from '@/components/editor/layout/EditorChrome';

// ─── Editor layout ────────────────────────────────────────────────────────────
// Auth is already enforced for /editor/:path* by src/middleware.js; this just
// resolves the contributor for the chrome. Because it is a layout, EditorChrome
// stays mounted across navigations — the Atlas bootstrap runs once per session
// and sidebar state survives moving between pages.

export const metadata = {
  title:  'أداة التحرير',
  robots: { index: false, follow: false },
};

// Whether the contributor leads their subject, and whether a lead has paused
// them (docs/team-leads.md), is read from the database, not the 7-day JWT, so
// the «الإشراف» group and the paused banner follow the decision. One small
// read per editor load — the layout does not re-render on in-editor
// navigation. The routes behind it check again on every request; this only
// decides what the chrome shows.
async function standingOf(user) {
  if (!user?.id) return { lead: null, paused: null };
  try {
    await connectDB();
    const c = await Contributor.findById(user.id).select('lead subject paused').lean();
    return {
      lead:   normaliseLead(c?.lead, c?.subject),
      paused: isPaused(c?.paused)
        ? { until: c.paused.until || null, reason: c.paused.reason || '', byName: c.paused.byName || '' }
        : null,
    };
  } catch {
    return { lead: null, paused: null };
  }
}

export default async function EditorLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/signin?sessionExpired=1');
  const contributor = { ...user, ...(await standingOf(user)) };
  return <EditorChrome contributor={contributor}>{children}</EditorChrome>;
}
