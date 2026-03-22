import { jwtVerify, SignJWT } from 'jose';
import { cookies }            from 'next/headers';
import { NextResponse }       from 'next/server';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-this-in-production'
);

const COOKIE_NAME  = 'nafeer_admin';
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

// ─── Issue a JWT for a verified admin ────────────────────────────────────────

export async function issueAdminToken(admin) {
  return new SignJWT({
    role:        'admin',
    id:          admin._id.toString(),
    username:    admin.username,
    displayName: admin.displayName || admin.username,
    email:       admin.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(SECRET);
}

// ─── Set admin cookie ─────────────────────────────────────────────────────────

export async function setAdminCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   COOKIE_MAX_AGE,
    path:     '/',
  });
}

// ─── Verify admin cookie → payload | null ─────────────────────────────────────

export async function verifyAdminToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

// ─── Guard helper — returns 401 response if not admin, null if OK ─────────────
// Usage: const authErr = await verifyAdminAuth(request); if (authErr) return authErr;

export async function verifyAdminAuth() {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return null;
}

// ─── Compatibility shim — admin presented as a user-shaped object ─────────────

export async function getAdminAsUser() {
  const admin = await verifyAdminToken();
  if (!admin) return null;
  return {
    id:      admin.id || 'admin',
    role:    'admin',
    subject: null,
    email:   admin.email || admin.username,
  };
}
