import { SITE_URL } from './seo';

// Absolute URL for links the app hands out — onboarding / interview links and
// anything else that ends up in an email.
//
// Unlike SITE_URL (always the canonical host, see seo.js), this follows
// NEXT_PUBLIC_APP_URL so a link issued from a preview deploy resolves on that
// same deploy. With the variable unset it falls back to the canonical site.
export function appUrl(path = '/') {
  const base   = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
