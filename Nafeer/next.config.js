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

const nextConfig = {
  serverExternalPackages: ['mongoose'],

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
