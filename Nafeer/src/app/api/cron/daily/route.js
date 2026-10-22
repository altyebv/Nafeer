import { connectDB }      from '@/lib/db';
import { AuditEvent }     from '@/lib/models/AuditEvent';
import { applyDueDecisions } from '@/lib/applicants';
import { applyDueReleases } from '@/lib/releases';
import { sendLeadDigests } from '@/lib/leadDigest';
import { buildDigest }    from '@/lib/digest';
import { emailOwners }    from '@/lib/email/notify';

// ─── GET /api/cron/daily (vercel.json crons) ──────────────────────────────────
// Once a day — the most Vercel's free plan allows:
//   1. applies any lead decision whose undo window passed and that no request
//      has swept since (lib/applicants.js)
//   2. publishes leads' releases whose hold passed unnoticed (lib/releases.js)
//   3. emails the owner a digest of what leads did in the last 24 hours, if
//      they did anything (lib/digest.js)
//   4. emails each lead with something waiting a short digest (lib/leadDigest.js)
//
// Vercel calls it with `Authorization: Bearer $CRON_SECRET`. Without the
// secret configured, it refuses to run rather than run for anyone.

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ ok: false, error: 'CRON_SECRET is not set' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  await connectDB();
  const applied = await applyDueDecisions(now, 200);
  const released = await applyDueReleases(now, 10);

  const events = await AuditEvent.find({ actorKind: 'lead', at: { $gte: new Date(now - DAY_MS) } })
    .sort({ at: 1 }).limit(500).lean();
  const digest = buildDigest(events, now);

  const sent = digest ? await emailOwners(digest.subject, digest.message) : 0;

  const leadDigests = await sendLeadDigests(now).catch((e) => { console.warn('[lead digest]', e.message); return 0; });

  return Response.json({ ok: true, applied: applied.length, released: released.length, events: events.length, digestsSent: sent, leadDigests });
}
