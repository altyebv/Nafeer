import { NextResponse }    from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/lib/FirebaseAdmin';

/**
 * GET /api/admin/android/feedback?type=BUG_REPORT|SUGGESTION&limit=100
 *
 * Returns feedback submissions from the `feedback` collection group.
 *
 * Each Android device writes to:
 *   feedback/{installId}/{submissionId}
 *
 * Fields per doc:
 *   type ("BUG_REPORT" | "SUGGESTION"), body, tags[], screenName,
 *   appVersion, androidVersion, deviceModel, createdAt (epoch ms), installId
 *
 * Ordered by createdAt descending (newest first).
 */
export async function GET(req) {
  const auth = await verifyAdminAuth();
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const type  = searchParams.get('type');   // optional filter
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 300);

  try {
    const db = getAdminFirestore();

    let query = db
      .collectionGroup('feedback')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (type === 'BUG_REPORT' || type === 'SUGGESTION') {
      query = query.where('type', '==', type);
    }

    const snap = await query.get();

    const items = snap.docs.map((d) => ({
      id:   d.id,
      path: d.ref.path,
      ...d.data(),
    }));

    // Tag frequency breakdown
    const tagCounts = {};
    items.forEach(({ tags }) => {
      if (!Array.isArray(tags)) return;
      tags.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; });
    });

    // Screen frequency (top 10) — helps see where bugs cluster
    const screenCounts = {};
    items.forEach(({ screenName }) => {
      if (!screenName) return;
      screenCounts[screenName] = (screenCounts[screenName] ?? 0) + 1;
    });

    const topScreens = Object.entries(screenCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([screen, count]) => ({ screen, count }));

    // App version breakdown (for triage)
    const versionCounts = {};
    items.forEach(({ appVersion }) => {
      if (!appVersion) return;
      versionCounts[appVersion] = (versionCounts[appVersion] ?? 0) + 1;
    });

    return NextResponse.json({
      total: items.length,
      items,
      tagCounts,
      topScreens,
      versionCounts,
    });
  } catch (e) {
    console.error('[android/feedback GET]', e);
    if (e.code === 5 || e.message?.includes('NOT_FOUND')) {
      return NextResponse.json({
        total: 0, items: [], tagCounts: {}, topScreens: [], versionCounts: {},
      });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}