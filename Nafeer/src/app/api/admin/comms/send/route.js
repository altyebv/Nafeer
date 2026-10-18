import { NextResponse }       from 'next/server';
import { verifyAdminAuth, getAdminSession } from '@/lib/adminAuth';
import { connectDB }          from '@/lib/db';
import { Announcement }       from '@/lib/models/announcement';
import { Contributor }        from '@/lib/models/Contributor';
import { sendEmail }          from '@/lib/email/emailService';
import { REAL_PEOPLE } from '@/lib/SeedActor';

const DAY_MS = 86_400_000;
const IDLE_DAYS = 14;

// Who a contributor message reaches. Only working contributors: approved,
// onboarded, and not the seed actor.
//   all      everyone
//   subject  one subject's contributors        (value: subjectId)
//   role     one role's contributors           (value: roleId)
//   idle     nobody active in the last 14 days
//   person   one contributor                   (value: contributor _id)
function audienceFilter(scope = {}) {
  const base = { status: 'approved', onboarded: true, ...REAL_PEOPLE };
  switch (scope.kind) {
    case 'subject': return { ...base, subject: scope.value };
    case 'role':    return { ...base, roleId: scope.value };
    case 'person':  return { ...base, _id: scope.value };   // one contributor (the overview nudge)
    case 'idle':    return {
      ...base,
      $or: [{ 'stats.lastActiveAt': null }, { 'stats.lastActiveAt': { $lt: new Date(Date.now() - IDLE_DAYS * DAY_MS) } }],
    };
    default:        return base;
  }
}

// ─── GET /api/admin/comms/send?kind=…&value=… ─────────────────────────────────
// How many contributors a scope reaches — the composer's "reaches N" line.
export async function GET(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;
  const sp = new URL(request.url).searchParams;
  await connectDB();
  const reach = await Contributor.countDocuments(audienceFilter({ kind: sp.get('kind'), value: sp.get('value') }));
  return NextResponse.json({ ok: true, reach });
}

// ─── POST /api/admin/comms/send ───────────────────────────────────────────────
// One message to contributors, over the channels chosen:
//   { title, body, scope: { kind, value? }, channels: { board?: true, mail?: true } }
//
// board → one Announcement, targeted the narrowest way the scope allows
// mail  → the custom_message template to each person, one log row each
export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 }); }

  const title = body.title?.trim();
  const text = body.body?.trim();
  const scope = body.scope || { kind: 'all' };
  const channels = body.channels || {};
  if (!title || !text) return NextResponse.json({ ok: false, error: 'العنوان والنص مطلوبان' }, { status: 400 });
  if (!channels.board && !channels.mail) return NextResponse.json({ ok: false, error: 'اختر قناة واحدة على الأقل' }, { status: 400 });

  try {
    await connectDB();
    const people = await Contributor.find(audienceFilter(scope), '_id name email').lean();
    if (!people.length) return NextResponse.json({ ok: false, error: 'لا أحد في هذا الجمهور' }, { status: 400 });

    const result = { reach: people.length };

    if (channels.board) {
      const target = scope.kind === 'subject'
        ? { targetSubjects: [scope.value] }
        : scope.kind === 'all' ? {} : { targetContributorIds: people.map((p) => p._id) };
      const doc = await Announcement.create({
        title, body: text, type: 'info',
        authorId: session.id, authorName: session.name || session.displayName || 'الإدارة',
        ...target,
      });
      result.board = { ok: true, id: String(doc._id) };
    }

    if (channels.mail) {
      let sent = 0;
      const failed = [];
      // One at a time: the audience is small and the provider rate-limits bursts.
      for (const p of people) {
        if (!p.email) { failed.push(p.name); continue; }
        const r = await sendEmail({ to: p.email, template: 'custom_message', data: { name: p.name, subject: title, message: text } });
        if (r.ok) sent += 1; else failed.push(p.name);
      }
      result.mail = { sent, failed };
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    console.error('[POST /api/admin/comms/send]', e);
    return NextResponse.json({ ok: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}
