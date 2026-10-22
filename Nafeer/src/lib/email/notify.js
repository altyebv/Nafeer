// ─── notify.js ────────────────────────────────────────────────────────────────
// The platform's own mail to the people who run it: release and appeal alerts,
// the daily digest, the leads' digests. They go out under the `notice`
// template, so the log and the comms history never mistake them for a message
// an admin wrote.
//
// Everything still passes through sendEmail (emailService.js) — the one place
// that renders, sends and logs.

import { connectDB } from '@/lib/db';
import { Admin }     from '@/lib/models/Admin';
import { sendEmail } from './emailService';

// Placeholder admin accounts (seeded locally) have no real mailbox.
const REAL_ADMIN = { isActive: true, email: { $not: /@nafeer\.local$/i } };

/**
 * One notice to one person.
 * @param {{ to: string; name?: string; subject: string; message: string }} n
 */
export function sendNotice({ to, name, subject, message }) {
  return sendEmail({ to, template: 'notice', data: { name, subject, message } });
}

/**
 * The same notice to every active owner. Never throws; resolves to how many
 * went out.
 * @param {string} subject
 * @param {string} message
 */
export async function emailOwners(subject, message) {
  try {
    await connectDB();
    const owners = await Admin.find(REAL_ADMIN).select('email username').lean();
    const results = await Promise.all(owners.map((o) => sendNotice({ to: o.email, name: o.username, subject, message })));
    return results.filter((r) => r.ok).length;
  } catch (e) {
    console.warn('[owner notice failed]', e.message);
    return 0;
  }
}
