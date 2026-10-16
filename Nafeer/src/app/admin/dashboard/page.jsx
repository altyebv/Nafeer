'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar }           from './components/AdminSidebar';
import { MediaSection }           from './components/MediaSection';
import { AdminsSection }          from './components/AdminSection';
import { CreateContributorModal } from './components/modals/CreateContributorModal';
import { SiteSettingsSection }    from './components/SiteSettingSection';
import { SeedSection }            from './components/SeedSection';
import { PublishSection }         from './components/PublishSection';
import { EmailSection }           from './components/EmailSection';
import { OverviewScreen }         from './screens/OverviewScreen';
import { SubjectsIndex }          from './screens/SubjectsIndex';
import { ContributorsScreen }     from './screens/ContributorsScreen';
import { CommsScreen }            from './screens/CommsScreen';
import { ReviewScreen }           from './screens/ReviewScreen';
import { AndroidInsightsSection } from './components/android/AndroidInsightsSection';


// Every section the dashboard can render — a hash outside this list is ignored.
const SECTION_IDS = [
  'overview', 'subjects', 'contributors', 'review', 'publish',
  'media', 'admins', 'settings', 'seed', 'email', 'comms', 'android',
];

// Sections folded into the subject pages (DS5); old links land on the list.
const MOVED = { editor: 'subjects', curriculum: 'subjects', coverage: 'subjects' };

export default function AdminDashboard() {
  const router = useRouter();

  const [section,         setSectionState]   = useState('overview');
  const [navOpen,         setNavOpen]        = useState(false);
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

  // ── Section ↔ URL hash ─────────────────────────────────────────────────────
  // Keeps the open section across a refresh and makes it linkable
  // (/admin/dashboard#email). Read after mount to avoid a hydration mismatch.
  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      const id = MOVED[hash] || hash;
      if (SECTION_IDS.includes(id)) setSectionState(id);
      if (MOVED[hash]) window.history.replaceState(null, '', `#${id}`);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const setSection = useCallback((id) => {
    setSectionState(id);
    window.history.replaceState(null, '', `#${id}`);
    window.scrollTo(0, 0);
  }, []);

  const handleSignOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const pendingCount = allContributors.filter((c) => c.status === 'pending').length;
  const badges = { pending: pendingCount, reviewTotal };

  return (
    <div className="admin-shell min-h-screen bg-ink-950 text-ink-100" dir="rtl">

      <AdminSidebar
        section={section}
        badges={badges}
        open={navOpen}
        onOpenChange={setNavOpen}
        onSelect={setSection}
        onCreateContributor={() => setShowCreate(true)}
        onSignOut={handleSignOut}
      />

      <main className="min-h-screen pt-14 lg:pt-0 lg:mr-64">
        {section === 'overview'     && <OverviewScreen onOpen={setSection} />}
        {section === 'subjects'     && <SubjectsIndex />}
        {section === 'contributors' && (
          <ContributorsScreen allContributors={allContributors} isLoading={isInitialLoad} onRefresh={loadAll} />
        )}
        {section === 'review'     && <ReviewScreen onTotalChange={setReviewTotal} />}
        {section === 'publish'    && <PublishSection />}
        {section === 'media'      && <MediaSection />}
        {section === 'admins'     && <AdminsSection />}
        {section === 'settings'   && <SiteSettingsSection />}
        {section === 'seed'       && <SeedSection />}
        {section === 'email'      && <EmailSection />}
        {section === 'comms'      && <CommsScreen allContributors={allContributors} />}
        {section === 'android'    && <AndroidInsightsSection />}
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