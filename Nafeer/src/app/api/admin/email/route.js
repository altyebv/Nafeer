import { NextResponse }      from 'next/server';
import { verifyAdminToken }  from '@/lib/adminAuth';
import { sendEmail }         from '@/lib/email/emailService';
import { TEMPLATE_KEYS }     from '@/lib/email/templates/index';

// ─── GET /api/admin/email — return template metadata for the UI ───────────────

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({ ok: true, templates: TEMPLATE_KEYS });
}

// ─── POST /api/admin/email — send an email ────────────────────────────────────

export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { to, template, data = {}, subject, replyTo } = body;

  // Basic validation — emailService validates further
  if (!to || !template) {
    return NextResponse.json(
      { ok: false, error: 'Missing required fields: to, template.' },
      { status: 400 }
    );
  }

  const result = await sendEmail({ to, template, data, subject, replyTo });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: result.id });
}