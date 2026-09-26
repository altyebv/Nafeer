import { absoluteUrl } from '@/lib/seo';

// ── sitemap.xml ───────────────────────────────────────────────────────────────
//
// Only genuinely indexable pages belong here. Anything carrying `noindex`
// (/signin, /join, /onboard, /interview, /admin/*, /editor) is excluded by
// design — listing a noindex page in the sitemap sends Google a contradiction.
//
// Two extension points, both deliberately empty for now:
//
//   1. Contributor profiles (/contributor/[username]) — these go in once the
//      route is a server component with its own generateMetadata and a real
//      404. Today it is a client component that renders the root title for
//      every profile and returns HTTP 200 for usernames that don't exist, so
//      submitting them would feed Google duplicate titles and soft 404s.
//
//   2. Lesson / subject pages — none exist on the web yet; lessons ship inside
//      the APK. If the web app happens, they get added here.

export default function sitemap() {
  const now = new Date();

  return [
    {
      url:              absoluteUrl('/'),
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              absoluteUrl('/demo'),
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              absoluteUrl('/prejoin'),
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.7,
    },
  ];
}
