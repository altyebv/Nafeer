import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-this-in-production'
);

export async function verifyAdminToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nafeer_admin')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

// Returns a normalised user-shaped object for admin sessions,
// compatible with the shape getCurrentUser() returns for contributors.
// Use this in API routes that accept both contributor and admin callers.
export async function getAdminAsUser() {
  const admin = await verifyAdminToken();
  if (!admin) return null;
  return {
    id:      'admin',
    role:    'admin',
    subject: null,
    email:   admin.username || 'admin',
  };
}