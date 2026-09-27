import { NextResponse } from 'next/server';
import { signToken, setAuthCookie, buildTokenPayload } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

// ─── Dev-only route — disabled in production ─────────────────────────────────
// Visit http://localhost:3000/api/dev/autologin to instantly get a contributor
// session cookie and land on the editor. Safe: only works when NODE_ENV=development.
//
// This used to sign a token for a fabricated contributor with `id:
// 'dev_contributor'`. That string is not a valid ObjectId, so every route that
// fed session.id back into Mongoose threw a CastError and returned 500 —
// /api/contributors/announcement and /api/contributors/activity among them,
// which is why the editor dashboard's announcements and heatmap were always
// empty locally. The fix is to back the dev session with a real Contributor
// document so the whole app exercises its real code paths.
//
// The upsert is keyed on DEV_EMAIL and is idempotent: repeated visits reuse the
// same row rather than accumulating fixtures.

const DEV_EMAIL = 'dev@nafeer.local';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    await connectDB();

    const contributor = await Contributor.findOneAndUpdate(
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

    const token = await signToken(buildTokenPayload(contributor));
    await setAuthCookie(token);

    // Deliberately not NEXT_PUBLIC_APP_URL — that points at the deployed site,
    // which would bounce a local dev session off to production.
    return NextResponse.redirect(new URL('/editor', 'http://localhost:3000'));
  } catch (err) {
    console.error('[GET /api/dev/autologin]', err);
    return NextResponse.json({ error: 'Dev autologin failed', detail: String(err?.message || err) }, { status: 500 });
  }
}
