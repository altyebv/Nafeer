// ── Canonical site identity ───────────────────────────────────────────────────
//
// Single source of truth for every absolute URL the site emits: canonical tags,
// Open Graph URLs, the sitemap and robots.txt.
//
// NEXT_PUBLIC_APP_URL is deliberately NOT used here. That variable tracks the
// current Vercel deployment and is consumed by the contributor-invite emails,
// which must keep resolving on preview deploys. SEO URLs must always point at
// the one canonical host — a canonical tag aimed at a preview URL is worse than
// no canonical tag at all.

export const SITE_URL  = 'https://nafeer4sudan.site';
export const SITE_NAME = 'نفير';
export const LOCALE    = 'ar_SD';

// Absolute URL for a site-relative path. The trailing slash is stripped so a
// path never yields two canonicals for the same page.
export function absoluteUrl(path = '/') {
  if (!path || path === '/') return SITE_URL;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${suffix}`.replace(/\/$/, '');
}

// ── Page metadata builder ─────────────────────────────────────────────────────
//
// Every route should go through this so canonical, Open Graph and Twitter tags
// can't drift apart.
//
// The OG image is named explicitly rather than relying on the file-based
// app/opengraph-image.js cascading down. It does not cascade reliably: a route
// whose metadata lives in page.jsx (rather than layout.jsx) and that declares
// its own openGraph block loses the inherited image — /demo did exactly that.
// Naming it here makes every route emit the same card, whatever the shape of
// the segment. metadataBase in the root layout resolves it to an absolute URL.
//
// `noindex` is for pages that must stay crawlable but out of the index — auth
// screens, forms, token-gated flows. Those are deliberately NOT disallowed in
// robots.txt: a page blocked from crawling can still be indexed URL-only,
// because the crawler never gets far enough to read the noindex. They also get
// no canonical — pairing noindex with a canonical sends Google two contra-
// dictory instructions about the same URL.

export const OG_IMAGE = {
  url:    '/opengraph-image',
  width:  1200,
  height: 630,
  alt:    'بشير — رفيق الشهادة السودانية',
};

// `absoluteTitle` opts a route out of the root layout's `%s — نفير` template.
// Without it, a title that already names the brand gets it appended a second
// time: contributor profiles were shipping as
// "مساهم تجريبي — مساهم في نفير — نفير", which reads as a bug in a result list
// and eats the character budget before the name is even visible.
export function pageMetadata({
  title,
  description,
  path = '/',
  noindex = false,
  ogTitle,
  absoluteTitle = false,
}) {
  const url        = absoluteUrl(path);
  const ogHeadline = ogTitle ?? `${title} — ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,

    ...(noindex
      ? {
          robots: {
            index:  false,
            follow: false,
            googleBot: { index: false, follow: false },
          },
        }
      : { alternates: { canonical: url } }),

    openGraph: {
      type:     'website',
      title:    ogHeadline,
      description,
      url,
      siteName: SITE_NAME,
      locale:   LOCALE,
      images:   [OG_IMAGE],
    },

    twitter: {
      card:   'summary_large_image',
      title:  ogHeadline,
      description,
      images: [OG_IMAGE],
    },
  };
}
