import { NextResponse, after } from 'next/server';
import { connectDB }         from '@/lib/db';
import { verifyAdminToken }  from '@/lib/adminAuth';
import { Contributor }       from '@/lib/models/Contributor';
import {
  DEFAULT_LEAD_PERMISSIONS, LEAD_PERMISSIONS, MAX_LEADS_PER_SUBJECT,
  normaliseLead, pickLeadPermissions,
} from '@/lib/leads';
import { AuditError, recordAudit, validateAudit } from '@/lib/audit';

// ─── /api/admin/leads ─────────────────────────────────────────────────────────
// The owner appoints, adjusts and removes team leads (docs/team-leads.md).
// A lead leads the subject on their own record; at most MAX_LEADS_PER_SUBJECT
// active leads per subject. Every change goes to the audit log.
//
//   GET                                   → every active lead
//   POST   { contributorId, ...perms }    → appoint (perms default per lib/leads.js)
//   PATCH  { contributorId, ...perms }    → change permissions
//   DELETE { contributorId, reason }      → remove; credits and history stay

const LEAD_FIELDS = 'name username avatarUrl subject status lead';

const fail = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

const actorOf = (admin) => ({
  id:   admin.id || 'admin',
  name: admin.displayName || admin.username || 'المالك',
  kind: 'admin',
});

// A lead is current only while they are still in the subject they were
// appointed to (lib/leads.js normaliseLead).
const isCurrentLead = (c) => normaliseLead(c?.lead, c?.subject) !== null;

const permsOf = (c) => {
  const n = normaliseLead(c?.lead, c?.subject);
  return n ? Object.fromEntries(LEAD_PERMISSIONS.map((p) => [p, n[p]])) : null;
};

const shape = (c) => ({
  _id:       c._id,
  name:      c.name,
  username:  c.username,
  avatarUrl: c.avatarUrl,
  subject:   c.subject,
  since:     c.lead?.since || null,
  permissions: permsOf(c),
});

async function readBody(request) {
  try { return await request.json(); } catch { return {}; }
}

async function findContributor(contributorId) {
  if (typeof contributorId !== 'string' || !/^[a-f\d]{24}$/i.test(contributorId)) return null;
  return Contributor.findById(contributorId).select(LEAD_FIELDS).lean();
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return fail('Unauthorized', 401);

  await connectDB();
  const leads = await Contributor.find({ 'lead.active': true })
    .select(LEAD_FIELDS).sort({ subject: 1, 'lead.since': 1 }).lean();

  return NextResponse.json({
    ok: true,
    maxPerSubject: MAX_LEADS_PER_SUBJECT,
    leads: leads.filter(isCurrentLead).map(shape),
  });
}

// ─── POST: appoint ────────────────────────────────────────────────────────────
export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return fail('Unauthorized', 401);

  const body = await readBody(request);
  await connectDB();

  const c = await findContributor(body.contributorId);
  if (!c) return fail('المساهم غير موجود', 404);
  if (c.status !== 'approved') return fail('يجب أن يكون المساهم معتمداً أولاً');
  if (!c.subject) return fail('المساهم غير مرتبط بمادة');
  if (isCurrentLead(c)) return fail('المساهم قائد فريق بالفعل', 409);

  // Owner-only and rare, so a count-then-write is enough; no two admins
  // appoint for the same subject at the same moment. A lead since moved to
  // another subject does not hold a seat here.
  const seated = await Contributor.countDocuments({
    subject: c.subject, 'lead.subject': c.subject, 'lead.active': true,
  });
  if (seated >= MAX_LEADS_PER_SUBJECT) {
    return fail(`لهذه المادة ${MAX_LEADS_PER_SUBJECT} قادة بالفعل — أزل أحدهم أولاً`, 409);
  }

  const perms = { ...DEFAULT_LEAD_PERMISSIONS, ...pickLeadPermissions(body) };
  const lead = {
    active: true,
    subject: c.subject,
    ...perms,
    since: new Date(),
    appointedBy: admin.username || '',
  };

  const updated = await Contributor.findByIdAndUpdate(
    c._id, { $set: { lead } }, { new: true, projection: LEAD_FIELDS },
  ).lean();

  after(() => recordAudit(actorOf(admin), {
    action: 'lead.appoint',
    subjectId: c.subject,
    target: { kind: 'lead', id: c._id, label: c.name },
    meta: { permissions: perms },
  }));

  return NextResponse.json({ ok: true, lead: shape(updated) }, { status: 201 });
}

// ─── PATCH: change permissions ────────────────────────────────────────────────
export async function PATCH(request) {
  const admin = await verifyAdminToken();
  if (!admin) return fail('Unauthorized', 401);

  const body = await readBody(request);
  const changes = pickLeadPermissions(body);
  if (!Object.keys(changes).length) return fail('لا توجد صلاحيات لتعديلها');

  await connectDB();
  const c = await findContributor(body.contributorId);
  if (!isCurrentLead(c)) return fail('هذا المساهم ليس قائد فريق', 404);

  const before = permsOf(c);
  const $set = Object.fromEntries(Object.entries(changes).map(([p, v]) => [`lead.${p}`, v]));
  const updated = await Contributor.findByIdAndUpdate(
    c._id, { $set }, { new: true, projection: LEAD_FIELDS },
  ).lean();

  after(() => recordAudit(actorOf(admin), {
    action: 'lead.update',
    subjectId: c.subject,
    target: { kind: 'lead', id: c._id, label: c.name },
    meta: { from: before, to: permsOf(updated) },
  }));

  return NextResponse.json({ ok: true, lead: shape(updated) });
}

// ─── DELETE: remove ───────────────────────────────────────────────────────────
// Turns the lead off. Their credits, stats and audit history stay.
export async function DELETE(request) {
  const admin = await verifyAdminToken();
  if (!admin) return fail('Unauthorized', 401);

  const body = await readBody(request);
  let reason;
  try {
    reason = validateAudit({ action: 'lead.remove', reason: body.reason });
  } catch (e) {
    if (e instanceof AuditError) return fail(e.message);
    throw e;
  }

  await connectDB();
  const c = await findContributor(body.contributorId);
  // Any active lead record can be turned off, including one left over from a
  // subject the contributor has since been moved away from.
  if (!c?.lead?.active) return fail('هذا المساهم ليس قائد فريق', 404);

  await Contributor.updateOne({ _id: c._id }, { $set: { 'lead.active': false } });

  after(() => recordAudit(actorOf(admin), {
    action: 'lead.remove',
    subjectId: c.subject,
    target: { kind: 'lead', id: c._id, label: c.name },
    reason,
    meta: { permissions: permsOf(c), subject: c.lead.subject },
  }));

  return NextResponse.json({ ok: true });
}
