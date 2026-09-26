import './globals.css';
import { SITE_URL, SITE_NAME, LOCALE, OG_IMAGE } from '@/lib/seo';

// ── Site-wide metadata ────────────────────────────────────────────────────────
//
// The landing page speaks to students and parents, not contributors, so the
// default title and description sell بشير — the app — rather than نفير, the
// platform that builds it. Contributor-facing copy lives on /prejoin.
//
// metadataBase is what turns the file-based opengraph-image into an absolute
// URL. Without it Next emits a relative og:image and every social scraper
// silently drops the card.

const TITLE = 'بشير — رفيق الشهادة السودانية';
const DESCRIPTION =
  'بشير يشرح منهج الشهادة السودانية بلغة واضحة — دروس مبسطة، بطاقات مراجعة، ' +
  'وبنك أسئلة. يعمل بدون إنترنت، مجاناً، على أي هاتف أندرويد.';

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:  TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,


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
    title:       TITLE,
    description: DESCRIPTION,
    url:         SITE_URL,
    siteName:    SITE_NAME,
    locale:      LOCALE,
    images:      [OG_IMAGE],
  },

  twitter: {
    card:        'summary_large_image',
    title:       TITLE,
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
    <html lang="ar" dir="rtl" data-theme="dark">
      <head>
        {/* Icons come from `metadata.icons` above — declaring them here too
            emitted every <link rel="icon"> twice. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Runs before first paint — avoids theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('nafeer-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-arabic antialiased">
        {children}
      </body>
    </html>
  );
}
