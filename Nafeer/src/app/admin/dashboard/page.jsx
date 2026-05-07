'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar }           from './components/AdminSidebar';
import { OverviewSection }        from './components/OverviewSection';
import { PeopleSection }          from './components/PeoplesSection';
import { ReviewQueueSection }     from './components/ReviewQueueSection';
import { CoverageSection }        from './components/CoverageSection';
import { MediaSection }           from './components/MediaSection';
import { AdminsSection }          from './components/AdminSection';
import { CreateContributorModal } from './components/modals/CreateContributorModal';
import { SiteSettingsSection }    from './components/SiteSettingSection';
import { SeedSection }            from './components/SeedSection';
import { PublishSection }         from './components/PublishSection';
import { AdminEditorSection }     from './components/AdminEditorSection';
import { CurriculumSection }      from './components/CurriculumSection';
import { EmailSection }           from './components/EmailSection';

export default function AdminDashboard() {
  const router = useRouter();

  const [section,         setSection]        = useState('overview');
  const [allContributors, setAll]            = useState([]);
  const [isInitialLoad,   setIsInitialLoad]  = useState(true);
  const [reviewTotal,     setReviewTotal]    = useState(0);
  const [showCreate,      setShowCreate]     = useState(false);
  const fetchingRef = useRef(false);

  // ── Fetch all contributors ─────────────────────────────────────────────────
  // Silent after the first call — never resets isInitialLoad to true.
  const loadAll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await fetch('/api/admin/contributors?status=all');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setAll(data.contributors || []);
    } finally {
      setIsInitialLoad(false);
      fetchingRef.current = false;
    }
  }, [router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Optimistic helpers — instant, no refetch ───────────────────────────────
  // Call these immediately after an API action succeeds to update UI in-place.

  /** Replace one contributor's data with a partial patch. */
  const optimisticUpdate = useCallback((id, patch) => {
    setAll((prev) => prev.map((c) => (c._id === id ? { ...c, ...patch } : c)));
  }, []);

  /** Remove a contributor from the list instantly. */
  const optimisticRemove = useCallback((id) => {
    setAll((prev) => prev.filter((c) => c._id !== id));
  }, []);

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
        {section === 'overview'     && <OverviewSection allContributors={allContributors} isLoading={isInitialLoad} />}
        {section === 'contributors' && (
          <PeopleSection
            allContributors={allContributors}
            isLoading={isInitialLoad}
            onRefresh={loadAll}
            onOptimisticUpdate={optimisticUpdate}
            onOptimisticRemove={optimisticRemove}
          />
        )}
        {section === 'review'     && (
          <ReviewQueueSection
            onTotalChange={setReviewTotal}
            onUnauthorized={() => router.push('/admin/login')}
          />
        )}
        {section === 'editor'     && <AdminEditorSection />}
        {section === 'coverage'   && <CoverageSection />}
        {section === 'curriculum' && <CurriculumSection />}
        {section === 'publish'    && <PublishSection />}
        {section === 'media'      && <MediaSection />}
        {section === 'admins'     && <AdminsSection />}
        {section === 'settings'   && <SiteSettingsSection />}
        {section === 'seed'       && <SeedSection />}
        {section === 'email'      && <EmailSection />}
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