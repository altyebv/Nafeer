'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar }          from './components/AdminSidebar';
import { OverviewSection }       from './components/OverviewSection';
import { ContributorsSection }   from './components/ContributorsSection';
import { ReviewQueueSection }    from './components/ReviewQueueSection';
import { CoverageSection }       from './components/CoverageSection';
import { MediaSection }          from './components/MediaSection';
import { RolesSection }          from './components/RolesSection';
import { AdminsSection }         from './components/AdminSection';
import { CreateContributorModal } from './components/modals/CreateContributorModal';
import { SiteSettingsSection }   from './components/SiteSettingSection';
import { SeedSection }           from './components/SeedSection';
import { PublishSection }        from './components/PublishSection';  // ← NEW

export default function AdminDashboard() {
  const router = useRouter();

  const [section,         setSection]    = useState('overview');
  const [allContributors, setAll]        = useState([]);
  const [reviewTotal,     setReviewTotal] = useState(0);
  const [showCreate,      setShowCreate] = useState(false);

  const loadAll = useCallback(async () => {
    const res = await fetch('/api/admin/contributors?status=all');
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    setAll(data.contributors || []);
  }, [router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSignOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const pendingCount = allContributors.filter((c) => c.status === 'pending').length;
  const badges = { pending: pendingCount, reviewTotal };

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 flex" dir="rtl">

      <AdminSidebar
        section={section}
        badges={badges}
        onSelect={setSection}
        onCreateContributor={() => setShowCreate(true)}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 mr-56 min-h-screen overflow-y-auto">
        {section === 'overview'      && <OverviewSection allContributors={allContributors} />}
        {section === 'contributors'  && (
          <ContributorsSection allContributors={allContributors} onRefresh={loadAll} />
        )}
        {section === 'roles'         && <RolesSection />}
        {section === 'review'        && (
          <ReviewQueueSection
            onTotalChange={setReviewTotal}
            onUnauthorized={() => router.push('/admin/login')}
          />
        )}
        {section === 'coverage'      && <CoverageSection />}
        {section === 'publish'       && <PublishSection />}        {/* ← NEW */}
        {section === 'media'         && <MediaSection />}
        {section === 'admins'        && <AdminsSection />}
        {section === 'settings'      && <SiteSettingsSection />}
        {section === 'seed'          && <SeedSection />}
      </main>

      {showCreate && (
        <CreateContributorModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadAll(); }}
        />
      )}
    </div>
  );
}