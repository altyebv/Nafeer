import { NextResponse }     from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { renderTemplate, templateDefaults } from '@/lib/email/templates/index';

// ─── POST /api/admin/email/preview ────────────────────────────────────────────
// Renders a template exactly as it would be sent, without sending it.
// A render failure (missing link, empty message…) is a normal answer here, not
// an HTTP error — the compose form shows it as "fields incomplete".
//
// Body: { template, data, subject? }. The answer also carries `defaults` — the
// template's own subject and body text — which the composer's editor starts
// from and can restore (null for a template that can't be edited).

export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const data     = body.data || {};
  const defaults = templateDefaults(body.template, data);
  try {
    const rendered = renderTemplate(body.template, data);
    const subject  = body.subject?.trim() || rendered.subject;
    return NextResponse.json({ ok: true, subject, html: rendered.html, text: rendered.text, defaults });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message, defaults });
  }
}
