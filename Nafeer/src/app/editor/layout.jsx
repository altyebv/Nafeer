import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { normaliseLead } from '@/lib/leads';
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

// Whether the contributor leads their subject (docs/team-leads.md) is read
// from the database, not the 7-day JWT, so the «الإشراف» group appears and
// disappears with the owner's decision. One small read per editor load — the
// layout does not re-render on in-editor navigation. The routes behind it
// check again on every request; this only decides what the sidebar shows.
async function leadOf(user) {
  if (!user?.id) return null;
  try {
    await connectDB();
    const c = await Contributor.findById(user.id).select('lead subject').lean();
    return normaliseLead(c?.lead, c?.subject);
  } catch {
    return null;
  }
}

export default async function EditorLayout({ children }) {
  const user = await getCurrentUser();
  const contributor = user ? { ...user, lead: await leadOf(user) } : user;
  return <EditorChrome contributor={contributor}>{children}</EditorChrome>;
}
