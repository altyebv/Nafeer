import { notFound }              from 'next/navigation';
import { getPublicContributor }  from '@/lib/api/contributors';
import { pageMetadata }          from '@/lib/seo';
import { SUBJECTS_CATALOG }      from '@/shared/curriculum';
import { SYSTEM_SEED_USERNAME }  from '@/lib/SeedActor';
import ProfileView               from './ProfileView';
import JsonLd                    from '@/components/JsonLd';
import { contributorProfilePage } from '@/lib/jsonld';

// ── Contributor profile ───────────────────────────────────────────────────────
//
// Server component so each profile can carry its own title, description and
// canonical, and so a username that doesn't exist returns a real 404 instead of
// a 200 with an empty shell. The visible UI lives in ProfileView.
//
// Revalidated hourly: profiles change when someone contributes, which is often
// enough to matter and rare enough that per-request DB reads would be waste.

export const revalidate = 3600;

const SUBJECT_MAP = Object.fromEntries(SUBJECTS_CATALOG.map((s) => [s.id, s]));

const ROLE_AR = {
  contributor: 'مساهم',
  reviewer:    'مراجع',
  lead:        'قائد مجتمع',
  editor:      'محرر',
};

// Prefer the contributor's own bio. Failing that, build a sentence from the
// role and subject — a generated line still beats every profile inheriting the
// site-wide description.
function describe(c) {
  if (c.bio) return c.bio;

  const role    = ROLE_AR[c.role] || ROLE_AR.contributor;
  const subject = SUBJECT_MAP[c.subject]?.nameAr;

  return subject
    ? `${c.name} — ${role} في نفير، يساهم في محتوى ${subject} لطلاب الشهادة السودانية.`
    : `${c.name} — ${role} في نفير، يساهم في بناء محتوى الشهادة السودانية.`;
}

export async function generateMetadata({ params }) {
  const { username }  = await params;
  const contributor   = await getPublicContributor(username);

  // Metadata resolves before the page body, so this runs for unknown usernames
  // too. The page then calls notFound(), and Next renders not-found.jsx with its
  // own noindex — so this branch exists to avoid dereferencing null, not to set
  // the 404's tags.
  if (!contributor) return { title: 'مساهم غير موجود' };

  return pageMetadata({
    title:       `${contributor.name} — مساهم في نفير`,
    ogTitle:     `${contributor.name} · نفير`,
    description: describe(contributor),
    path:        `/contributor/${contributor.username}`,
    // Real page, real content — but a synthetic account, so keep it out of
    // search results. It still renders for anyone following a link.
    noindex:     contributor.username === SYSTEM_SEED_USERNAME,
  });
}

export default async function ContributorProfilePage({ params }) {
  const { username }  = await params;
  const contributor   = await getPublicContributor(username);

  if (!contributor) notFound();

  // Structured data mirrors what the page actually shows — the same role and
  // subject rendered in the chips, the same description used for the meta tag.
  const jsonLd = contributorProfilePage({
    contributor,
    description: describe(contributor),
    jobTitle:    ROLE_AR[contributor.role] || ROLE_AR.contributor,
    knowsAbout:  SUBJECT_MAP[contributor.subject]?.nameAr,
  });

  return (
    <>
      {contributor.username !== SYSTEM_SEED_USERNAME && <JsonLd data={jsonLd} />}
      <ProfileView profile={contributor} />
    </>
  );
}
