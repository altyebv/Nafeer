import { NextResponse }    from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { connectDB }       from '@/lib/db';
import { Announcement }    from '@/lib/models/announcement';
import { EmailLog }        from '@/lib/models/EmailLog';
import { getAdminFirestore, getManifest } from '@/lib/FirebaseAdmin';

const LIMIT = 20;

// ─── GET /api/admin/comms/history ─────────────────────────────────────────────
// Everything that was sent, every channel, newest first — plus the app's
// switches, so the comms screen loads in one request.
//
// The app side (comm_items, manifest flags) lives in Firestore. When Firebase
// is not configured it comes back as `app: null` instead of failing the page.
export async function GET() {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    await connectDB();
    const [board, mail, mailTotals, app] = await Promise.all([
      Announcement.find({}, 'title type pinned targetSubjects targetTeamIds targetContributorIds createdAt')
        .sort({ createdAt: -1 }).limit(LIMIT).lean(),
      // Free-form messages only; the pipeline's automatic mails live with the person.
      EmailLog.aggregate([
        { $match: { template: 'custom_message' } },
        { $group: { _id: '$subject', sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }, at: { $max: '$timestamp' } } },
        { $sort: { at: -1 } },
        { $limit: LIMIT },
      ]),
      EmailLog.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      readApp(),
    ]);

    const items = [
      ...board.map((a) => ({
        channel: 'board',
        id: String(a._id),
        title: a.title,
        audience: a.targetContributorIds?.length ? { kind: 'people', n: a.targetContributorIds.length }
          : a.targetTeamIds?.length ? { kind: 'teams', n: a.targetTeamIds.length }
          : a.targetSubjects?.length ? { kind: 'subjects', ids: a.targetSubjects }
          : { kind: 'all' },
        at: a.createdAt,
      })),
      ...mail.map((m) => ({ channel: 'mail', id: `mail:${m._id}:${new Date(m.at).toISOString()}`, title: m._id, sent: m.sent, failed: m.failed, at: m.at })),
      ...(app?.announcements || []).map((c) => ({ channel: 'app', id: c.id, title: c.title, banner: !!c.showBanner, at: c.publishedAt })),
    ].sort((a, b) => new Date(b.at) - new Date(a.at));

    return NextResponse.json({
      ok: true,
      data: {
        items,
        mail: Object.fromEntries(mailTotals.map((r) => [r._id, r.n])),
        app: app ? { flags: app.flags } : null,
      },
    });
  } catch (e) {
    console.error('[GET /api/admin/comms/history]', e);
    return NextResponse.json({ ok: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}

async function readApp() {
  try {
    // Throws at once when Firebase is not configured — before getManifest()
    // starts, so no promise is left to reject unhandled.
    const db = getAdminFirestore();
    const [manifest, snap] = await Promise.all([
      getManifest(),
      db.collection('comm_items').where('type', '==', 'ANNOUNCEMENT')
        .orderBy('publishedAt', 'desc').limit(LIMIT).get(),
    ]);
    return {
      flags: manifest?.featureFlags || {},
      announcements: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
  } catch {
    return null;
  }
}
