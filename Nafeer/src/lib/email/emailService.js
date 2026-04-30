/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single entry point for all email sending in the CMS.
 *
 * Usage:
 *   import { sendEmail } from '@/lib/email/emailService';
 *
 *   const result = await sendEmail({
 *     to:       'user@example.com',
 *     subject:  'Optional override',        // overrides template subject
 *     template: 'magic_link',
 *     data:     { name: 'Ahmed', link: 'https://...' },
 *     replyTo:  'support@nafeer.app',       // optional
 *   });
 *
 * Returns:
 *   { ok: true,  id: '<resend-message-id>' }
 *   { ok: false, error: '<message>' }
 *
 * Future-proofing:
 *   - Swap provider: replace the `_sendViaResend` function below.
 *   - Automation: import `sendEmail` directly in any server-side trigger.
 *   - Batch: wrap multiple `sendEmail` calls in a queue/job system.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { renderTemplate, TEMPLATE_KEYS } from './templates/index';
import { logEmail }                       from './EmailLogger';

const RESEND_API_URL = 'https://api.resend.com/emails';

// Sender identity — override via env
const DEFAULT_FROM    = process.env.EMAIL_FROM    || 'نفير <no-reply@nafeer.app>';
const DEFAULT_REPLY_TO = process.env.EMAIL_REPLY_TO || undefined;

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────

/**
 * @typedef {'magic_link' | 'onboarding_invite' | 'beta_invite' | 'custom_message'} EmailTemplateType
 */

/**
 * @typedef {Object} SendEmailOptions
 * @property {string}            to
 * @property {EmailTemplateType} template
 * @property {Record<string,any>} data
 * @property {string}            [subject]   - overrides the template default
 * @property {string}            [replyTo]
 * @property {string}            [from]
 */

/**
 * @typedef {Object} SendEmailResult
 * @property {boolean} ok
 * @property {string}  [id]
 * @property {string}  [error]
 */

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send an email using a named template.
 *
 * @param {SendEmailOptions} options
 * @returns {Promise<SendEmailResult>}
 */
export async function sendEmail({ to, template, data = {}, subject, replyTo, from }) {
  // ── 1. Validate ────────────────────────────────────────────────────────────
  if (!to)       return { ok: false, error: 'Recipient email is required.' };
  if (!template) return { ok: false, error: 'Template name is required.'   };

  if (!TEMPLATE_KEYS.includes(template)) {
    return { ok: false, error: `Unknown template: "${template}". Valid: ${TEMPLATE_KEYS.join(', ')}` };
  }

  // ── 2. Render ──────────────────────────────────────────────────────────────
  let rendered;
  try {
    rendered = renderTemplate(template, data);
  } catch (err) {
    return { ok: false, error: `Template render error: ${err.message}` };
  }

  const finalSubject = subject || rendered.subject;
  const finalFrom    = from    || DEFAULT_FROM;
  const finalReplyTo = replyTo || DEFAULT_REPLY_TO;

  // ── 3. Send ────────────────────────────────────────────────────────────────
  let result;
  try {
    result = await _sendViaResend({
      to,
      from:    finalFrom,
      replyTo: finalReplyTo,
      subject: finalSubject,
      html:    rendered.html,
    });
  } catch (err) {
    const error = `Provider error: ${err.message}`;
    await logEmail({ to, subject: finalSubject, template, status: 'failed', error });
    return { ok: false, error };
  }

  // ── 4. Log ─────────────────────────────────────────────────────────────────
  await logEmail({
    to,
    subject:  finalSubject,
    template,
    status:   result.ok ? 'sent' : 'failed',
    error:    result.ok ? undefined : result.error,
    providerId: result.id,
  });

  return result;
}

// ─── Provider: Resend ─────────────────────────────────────────────────────────
// Replace this function to swap providers (Postmark, SendGrid, SES, etc.).

/**
 * @param {{ to: string; from: string; replyTo?: string; subject: string; html: string }} payload
 * @returns {Promise<SendEmailResult>}
 */
async function _sendViaResend({ to, from, replyTo, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set.');
  }

  const body = { from, to, subject, html };
  if (replyTo) body.reply_to = replyTo;

  const response = await fetch(RESEND_API_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = json?.message || json?.error || `HTTP ${response.status}`;
    return { ok: false, error: `Resend: ${message}` };
  }

  return { ok: true, id: json.id };
}