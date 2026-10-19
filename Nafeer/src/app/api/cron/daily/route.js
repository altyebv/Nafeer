import { connectDB }      from '@/lib/db';
import { AuditEvent }     from '@/lib/models/AuditEvent';
import { Admin }          from '@/lib/models/Admin';
import { applyDueDecisions } from '@/lib/applicants';
import { buildDigest }    from '@/lib/digest';
import { sendEmail }      from '@/lib/email/emailService';

// ─── GET /api/cron/daily (vercel.json crons) ──────────────────────────────────
// Once a day — the most Vercel's free plan allows:
//   1. applies any lead decision whose undo window passed and that no request
//      has swept since (lib/applicants.js)
//   2. emails the owner a digest of what leads did in the last 24 hours, if
//      they did anything (lib/digest.js)
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

  const events = await AuditEvent.find({ actorKind: 'lead', at: { $gte: new Date(now - DAY_MS) } })
    .sort({ at: 1 }).limit(500).lean();
  const digest = buildDigest(events, now);

  let sent = 0;
  if (digest) {
    const owners = await Admin.find({ isActive: true, email: { $not: /@nafeer\.local$/i } }).select('email username').lean();
    for (const o of owners) {
      const r = await sendEmail({
        to: o.email,
        template: 'custom_message',
        data: { name: o.username, subject: digest.subject, message: digest.message },
      });
      if (r.ok) sent++;
    }
  }

  return Response.json({ ok: true, applied: applied.length, events: events.length, digestsSent: sent });
}
