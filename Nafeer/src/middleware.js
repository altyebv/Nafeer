import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-this-in-production'
);

async function verify(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ── Contributor routes ──────────────────────────────
  const contributorToken = request.cookies.get('nafeer_token')?.value;
  const contributorUser = contributorToken ? await verify(contributorToken) : null;

  if (pathname.startsWith('/editor') && !contributorUser) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if ((pathname === '/signin' || pathname === '/join') && contributorUser) {
    return NextResponse.redirect(new URL('/editor', request.url));
  }

  // ── Admin routes ────────────────────────────────────
  const adminToken = request.cookies.get('nafeer_admin')?.value;
  const adminUser = adminToken ? await verify(adminToken) : null;
  const isValidAdmin = adminUser?.role === 'admin';

  if (pathname.startsWith('/admin/dashboard') && !isValidAdmin) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (pathname === '/admin/login' && isValidAdmin) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Redirect bare /admin to login or dashboard
  if (pathname === '/admin') {
    return NextResponse.redirect(
      new URL(isValidAdmin ? '/admin/dashboard' : '/admin/login', request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/editor/:path*', '/signin', '/join', '/admin', '/admin/:path*'],
};
