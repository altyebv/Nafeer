import { connectDB } from '@/lib/db';
import { Lesson }    from '@/lib/models/Lesson';
import { Section }   from '@/lib/models/Section';
import { Block }     from '@/lib/models/Block';
import { Contributor } from '@/lib/models/Contributor';
import { REAL_PEOPLE } from '@/lib/SeedActor';
import { creditLesson, lessonOwnerId } from '@/lib/credits';
import { leadCan } from '@/lib/leads';

// ─── Who may change a lesson (docs/team-leads.md L4) ──────────────────────────
// A lesson belongs to its owner — the author, or whoever it was assigned to
// (lib/credits.js lessonOwnerId). Only they change it. Everyone else in the
// subject reads it. Two exceptions:
//   - the owner of the platform (admin), always;
//   - a lead with canIntervene, while their intervention on that lesson is
//     open (`Lesson.intervention`, started with a category and a reason).
//
// Unclaimed lessons — the curriculum scaffold, owned by the seed actor rather
// than a person — are open to every member of the subject, and the first one
// to save claims it: from then on it is theirs.
//
// The rule is `lessonAccess`, pure. `assertCanEditLessons` applies it to the
// lessons a write touches, in one read; the `lessonsFor*` helpers find which
// lessons those are for writes addressed by section or block.
// tests/writeGuard.test.js checks every lesson-content write handler calls it.

export const INTERVENTION_HOURS = 24;
export const INTERVENTION_CATEGORIES = {
  urgent:   'إصلاح عاجل قبل النشر',
  factual:  'خطأ علمي',
  inactive: 'صاحب الدرس غائب',
  other:    'سبب آخر',
};

const idOf = (v) => (v == null ? null : String(v));

/** Whether an intervention record is open at `now`. */
export function interventionOpen(intervention, now = new Date()) {
  return !!intervention?.byId && !!intervention.until && new Date(intervention.until) > now;
}

/**
 * What `user` may do with `lesson`:
 *   { canEdit, via: 'admin'|'owner'|'unclaimed'|'intervention'|null, intervention, canIntervene }
 * `canIntervene` — a lead of the lesson's subject who could open one now.
 * `unclaimed` — the owner is not a real person (see unclaimedOwners).
 */
export function lessonAccess(lesson, user, now = new Date(), { unclaimed = false } = {}) {
  const open = interventionOpen(lesson?.intervention, now) ? lesson.intervention : null;
  if (user?.role === 'admin') return { canEdit: true, via: 'admin', intervention: open, canIntervene: false };

  const me = idOf(user?.id);
  if (me && lessonOwnerId(lesson) === me) return { canEdit: true, via: 'owner', intervention: open, canIntervene: false };
  if (unclaimed && me && user.subject && user.subject === lesson?.subjectId) {
    return { canEdit: true, via: 'unclaimed', intervention: open, canIntervene: false };
  }

  const mayIntervene = leadCan(user, 'canIntervene', lesson?.subjectId);
  if (open && mayIntervene && idOf(open.byId) === me) {
    return { canEdit: true, via: 'intervention', intervention: open, canIntervene: true };
  }
  return { canEdit: false, via: null, intervention: open, canIntervene: mayIntervene && !open };
}

const notOwner = (title) =>
  Response.json(
    { ok: false, code: 'NOT_OWNER', error: `${title ? `«${title}»` : 'هذا الدرس'} ليس من دروسك — يمكنك قراءته فقط` },
    { status: 403 },
  );

/**
 * Of these owner ids, the ones that are no real person — the seed actor's
 * placeholder id, the system_seed account, or no account at all. One read.
 */
export async function unclaimedOwners(ownerIds) {
  const ids = [...new Set(ownerIds.filter(Boolean).map(String))];
  if (!ids.length) return new Set();
  const real = await Contributor.find({ _id: { $in: ids }, ...REAL_PEOPLE }).select('_id').lean();
  const realIds = new Set(real.map((c) => String(c._id)));
  return new Set(ids.filter((id) => !realIds.has(id)));
}

/**
 * Throws a 403 unless `user` may change every one of these lessons. Ids with
 * no lesson yet pass — whoever creates a lesson is its author. An unclaimed
 * lesson becomes the writer's here, before the write.
 */
export async function assertCanEditLessons(user, lessonIds, now = new Date()) {
  if (user?.role === 'admin') return;
  const ids = [...new Set((lessonIds || []).filter((x) => typeof x === 'string' && x))];
  if (!ids.length) return;

  await connectDB();
  const lessons = await Lesson.find({ contentId: { $in: ids } })
    .select('contentId subjectId title createdBy ownerId intervention').lean();
  const blocked = lessons.filter((l) => !lessonAccess(l, user, now).canEdit);
  if (!blocked.length) return;

  // Only now ask who the owners are: most writes are by the owner.
  const unclaimed = await unclaimedOwners(blocked.map(lessonOwnerId));
  const denied = blocked.find((l) => !lessonAccess(l, user, now, { unclaimed: unclaimed.has(lessonOwnerId(l)) }).canEdit);
  if (denied) throw notOwner(denied.title);

  // Claim them — conditional, so two members saving at once cannot both win.
  await Promise.all(blocked.map((l) => Lesson.updateOne(
    { contentId: l.contentId, ownerId: l.ownerId ?? null },
    { $set: { ownerId: user.id } },
    { timestamps: false },
  )));
  const mine = await Lesson.find({ contentId: { $in: blocked.map((l) => l.contentId) } }).select('contentId title ownerId').lean();
  const lost = mine.find((l) => String(l.ownerId) !== String(user.id));
  if (lost) throw notOwner(lost.title);
  // The scaffold was nobody's writing: whoever claims it is its author.
  await Promise.all(mine.map((l) => creditLesson(l.contentId, { contributorId: user.id, name: user.name || '', kind: 'author' })));
}

/** The lessons these sections belong to — existing ones, and the ones named. */
export async function lessonsForSections(sectionIds = [], named = []) {
  const ids = [...new Set(sectionIds.filter((x) => typeof x === 'string' && x))];
  const found = ids.length
    ? await Section.find({ contentId: { $in: ids } }).select('lessonContentId').lean()
    : [];
  return [...new Set([...found.map((s) => s.lessonContentId), ...named].filter(Boolean))];
}

/**
 * The lessons these blocks belong to: through the sections they are in now
 * and the sections they are being written to.
 */
export async function lessonsForBlocks(blockIds = [], targetSectionIds = []) {
  const ids = [...new Set(blockIds.filter((x) => typeof x === 'string' && x))];
  const found = ids.length
    ? await Block.find({ contentId: { $in: ids } }).select('sectionContentId').lean()
    : [];
  return lessonsForSections([...found.map((b) => b.sectionContentId), ...targetSectionIds]);
}

/** The lesson a lesson-linked item (question, feed card) belongs to, now and after the write. */
export async function lessonsForLinked(Model, contentIds = [], namedLessonIds = []) {
  const ids = [...new Set(contentIds.filter((x) => typeof x === 'string' && x))];
  const found = ids.length
    ? await Model.find({ contentId: { $in: ids } }).select('lessonContentId').lean()
    : [];
  return [...new Set([...found.map((d) => d.lessonContentId), ...namedLessonIds].filter((x) => typeof x === 'string' && x))];
}
