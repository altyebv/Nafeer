import './globals.css';
import { SITE_URL, SITE_NAME, LOCALE, OG_IMAGE } from '@/lib/seo';
import ThemeSync from '@/components/theme/ThemeSync';

// ── Site-wide metadata ────────────────────────────────────────────────────────
//
// The landing page speaks to students and parents, not contributors, so the
// default title and description sell بشير — the app — rather than نفير, the
// platform that builds it. Contributor-facing copy lives on /prejoin.
//
// metadataBase is what turns the file-based opengraph-image into an absolute
// URL. Without it Next emits a relative og:image and every social scraper
// silently drops the card.

// Two titles, same words, different order — and the split is deliberate.
//
// SEARCH_TITLE leads with the query. "بشير" is a brand with no recognition yet,
// so spending the first slot of the <title> on it wastes the position that
// carries the most weight and is the part a searcher scans first. The head term
// goes first; the brand still closes the line.
//
// SOCIAL_TITLE keeps the original brand-first order. An OG card is seen by
// someone a friend already sent the link to — they are not scanning a results
// page, and brand-first reads as a name rather than a search result. The OG
// image itself (app/opengraph-image.js) is brand-led for the same reason.
const SEARCH_TITLE = 'الشهادة السودانية — بشير، رفيق المنهج';
const SOCIAL_TITLE = 'بشير — رفيق الشهادة السودانية';

const DESCRIPTION =
  'بشير يشرح منهج الشهادة السودانية بلغة واضحة — دروس مبسطة، بطاقات مراجعة، ' +
  'وبنك أسئلة. يعمل بدون إنترنت، مجاناً، على أي هاتف أندرويد.';

// Set GOOGLE_SITE_VERIFICATION in the Vercel project (and .env.local) to the
// token from the Search Console "HTML tag" method. Conditionally spread rather
// than passed as undefined so no empty <meta> is emitted before it is set.
const GSC_TOKEN = process.env.GOOGLE_SITE_VERIFICATION;

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:  SEARCH_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,

  ...(GSC_TOKEN && { verification: { google: GSC_TOKEN } }),

  // Kept for completeness, but do not mistake this for the keyword strategy:
  // Google dropped meta keywords as a ranking signal in 2009 and Bing treats a
  // stuffed one as a spam signal. What the site actually ranks for is decided by
  // the <title>, the h1 and the body copy — see SEARCH_TITLE above and the h1 in
  // components/landing/Hero.jsx.
  keywords: [
    'الشهادة السودانية',
    'منهج الشهادة السودانية',
    'مراجعة الشهادة السودانية',
    'تطبيق تعليمي سوداني',
    'بشير',
    'نفير',
  ],

  openGraph: {
    type:        'website',
    title:       SOCIAL_TITLE,
    description: DESCRIPTION,
    url:         SITE_URL,
    siteName:    SITE_NAME,
    locale:      LOCALE,
    images:      [OG_IMAGE],
  },

  twitter: {
    card:        'summary_large_image',
    title:       SOCIAL_TITLE,
    description: DESCRIPTION,
    images:      [OG_IMAGE],
  },

  icons: {
    icon:  '/logo.png',
    apple: '/logo.png',
  },

  // No index/follow here: that is already the default, and an explicit tag on
  // the root layout cascaded into the 404 boundary and contradicted the noindex
  // Next emits there. These directives only widen how results may be displayed.
  robots: {
    googleBot: {
      // Lets Google use a full-size image in results instead of a thumbnail.
      'max-image-preview': 'large',
      'max-snippet':       -1,
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    // data-theme is owned entirely by the pre-paint script below. Hard-coding
    // it here contradicted that script and produced a React hydration mismatch
    // on every load in light mode; suppressHydrationWarning is the documented
    // pattern for an attribute that is legitimately set before React boots.
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Icons come from `metadata.icons` above — declaring them here too
            emitted every <link rel="icon"> twice. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Runs before first paint — avoids theme flash. Normalises anything
            unexpected in storage to 'dark' so the attribute is always exactly
            'dark' or 'light'. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('nafeer-theme');t=(t==='light')?'light':'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
      </head>
      <body className="font-arabic antialiased">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
