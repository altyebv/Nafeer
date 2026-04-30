/**
 * emailLogger.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight persistence layer for email send events.
 * Writes to the `email_logs` collection in MongoDB.
 * Failures are intentionally non-fatal — a logging error never blocks delivery.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { connectDB }  from '@/lib/db';
import { EmailLog }   from '@/lib/models/EmailLog';

/**
 * @param {{
 *   to:         string;
 *   subject:    string;
 *   template:   string;
 *   status:     'sent' | 'failed';
 *   error?:     string;
 *   providerId?: string;
 * }} entry
 */
export async function logEmail(entry) {
  try {
    await connectDB();
    await EmailLog.create({
      to:         entry.to,
      subject:    entry.subject,
      template:   entry.template,
      status:     entry.status,
      error:      entry.error    || null,
      providerId: entry.providerId || null,
      timestamp:  new Date(),
    });
  } catch (err) {
    // Never let a logging failure bubble up and block email delivery.
    console.error('[emailLogger] Failed to write log entry:', err.message);
  }
}