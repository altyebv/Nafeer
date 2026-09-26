import { absoluteUrl }             from '@/lib/seo';
import { listPublicContributors }  from '@/lib/api/contributors';
import { SYSTEM_SEED_USERNAME }    from '@/lib/SeedActor';

// ── sitemap.xml ───────────────────────────────────────────────────────────────
//
// Only genuinely indexable pages belong here. Anything carrying `noindex`
// (/signin, /join, /onboard, /interview, /admin/*, /editor) is excluded by
// design — listing a noindex page in the sitemap sends Google a contradiction.
//
// Still to come: lesson / subject pages. None exist on the web yet; lessons
// ship inside the APK. If the web app happens, they get added here.

export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: '/',        changeFrequency: 'weekly',  priority: 1.0 },
  { path: '/demo',    changeFrequency: 'monthly', priority: 0.9 },
  { path: '/prejoin', changeFrequency: 'monthly', priority: 0.7 },
];

export default async function sitemap() {
  const now = new Date();

  const routes = STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url:             absoluteUrl(path),
    lastModified:    now,
    changeFrequency,
    priority,
  }));

  // Contributor profiles. Wrapped because the sitemap is prerendered at build
  // time: an unreachable database should cost us the profile URLs, not the
  // whole deploy.
  let profiles = [];
  try {
    const contributors = await listPublicContributors();

    profiles = contributors
      .filter((c) => c.username && c.username !== SYSTEM_SEED_USERNAME)
      .map((c) => ({
        url:             absoluteUrl(`/contributor/${c.username}`),
        lastModified:    c.updatedAt ? new Date(c.updatedAt) : now,
        changeFrequency: 'weekly',
        priority:        0.5,
      }));
  } catch {
    profiles = [];
  }

  return [...routes, ...profiles];
}
