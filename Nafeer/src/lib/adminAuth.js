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
