// ─── Team leads: the permission rules ─────────────────────────────────────────
// A lead is a contributor with extra authority over their own subject
// (docs/team-leads.md). Kept free of the database so the rules can be tested
// on their own; the guard (lib/api/guard.js) applies them per request.
//
// Nothing asks "is this person at least a lead". Every check names one
// permission on one subject, so a lead of Physics is a plain member everywhere
// else, and a lead without `canPublish` cannot publish.

export const LEAD_PERMISSIONS = [
  'canReview',            // approve / return lessons
  'canManageTeam',        // activity, assign, pause, announce, curriculum order
  'canDecideApplicants',  // approve / reject applicants
  'canEditInterview',     // the subject's interview questions
  'canIntervene',         // edit a member's lesson, with a reason
  'canPublish',           // ship the subject's release
];

// What a new lead starts with: the day-to-day work on, the risky parts off
// until the owner turns them on.
export const DEFAULT_LEAD_PERMISSIONS = {
  canReview:           true,
  canManageTeam:       true,
  canDecideApplicants: false,
  canEditInterview:    false,
  canIntervene:        false,
  canPublish:          false,
};

// One lead is the default; the second seat is for a co-lead, so a lead's own
// lessons have someone other than the owner to review them.
export const MAX_LEADS_PER_SUBJECT = 2;

export const isLeadPermission = (perm) => LEAD_PERMISSIONS.includes(perm);

/**
 * The lead record as the guard hands it on: null for a non-lead, otherwise
 * `active` plus every permission as a strict boolean. A missing field falls
 * back to the default, so documents written before a permission existed read
 * the way a new lead would.
 *
 * `subject` is the contributor's current subject. A lead appointed to another
 * subject (the contributor has since been moved) is no lead at all.
 */
export function normaliseLead(lead, subject) {
  if (!lead?.active || !lead.subject || lead.subject !== subject) return null;
  const out = { active: true, subject: lead.subject };
  for (const perm of LEAD_PERMISSIONS) {
    out[perm] = typeof lead[perm] === 'boolean' ? lead[perm] : DEFAULT_LEAD_PERMISSIONS[perm];
  }
  out.awayUntil = lead.awayUntil || null;
  return out;
}

/**
 * Whether `user` (as returned by requireContributor) may use `perm` on
 * `subjectId`. The owner (admin) may do everything everywhere.
 */
export function leadCan(user, perm, subjectId) {
  if (!isLeadPermission(perm)) throw new Error(`Unknown lead permission: ${perm}`);
  if (user?.role === 'admin') return true;
  if (!subjectId || !user?.subject || user.subject !== subjectId) return false;
  return user.lead?.active === true && user.lead.subject === subjectId && user.lead[perm] === true;
}

/**
 * Picks the permission fields out of an admin's request body. Unknown keys and
 * non-boolean values are dropped, so a body can never set `active`, `since` or
 * anything else on the lead record.
 */
export function pickLeadPermissions(body) {
  const out = {};
  for (const perm of LEAD_PERMISSIONS) {
    if (typeof body?.[perm] === 'boolean') out[perm] = body[perm];
  }
  return out;
}

// ─── Pausing a member (L2) ────────────────────────────────────────────────────

export const MAX_PAUSE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Whether a contributor's `paused` record blocks writes at `now`. */
export function isPaused(paused, now = new Date()) {
  if (!paused?.active) return false;
  return !paused.until || new Date(paused.until) > now;
}

/**
 * The `paused` record a lead writes. `days` null or 0 means until lifted;
 * otherwise 1..MAX_PAUSE_DAYS. Throws on anything else.
 */
export function buildPause({ days = null, reason, by }, now = new Date()) {
  if (days != null && days !== 0 && !(Number.isInteger(days) && days >= 1 && days <= MAX_PAUSE_DAYS)) {
    throw new Error(`مدة الإيقاف من 1 إلى ${MAX_PAUSE_DAYS} يوماً، أو حتى الرفع`);
  }
  return {
    active: true,
    until:  days ? new Date(now.getTime() + days * DAY_MS) : null,
    reason,
    byId:   String(by.id),
    byName: by.name || '',
    at:     now,
  };
}

// ─── Away mode and the owner's fallback (L2) ─────────────────────────────────

// A lead with no activity for this long is treated as away.
export const LEAD_INACTIVE_DAYS = 14;
export const MAX_AWAY_DAYS = 60;

/**
 * Whether a lead is around to review: not in away mode, and active within
 * LEAD_INACTIVE_DAYS. `contributor` carries `lead` and `stats.lastActiveAt`.
 */
export function isLeadAvailable(contributor, now = new Date()) {
  const lead = contributor?.lead;
  if (!lead?.active) return false;
  if (lead.awayUntil && new Date(lead.awayUntil) > now) return false;
  const last = contributor.stats?.lastActiveAt;
  if (!last) return true;   // newly appointed, nothing recorded yet
  return now - new Date(last) < LEAD_INACTIVE_DAYS * DAY_MS;
}
