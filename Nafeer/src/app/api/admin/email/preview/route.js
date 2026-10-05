import { NextResponse }     from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { renderTemplate }   from '@/lib/email/templates/index';

// ─── POST /api/admin/email/preview ────────────────────────────────────────────
// Renders a template exactly as it would be sent, without sending it.
// A render failure (missing link, empty message…) is a normal answer here, not
// an HTTP error — the compose form shows it as "fields incomplete".

export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const { subject, html, text } = renderTemplate(body.template, body.data || {});
    return NextResponse.json({ ok: true, subject, html, text });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
