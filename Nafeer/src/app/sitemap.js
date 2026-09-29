import { absoluteUrl }                                   from '@/lib/seo';
import { listPublicContributors, isIndexableContributor } from '@/lib/api/contributors';

// ── sitemap.xml ───────────────────────────────────────────────────────────────
//
// Only genuinely indexable pages belong here. Anything carrying `noindex`
// (/signin, /join, /onboard, /interview, /admin/*, /editor) is excluded by
// design — listing a noindex page in the sitemap sends Google a contradiction.
// The same rule is why profiles run through isIndexableContributor: it is the
// single predicate the profile page's `noindex` is derived from too, so the two
// cannot drift into contradicting each other.
//
// Still to come: lesson / subject pages. None exist on the web yet; lessons
// ship inside the APK. If the web app happens, they get added here.

export const revalidate = 3600;

// ── On lastModified ───────────────────────────────────────────────────────────
//
// These dates are written by hand, and that is the point. The previous version
// stamped `new Date()` on every static route, which — combined with the hourly
// revalidate above — told Google that /, /demo and /prejoin change every single
// hour. They don't. Google measures a sitemap's lastmod against what it finds
// when it crawls, and once the field proves unreliable it discounts it for the
// whole site, which costs the signal on pages where it would have been true.
//
// So: bump the date on a route when you change that page's content, and leave
// it alone otherwise. An honest stale date is worth more than a fresh lie. An
// omitted date is also fine — lastmod is optional, and Google falls back to its
// own crawl history.
//
// changeFrequency and priority are kept for other consumers (Bing, internal
// tooling). Google has stated it ignores both.
const STATIC_ROUTES = [
  { path: '/',        lastModified: '2026-09-29', changeFrequency: 'weekly',  priority: 1.0 },
  { path: '/demo',    lastModified: '2026-08-14', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/prejoin', lastModified: '2026-08-14', changeFrequency: 'monthly', priority: 0.7 },
];

export default async function sitemap() {
  const routes = STATIC_ROUTES.map(({ path, lastModified, changeFrequency, priority }) => ({
    url:          absoluteUrl(path),
    lastModified: new Date(lastModified),
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
      .filter(isIndexableContributor)
      .map((c) => ({
        url:             absoluteUrl(`/contributor/${c.username}`),
        // updatedAt is a real edit timestamp, so it is honest as-is. A profile
        // without one is listed with no lastModified rather than a fabricated
        // `now` — same reasoning as the static routes above.
        ...(c.updatedAt && { lastModified: new Date(c.updatedAt) }),
        changeFrequency: 'weekly',
        priority:        0.5,
      }));
  } catch {
    profiles = [];
  }

  return [...routes, ...profiles];
}
