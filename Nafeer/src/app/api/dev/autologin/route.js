import { NextResponse } from 'next/server';
import { signToken, setAuthCookie } from '@/lib/auth';

// ─── Dev-only route — disabled in production ─────────────────────────────────
// Visit http://localhost:3000/api/dev/autologin to instantly get a contributor
// session cookie and land on the editor. Safe: only works when NODE_ENV=development.

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const mockContributor = {
    id:      'dev_contributor',
    name:    'مساهم تجريبي',
    email:   'dev@nafeer.local',
    subject: 'GEOGRAPHY',   // must match a key in SUBJECTS_CATALOG
    password: 'devpassword', // not actually used, but required by schema
    role:    'contributor',
    status:  'approved',
  };

  const token = await signToken(mockContributor);
  await setAuthCookie(token);

  return NextResponse.redirect(new URL('/editor', 'http://localhost:3000'));
}