import { SITE_URL, SITE_NAME, absoluteUrl } from '@/lib/seo';

// ── Structured data ───────────────────────────────────────────────────────────
//
// Stable @id values so the nodes form one connected graph instead of three
// unrelated blobs: the app is published by the organisation, the site is about
// the app, and each contributor is a member of the organisation.
//
// Everything asserted here has to be true on the page that carries it —
// structured data that contradicts visible content is a manual-action risk, not
// a ranking trick.

export const ORG_ID  = `${SITE_URL}/#organization`;
export const SITE_ID = `${SITE_URL}/#website`;
export const APP_ID  = `${SITE_URL}/#basheer`;

export function organization() {
  return {
    '@type':        'Organization',
    '@id':          ORG_ID,
    name:           SITE_NAME,
    alternateName:  'Nafeer',
    url:            SITE_URL,
    description:    'مشروع تطوعي مفتوح لبناء محتوى تعليمي لطلاب الشهادة السودانية.',
    logo: {
      '@type':  'ImageObject',
      url:      absoluteUrl('/logo.png'),
      width:    512,
      height:   512,
    },
    areaServed: { '@type': 'Country', name: 'Sudan' },
    // No sameAs: the project has no public social profiles to point at yet.
    // Add them here when it does — it is the main signal tying the brand to
    // its accounts.
  };
}

export function website() {
  return {
    '@type':     'WebSite',
    '@id':       SITE_ID,
    url:         SITE_URL,
    name:        SITE_NAME,
    // WebSite — not Organization — is the node Google reads when deciding the
    // site name it prints above a result. The Latin form belongs here too, or a
    // searcher typing "Nafeer" has nothing to match against: every other signal
    // on the site is Arabic script.
    alternateName: 'Nafeer',
    inLanguage:  'ar',
    publisher:   { '@id': ORG_ID },
    about:       { '@id': APP_ID },
    // No SearchAction: the site has no search endpoint, and declaring one that
    // does not exist is worse than declaring nothing.
  };
}

export function basheerApp() {
  return {
    '@type':              'SoftwareApplication',
    '@id':                APP_ID,
    name:                 'بشير',
    alternateName:        'Basheer',
    applicationCategory:  'EducationalApplication',
    operatingSystem:      'Android',
    inLanguage:           'ar',
    description:
      'تطبيق يشرح منهج الشهادة السودانية — دروس مبسطة، بطاقات مراجعة وبنك أسئلة. ' +
      'يعمل بدون إنترنت.',
    publisher:            { '@id': ORG_ID },
    isAccessibleForFree:  true,
    offers: {
      '@type':        'Offer',
      price:          '0',
      priceCurrency:  'USD',
    },
    audience: {
      '@type':       'EducationalAudience',
      educationalRole: 'student',
    },
    // installUrl / downloadUrl go here once Basheer is on Google Play. Note
    // that Google's app rich result also wants aggregateRating, which needs
    // real reviews — so expect the entity data to help before the rich result
    // ever appears.
  };
}

// Google's dedicated shape for a page about one person. The Person is the
// mainEntity rather than a bare top-level node, which is what tells Google the
// page IS the profile rather than merely mentioning someone.
//
// The breadcrumb is two levels, not three. There is no /contributors index page
// to sit in the middle — the contributor hall is a section of the homepage, and
// pointing a crumb at a fragment would name a URL that isn't its own document.
// Two honest levels replace the bare URL Google shows today with "نفير › اسم".
export function contributorProfilePage({ contributor, description, jobTitle, knowsAbout }) {
  const url = absoluteUrl(`/contributor/${contributor.username}`);

  return {
    '@context':  'https://schema.org',
    '@type':     'ProfilePage',
    url,
    inLanguage:  'ar',
    isPartOf:    { '@id': SITE_ID },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME,        item: SITE_URL },
        // The last crumb carries no `item`: it is the current page, and Google's
        // own guidance is to leave the trailing URL off.
        { '@type': 'ListItem', position: 2, name: contributor.name },
      ],
    },
    mainEntity: {
      '@type':      'Person',
      '@id':        `${url}#person`,
      name:         contributor.name,
      alternateName: contributor.username,
      url,
      description,
      ...(contributor.avatarUrl && { image: contributor.avatarUrl }),
      ...(jobTitle    && { jobTitle }),
      ...(knowsAbout  && { knowsAbout }),
      memberOf:     { '@id': ORG_ID },
    },
  };
}

// The homepage carries the organisation, the site and the app as one graph.
export function homeGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph':   [organization(), website(), basheerApp()],
  };
}
