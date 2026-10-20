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
// than a person — open read-only like anyone else's, with «تولَّ هذا الدرس»:
// any member of the subject may claim one (claimLesson), and from then on it
// is theirs. Claiming is a deliberate step, never a side effect of saving.
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
 *   { canEdit, via: 'admin'|'owner'|'intervention'|null, intervention, canIntervene, canClaim }
 * `canIntervene` — a lead of the lesson's subject who could open one now.
 * `canClaim` — the lesson is unclaimed and the user is a member of its subject.
 * `unclaimed` — the owner is not a real person (see unclaimedOwners).
 */
export function lessonAccess(lesson, user, now = new Date(), { unclaimed = false } = {}) {
  const open = interventionOpen(lesson?.intervention, now) ? lesson.intervention : null;
  const result = (canEdit, via, extra = {}) => ({ canEdit, via, intervention: open, canIntervene: false, canClaim: false, ...extra });
  if (user?.role === 'admin') return result(true, 'admin');

  const me = idOf(user?.id);
  if (me && lessonOwnerId(lesson) === me) return result(true, 'owner');

  const mayIntervene = leadCan(user, 'canIntervene', lesson?.subjectId);
  if (open && mayIntervene && idOf(open.byId) === me) return result(true, 'intervention', { canIntervene: true });

  // Nobody's lesson yet: claiming it is the way in, not an intervention.
  const canClaim = !!(unclaimed && me && user.subject && user.subject === lesson?.subjectId);
  return result(false, null, { canClaim, canIntervene: mayIntervene && !open && !canClaim });
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
 * lesson is refused like anyone else's until it is claimed (claimLesson).
 */
export async function assertCanEditLessons(user, lessonIds, now = new Date()) {
  if (user?.role === 'admin') return;
  const ids = [...new Set((lessonIds || []).filter((x) => typeof x === 'string' && x))];
  if (!ids.length) return;

  await connectDB();
  const lessons = await Lesson.find({ contentId: { $in: ids } })
    .select('contentId subjectId title createdBy ownerId intervention').lean();
  const denied = lessons.find((l) => !lessonAccess(l, user, now).canEdit);
  if (denied) throw notOwner(denied.title);
}

export class ClaimError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ClaimError';
    this.status = status;
  }
}

/**
 * A member takes an unclaimed lesson (the curriculum scaffold): it becomes
 * theirs, and they are its author. Conditional on it still being unclaimed,
 * so two members claiming at once cannot both win. Throws ClaimError.
 */
export async function claimLesson(user, contentId, now = new Date()) {
  await connectDB();
  const lesson = await Lesson.findOne({ contentId })
    .select('contentId subjectId title createdBy ownerId intervention').lean();
  if (!lesson) throw new ClaimError('الدرس غير موجود', 404);
  if (lessonOwnerId(lesson) === idOf(user?.id)) throw new ClaimError('الدرس لك بالفعل');

  const unclaimed = (await unclaimedOwners([lessonOwnerId(lesson)])).size > 0;
  if (!lessonAccess(lesson, user, now, { unclaimed }).canClaim) {
    throw new ClaimError('هذا الدرس في عهدة زميل — اطلب من قائد الفريق إسناده إليك', 403);
  }

  const res = await Lesson.updateOne(
    { contentId, ownerId: lesson.ownerId ?? null },
    { $set: { ownerId: user.id } },
    { timestamps: false },
  );
  if (!res.matchedCount) throw new ClaimError('تولّاه زميل للتو', 409);
  // The scaffold was nobody's writing: whoever claims it is its author.
  await creditLesson(contentId, { contributorId: user.id, name: user.name || '', kind: 'author' });
  return { contentId, title: lesson.title };
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
