'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSubjectStore } from '@/store/subjectStore';
import { useEditorStore }  from '@/store/editorStore';
import { useAtlasSync }    from '@/hooks/useAtlasSync';
import { useLayout }       from '@/hooks/useBreakpoint';
import EditorSidebar       from '@/components/editor/layout/EditorSidebar';
import SyncBanner          from '@/components/editor/layout/SyncBanner';
import { activeNavId }     from '@/components/editor/layout/nav';

// Must match the constants in EditorSidebar.
const RAIL_W     = 60;
const EXPANDED_W = 260;

/**
 * EditorChrome
 * ─────────────────────────────────────────────────────────────────────────────
 * The persistent frame around every editor route: sidebar, sync banner, and
 * the one-time subject bootstrap.
 *
 * This lives in src/app/editor/layout.jsx, so App Router keeps it mounted
 * across navigations — the bootstrap runs once per session rather than on
 * every page switch, and sidebar state survives moving between pages.
 *
 * It replaces EditorShell's switch statement. Pages are real routes now, so
 * nothing here decides what to render; `children` is whatever route matched.
 */
export default function EditorChrome({ contributor, children }) {
  const pathname = usePathname();
  const bootstrapFromSubject = useSubjectStore((s) => s.bootstrapFromSubject);
  const { bootstrapSubject } = useAtlasSync();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile, isDesktop } = useLayout();

  const currentPage = activeNavId(pathname);

  // The lesson editor paints its own sticky header and wants the full canvas.
  const isLessonEditor = /^\/editor\/lessons\/[^/]+$/.test(pathname || '');

  useEffect(() => {
    if (!contributor?.subject) return;
    bootstrapFromSubject(contributor.subject);
    bootstrapSubject(contributor.subject);
  }, [contributor?.subject]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only the desktop tier has room to expand the sidebar; tablet stays a rail.
  const expanded = isDesktop && sidebarOpen;
  const sidebarW = expanded ? EXPANDED_W : RAIL_W;

  return (
    <div className="flex min-h-[100dvh]" style={{ background: 'var(--bg-primary)' }} dir="rtl">
      <EditorSidebar
        currentPage={currentPage}
        contributor={contributor}
        isOpen={expanded}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      <main
        className="flex min-w-0 flex-1 flex-col"
        style={
          isMobile
            ? { marginRight: 0, paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }
            : { marginRight: sidebarW, transition: 'margin-right 0.26s cubic-bezier(0.4,0,0.2,1)' }
        }
      >
        {/* The lesson editor shows sync state inside its own header instead. */}
        {!isLessonEditor && <SyncBanner />}
        {children}
      </main>
    </div>
  );
}
