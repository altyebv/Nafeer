/** @type {import('next').NextConfig} */

// Contributor avatars live in Supabase Storage, so next/image needs that host
// on the allowlist before it will optimize them. Derived from the environment
// rather than hardcoded so a different Supabase project doesn't silently break
// every avatar on the site; the literal is the fallback for the case where the
// variable is missing at build time.
const SUPABASE_FALLBACK_HOST = 'lezzifgnpiaklbvkerzv.supabase.co';

function supabaseHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  } catch {
    return SUPABASE_FALLBACK_HOST;
  }
}

// ── Security headers ──────────────────────────────────────────────────────────
// script-src keeps 'unsafe-inline': Next inlines its own RSC payload and
// bootstrap scripts, plus the pre-paint theme script in app/layout.jsx, and
// the nonce alternative would force every page to render dynamically. The
// policy still pins where scripts, connections, forms and the <base> may point,
// and blocks plugins and framing. JSON-LD blocks are data, not script, so CSP
// leaves them alone. Dev adds 'unsafe-eval' for React Refresh.
//
// img-src allows any https source because lesson IMAGE blocks and the email
// preview carry arbitrary image URLs; style-src needs 'unsafe-inline' for
// KaTeX output and GSAP's inline styles.
const isDev = process.env.NODE_ENV !== 'production';

function contentSecurityPolicy() {
  const supabase = `https://${supabaseHost()}`;
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${supabase}`,
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-Frame-Options',         value: 'DENY' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000' }]),
];

const nextConfig = {
  serverExternalPackages: ['mongoose'],

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHost(),
        // Public bucket only. Without this the optimizer would happily proxy
        // any path on the host.
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Avatars are the only remote images, and they are never rendered larger
    // than ~96px. Trimming the default device list keeps Vercel's per-image
    // transformation count down — it bills per source image per size.
    imageSizes: [32, 48, 64, 96, 128, 192],
  },
};

module.exports = nextConfig;
