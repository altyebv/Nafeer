import { getCurrentUser } from '@/lib/auth';
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

export default async function EditorLayout({ children }) {
  const contributor = await getCurrentUser();
  return <EditorChrome contributor={contributor}>{children}</EditorChrome>;
}
