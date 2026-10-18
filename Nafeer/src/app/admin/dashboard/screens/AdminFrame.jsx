'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '../components/AdminSidebar';

// ─── AdminFrame ───────────────────────────────────────────────────────────────
// The dashboard's chrome for pages that have their own route (a subject, a
// lesson). The sidebar is the same one; picking a section goes back to the
// dashboard at that section's hash.
export function AdminFrame({ section, children }) {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="admin-shell min-h-screen bg-page text-fg font-ui" dir="rtl">
      <AdminSidebar
        section={section}
        badges={{}}
        open={navOpen}
        onOpenChange={setNavOpen}
        onSelect={(id) => router.push(`/admin/dashboard#${id}`)}
        onCreateContributor={() => router.push('/admin/dashboard#contributors')}
        onSignOut={signOut}
      />
      <main className="min-h-screen pt-14 lg:pt-0 lg:mr-64">{children}</main>
    </div>
  );
}

// Every admin screen's body: the same gutters, one width.
export function ScreenBody({ children }) {
  return <div className="px-4 sm:px-6 lg:px-8 pb-12 max-w-[1440px]">{children}</div>;
}
