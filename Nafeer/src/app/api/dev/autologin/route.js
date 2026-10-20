import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signToken, setAuthCookie, buildTokenPayload } from '@/lib/auth';
import { connectDB, isDevDatabase } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { devEmail, isDevPersona } from '@/lib/devPersonas';

// ─── Dev-only route — disabled in production ─────────────────────────────────
// Visit http://localhost:3000/api/dev/autologin to get a contributor session
// and land on the editor; add ?as=<username> to be one of the test personas
// of the dev database (src/lib/devPersonas.js, listed at /dev/login).
//
// Only in development, and only on the dev database (MONGODB_DB=…_dev,
// docs/dev-database.md): it used to create its contributor in the live data.
//
// Signing in as a contributor also drops any admin session cookie: the API
// guard treats a request carrying one as the owner's, which used to hide
// exactly what a member or a lead sees.
//
// Without ?as=, the default dev contributor is upserted (keyed on its email)
// so the whole app exercises its real code paths with a real document.

const DEV_EMAIL = 'dev@nafeer.local';

export async function GET(request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  if (!isDevDatabase()) {
    return NextResponse.json(
      { error: 'Dev sign-in works only on the dev database — set MONGODB_DB=nafeer_dev (docs/dev-database.md)' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const as = new URL(request.url).searchParams.get('as');

    let contributor;
    if (as) {
      if (!isDevPersona(as)) return NextResponse.json({ error: `Unknown persona: ${as}` }, { status: 404 });
      contributor = await Contributor.findOneAndUpdate(
        { email: devEmail(as) },
        { $set: { lastSignedInAt: new Date() } },
        { new: true },
      );
      if (!contributor) return NextResponse.json({ error: 'Persona not seeded — run npm run seed:dev' }, { status: 404 });
    } else {
      contributor = await Contributor.findOneAndUpdate(
        { email: DEV_EMAIL },
        {
          $setOnInsert: {
            name:      'مساهم تجريبي',
            email:     DEV_EMAIL,
            username:  'dev_contributor',
            subject:   'GEOGRAPHY',      // must match a key in SUBJECTS_CATALOG
            role:      'contributor',
            status:    'approved',
            onboarded: true,
          },
          $set: { lastSignedInAt: new Date() },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    const token = await signToken(buildTokenPayload(contributor));
    await setAuthCookie(token);
    (await cookies()).delete('nafeer_admin');

    // Deliberately not NEXT_PUBLIC_APP_URL — that points at the deployed site,
    // which would bounce a local dev session off to production.
    return NextResponse.redirect(new URL('/editor', 'http://localhost:3000'));
  } catch (err) {
    console.error('[GET /api/dev/autologin]', err);
    return NextResponse.json({ error: 'Dev autologin failed', detail: String(err?.message || err) }, { status: 500 });
  }
}
