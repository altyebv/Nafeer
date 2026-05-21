import { NextResponse }                    from 'next/server';
import { verifyAdminAuth }                 from '@/lib/adminAuth';
import { getManifest, updateFeatureFlags } from '@/lib/FirebaseAdmin';

// ── Comms-owned flags ─────────────────────────────────────────────────────────
// Only the keys this route is allowed to read / write.
// All other manifest flags (feedEnabled, examModeEnabled, …) are untouched.
const COMMS_FLAG_KEYS = [
  'commCenterEnabled',
  'feedbackEnabled',
  'toursEnabled',
];

// ── GET /api/admin/comms/feature-flags ────────────────────────────────────────
export async function GET() {
  const auth = await verifyAdminAuth();
  if (auth) return auth;

  try {
    const manifest = await getManifest();
    const flags    = manifest?.featureFlags ?? {};

    // Return only the comms slice; fall back to safe defaults so the UI
    // always gets a well-shaped object even before the manifest is published.
    const commsFlags = {
      commCenterEnabled: flags.commCenterEnabled ?? false,
      feedbackEnabled:   flags.feedbackEnabled   ?? false,
      toursEnabled:      flags.toursEnabled       ?? false,
    };

    return NextResponse.json({ flags: commsFlags });
  } catch (e) {
    console.error('[comms/feature-flags GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── PATCH /api/admin/comms/feature-flags ──────────────────────────────────────
export async function PATCH(req) {
  const auth = await verifyAdminAuth();
  if (auth) return auth;

  try {
    const body = await req.json();

    // Whitelist: only accept the comms flag keys; ignore everything else.
    const incoming = {};
    for (const key of COMMS_FLAG_KEYS) {
      if (key in body) {
        if (typeof body[key] !== 'boolean') {
          return NextResponse.json(
            { error: `Flag "${key}" must be a boolean` },
            { status: 400 },
          );
        }
        incoming[key] = body[key];
      }
    }

    if (Object.keys(incoming).length === 0) {
      return NextResponse.json(
        { error: 'No valid comms flags provided' },
        { status: 400 },
      );
    }

    // Read current flags first so we don't clobber unrelated flags
    // (updateFeatureFlags does a Firestore merge, but we still want to
    //  return the full updated comms slice to the client).
    const manifest     = await getManifest();
    const existingFlags = manifest?.featureFlags ?? {};

    const merged = { ...existingFlags, ...incoming };
    await updateFeatureFlags(merged);

    const commsFlags = {
      commCenterEnabled: merged.commCenterEnabled ?? false,
      feedbackEnabled:   merged.feedbackEnabled   ?? false,
      toursEnabled:      merged.toursEnabled       ?? false,
    };

    return NextResponse.json({ flags: commsFlags });
  } catch (e) {
    console.error('[comms/feature-flags PATCH]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}