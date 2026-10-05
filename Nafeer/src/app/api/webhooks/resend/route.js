import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { connectDB } from '@/lib/db';
import { EmailLog }  from '@/lib/models/EmailLog';

// ─── POST /api/webhooks/resend ────────────────────────────────────────────────
// Receives delivery events from Resend and records them on the matching
// email_logs row (matched by providerId = Resend's email id).
//
// Setup: Resend dashboard → Webhooks → add this URL, subscribe to
// email.delivered / delivery_delayed / bounced / complained / failed, and put
// the signing secret (whsec_…) in RESEND_WEBHOOK_SECRET.
//
// Resend signs with Svix: HMAC-SHA256 over `${id}.${timestamp}.${rawBody}`
// keyed with the base64 part of the secret.

const EVENT_DELIVERY = {
  'email.delivered':        'delivered',
  'email.delivery_delayed': 'delayed',
  'email.bounced':          'bounced',
  'email.complained':       'complained',
  'email.failed':           'failed',
};

// Events can arrive out of order — a state only ever replaces a weaker one.
const RANK = { delayed: 1, delivered: 2, failed: 3, bounced: 3, complained: 4 };

const TOLERANCE_SECONDS = 5 * 60;

function verifySignature(rawBody, headers, secret) {
  const id        = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const signature = headers.get('svix-signature');
  if (!id || !timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const key      = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest();

  // Header holds one or more space-separated "v1,<base64>" entries.
  return signature.split(' ').some((entry) => {
    const [version, value] = entry.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

function describe(type, data) {
  if (type === 'email.bounced') return data?.bounce?.message || data?.bounce?.type || null;
  if (type === 'email.failed')  return data?.failed?.reason || null;
  return null;
}

export async function POST(request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'Webhook secret not configured.' }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers, secret)) {
    return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Anything we don't track is acknowledged so Resend doesn't keep retrying it.
  const delivery = EVENT_DELIVERY[event?.type];
  const emailId  = event?.data?.email_id;
  if (!delivery || !emailId) return NextResponse.json({ ok: true, ignored: true });

  const weaker = Object.keys(RANK).filter((state) => RANK[state] < RANK[delivery]);

  await connectDB();
  const result = await EmailLog.updateOne(
    { providerId: emailId, delivery: { $in: [null, ...weaker] } },
    {
      $set: {
        delivery,
        deliveryDetail:    describe(event.type, event.data),
        deliveryUpdatedAt: event.created_at ? new Date(event.created_at) : new Date(),
      },
    }
  );

  return NextResponse.json({ ok: true, updated: result.modifiedCount === 1 });
}
