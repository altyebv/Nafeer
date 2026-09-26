import { SITE_URL } from '@/lib/seo';

// ── robots.txt ────────────────────────────────────────────────────────────────
//
// Only /api/ is disallowed. Everything else the crawler is allowed to fetch,
// because the pages we want kept out of the index (auth screens, the join form,
// the interview flow, admin) carry a `noindex` tag instead — see
// `pageMetadata({ noindex: true })`. Blocking those in robots.txt would be
// counterproductive: Google would never crawl them, never read the noindex, and
// could still list the bare URL.
//
// /api/ is different — there is no page to tag, and `GET /api/export` returns
// the entire content bundle as JSON. That must never be crawled: it is pure
// crawl-budget waste and would put the whole curriculum in the index as a blob.

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  };
}
