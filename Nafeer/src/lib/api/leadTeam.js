import { connectDB }           from '@/lib/db';
import { Contributor }         from '@/lib/models/Contributor';
import { ContributorActivity } from '@/lib/models/ContributorActivity';
import { Lesson }              from '@/lib/models/Lesson';
import { AuditEvent }          from '@/lib/models/AuditEvent';
import { Announcement }        from '@/lib/models/announcement';
import { REAL_PEOPLE }         from '@/lib/SeedActor';
import { isLeadAvailable, isPaused, normaliseLead } from '@/lib/leads';

// ─── The lead's team page (docs/team-leads.md L2) ─────────────────────────────
// Everything the team page shows, in one request when it opens:
//   members       — everyone approved in the subject, with their last activity,
//                   events in the last 30 days, the lessons they own by status,
//                   and whether they are paused
//   leads         — the subject's leads and whether each is around to review
//   turnaround    — how long lessons waited for a lead's decision, last 30 days
//   announcements — the ones this subject's leads wrote, newest first
//
// Five reads. Nothing on this page polls.

const DAY_MS = 24 * 60 * 60 * 1000;
export const TEAM_WINDOW_DAYS = 30;

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export async function getTeam(subjectId, now = new Date()) {
  await connectDB();
  const since = new Date(now.getTime() - TEAM_WINDOW_DAYS * DAY_MS);

  const people = await Contributor.find({ subject: subjectId, status: 'approved', ...REAL_PEOPLE })
    .select('name username avatarUrl lead paused stats.lastActiveAt stats.editsMade stats.reviewsSubmitted')
    .sort({ name: 1 })
    .lean();
  const ids = people.map((p) => p._id);

  const [activity, owned, decisions, announcements] = await Promise.all([
    ids.length
      ? ContributorActivity.aggregate([
          { $match: { contributorId: { $in: ids }, createdAt: { $gte: since } } },
          { $group: { _id: '$contributorId', n: { $sum: 1 } } },
        ])
      : [],
    // Owner = ownerId when set, else the author.
    Lesson.aggregate([
      { $match: { subjectId } },
      { $group: { _id: { owner: { $ifNull: ['$ownerId', '$createdBy'] }, status: '$status' }, n: { $sum: 1 } } },
    ]),
    AuditEvent.find({
      subjectId, action: { $in: ['lesson.approve', 'lesson.return'] }, at: { $gte: since },
    }).select('meta.waitedMs').lean(),
    Announcement.find({ targetSubjects: subjectId, leadAuthorId: { $ne: null } })
      .sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const eventsOf = Object.fromEntries(activity.map((a) => [String(a._id), a.n]));
  const ownedOf = {};
  for (const row of owned) {
    const key = String(row._id.owner);
    ownedOf[key] ??= { draft: 0, review: 0, approved: 0, archived: 0 };
    ownedOf[key][row._id.status] = row.n;
  }

  const members = people.map((p) => {
    const id = String(p._id);
    const lead = normaliseLead(p.lead, subjectId);
    return {
      id,
      name:         p.name,
      username:     p.username || null,
      avatarUrl:    p.avatarUrl || null,
      isLead:       !!lead,
      lastActiveAt: p.stats?.lastActiveAt || null,
      events30d:    eventsOf[id] || 0,
      edits:        p.stats?.editsMade || 0,
      reviews:      p.stats?.reviewsSubmitted || 0,
      lessons:      ownedOf[id] || { draft: 0, review: 0, approved: 0, archived: 0 },
      paused:       isPaused(p.paused, now)
        ? { until: p.paused.until || null, reason: p.paused.reason, byName: p.paused.byName, at: p.paused.at }
        : null,
    };
  });

  const waits = decisions.map((d) => d.meta?.waitedMs).filter((ms) => typeof ms === 'number' && ms >= 0);

  return {
    subjectId,
    windowDays: TEAM_WINDOW_DAYS,
    members,
    leads: people
      .filter((p) => normaliseLead(p.lead, subjectId))
      .map((p) => ({
        id: String(p._id),
        name: p.name,
        awayUntil: p.lead.awayUntil || null,
        available: isLeadAvailable(p, now),
      })),
    turnaround: {
      decisions:   decisions.length,
      medianHours: waits.length ? Math.round(median(waits) / 36e5 * 10) / 10 : null,
    },
    announcements: announcements.map((a) => ({
      id: String(a._id), title: a.title, body: a.body, pinned: !!a.pinned,
      authorName: a.authorName, leadAuthorId: a.leadAuthorId, createdAt: a.createdAt,
    })),
  };
}
