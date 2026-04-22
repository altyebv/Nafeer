import { NextResponse }                    from 'next/server';
import { verifyAdminAuth }                from '@/lib/adminAuth';
import { getManifest, updateFeatureFlags } from '@/lib/FirebaseAdmin';

// ─── Allowed flag keys ────────────────────────────────────────────────────────
// Add new flag keys here as the feature set grows. Unknown keys are rejected
// to prevent typos silently writing garbage to Firestore.
const ALLOWED_KEYS = [
  'feedEnabled',
  'examModeEnabled',
  'hotspotEnabled',        // HOTSPOT question type — off by default until QA'd
  'announcementBanner',    // Arabic string or null
  'visibleSubjectIds',     // [] = all visible; ['PHYSICS', 'CHEMISTRY'] = soft-launch
];

const DEFAULT_FLAGS = {
  feedEnabled:        true,
  examModeEnabled:    true,
  hotspotEnabled:     false,
  announcementBanner: null,
  visibleSubjectIds:  [],
};

// GET /api/content/flags
// Returns current feature flags from Firestore manifest.
export async function GET() {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    const manifest    = await getManifest().catch(() => null);
    const featureFlags = manifest?.featureFlags || DEFAULT_FLAGS;
    return NextResponse.json({ ok: true, featureFlags });
  } catch (e) {
    console.error('[GET /api/content/flags]', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// POST /api/content/flags
// Body: partial featureFlags object — only provided keys are updated (merge).
// Example: { "hotspotEnabled": true, "announcementBanner": "رسالة ترحيبية" }
export async function POST(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  let updates;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // Reject unknown keys
  const unknown = Object.keys(updates).filter((k) => !ALLOWED_KEYS.includes(k));
  if (unknown.length > 0) {
    return NextResponse.json(
      { ok: false, error: `مفاتيح غير معروفة: ${unknown.join(', ')}` },
      { status: 400 }
    );
  }

  // Type-check known keys
  if ('feedEnabled'       in updates && typeof updates.feedEnabled       !== 'boolean') return typErr('feedEnabled');
  if ('examModeEnabled'   in updates && typeof updates.examModeEnabled   !== 'boolean') return typErr('examModeEnabled');
  if ('hotspotEnabled'    in updates && typeof updates.hotspotEnabled    !== 'boolean') return typErr('hotspotEnabled');
  if ('visibleSubjectIds' in updates && !Array.isArray(updates.visibleSubjectIds))      return typErr('visibleSubjectIds');
  if ('announcementBanner' in updates) {
    const v = updates.announcementBanner;
    if (v !== null && typeof v !== 'string') return typErr('announcementBanner');
  }

  try {
    // Merge with existing flags so a partial POST doesn't reset unmentioned keys
    const manifest       = await getManifest().catch(() => null);
    const existingFlags  = manifest?.featureFlags || DEFAULT_FLAGS;
    const mergedFlags    = { ...existingFlags, ...updates };

    await updateFeatureFlags(mergedFlags);

    return NextResponse.json({ ok: true, featureFlags: mergedFlags });
  } catch (e) {
    console.error('[POST /api/content/flags]', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

const typErr = (key) =>
  NextResponse.json({ ok: false, error: `نوع بيانات خاطئ للمفتاح: ${key}` }, { status: 400 });