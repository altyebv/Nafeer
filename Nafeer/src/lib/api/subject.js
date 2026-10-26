import { connectDB } from '@/lib/db';
import { Subject } from '@/lib/models/Subject';
import { Unit } from '@/lib/models/Unit';
import { Lesson } from '@/lib/models/Lesson';
import { initialChangelog } from '@/lib/models/versioning';
import { SUBJECTS_CATALOG, SUBJECTS_BY_ID } from '@/shared/curriculum';
import { lessonOwnerId } from '@/lib/credits';
import { unclaimedOwners } from '@/lib/lessonAccess';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';

// ─── getSubject ───────────────────────────────────────────────────────────────
export async function getSubject(subjectId) {
  await connectDB();
  return Subject.findOne({ subjectId }).lean();
}

// ─── Unit targets ─────────────────────────────────────────────────────────────
// A unit's target is how many lessons its textbook chapter has. The owner sets
// it on the subject page; until then the unit's current lesson count stands in.
// It used to be `lessonCount` in the code catalog.
export const unitTarget = (unit, lessonCount) => unit.targetLessons ?? lessonCount;

// ─── getAllSubjectsProgress ───────────────────────────────────────────────────
// Every subject in the list with its progress from the database: units,
// lessons, approved lessons and the lesson target. A subject not opened yet
// has zeroes. Powers /api/coverage and the landing page — one aggregate and
// one small read of the units.
export async function getAllSubjectsProgress() {
  await connectDB();

  const [byUnit, units] = await Promise.all([
    Lesson.aggregate([
      {
        $group: {
          _id:      { subjectId: '$subjectId', unit: '$unitContentId' },
          total:    { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        },
      },
    ]),
    Unit.find({}).select('subjectId contentId targetLessons').lean(),
  ]);

  const empty = () => ({ units: 0, total: 0, approved: 0, target: 0 });
  const bySubject = {};
  const lessonsIn = new Map();
  for (const r of byUnit) {
    lessonsIn.set(`${r._id.subjectId}/${r._id.unit}`, r.total);
    const row = (bySubject[r._id.subjectId] ??= empty());
    row.total += r.total;
    row.approved += r.approved;
  }
  for (const u of units) {
    const row = (bySubject[u.subjectId] ??= empty());
    row.units += 1;
    row.target += unitTarget(u, lessonsIn.get(`${u.subjectId}/${u.contentId}`) || 0);
  }

  return SUBJECTS_CATALOG.map((subject) => ({
    subjectId:       subject.id,
    nameAr:          subject.nameAr,
    track:           subject.track,
    isMajor:         subject.isMajor,
    color:           subject.color,
    order:           subject.order,
    unitCount:       bySubject[subject.id]?.units    || 0,
    totalLessons:    bySubject[subject.id]?.total    || 0,
    approvedLessons: bySubject[subject.id]?.approved || 0,
    targetLessons:   bySubject[subject.id]?.target   || 0,
  }));
}

// ─── openSubject ──────────────────────────────────────────────────────────────
// Admin only. Creates the Subject document of a subject in the list, with no
// units or lessons — the owner adds those on the subject page, from the
// textbook (docs/subject-lifecycle.md). Safe to call twice.
//
// It replaced bootstrapSubject, which built every unit and lesson from a
// template in the code catalog and, when the editor called it, attributed
// them to whoever opened the editor first.
export async function openSubject(subjectId) {
  await connectDB();

  const entry = SUBJECTS_BY_ID[subjectId];
  if (!entry) throw new Error(`[openSubject] "${subjectId}" is not in the subject list`);

  if (await Subject.exists({ subjectId })) return { subjectId, opened: false };

  const actorId = await ensureSystemSeedContributor();
  await Subject.create({
    subjectId,
    nameAr:      entry.nameAr,
    nameEn:      entry.nameEn,
    path:        entry.track,
    isMajor:     entry.isMajor,
    order:       entry.order,
    contributor: actorId,
    createdBy:   actorId,
    changelog:   initialChangelog(actorId, 'opened by the owner'),
  });
  return { subjectId, opened: true };
}

// ─── createUnit ───────────────────────────────────────────────────────────────
// Adds a unit at the end of an opened subject, owned by system_seed. Its id is
// `${subjectId}_U${order}`, and an order is never reused: after a delete the
// next free number is taken. Throws a Mongo 11000 error on a race.
export async function createUnit(subjectId, { title, targetLessons = null, description = null, bookId = null, bookTitle = null }) {
  await connectDB();

  const existing = await Unit.find({ subjectId }).select('order contentId').lean();
  const taken = new Set(existing.map((u) => u.contentId));
  let order = existing.length + 1;
  while (taken.has(`${subjectId}_U${order}`)) order += 1;

  const actorId = await ensureSystemSeedContributor();
  return Unit.create({
    contentId:     `${subjectId}_U${order}`,
    subjectId,
    title:         title.trim(),
    order,
    description:   description?.trim() || null,
    targetLessons,
    bookId,
    bookTitle,
    status:        'approved',
    createdBy:     actorId,
    changelog:     initialChangelog(actorId, 'unit created by the owner'),
  });
}

// ─── Books ────────────────────────────────────────────────────────────────────
// Some subjects come in several textbooks (Arabic has المطالعة, النحو, …). A
// book is not a document of its own: units that share a `bookId` form it, and
// each carries the book's title and its position in it (`bookOrder`, 1-based,
// by unit order). The app and the editor draw a divider where the book changes.

export const MAX_BOOK_TITLE = 80;

/** Renumbers `bookOrder` within each of these books, by unit order. */
export async function renumberBooks(subjectId, bookIds) {
  for (const bookId of new Set(bookIds.filter(Boolean))) {
    const units = await Unit.find({ subjectId, bookId }).select('_id').sort({ order: 1 }).lean();
    if (!units.length) continue;
    await Unit.bulkWrite(units.map((u, i) => ({
      updateOne: { filter: { _id: u._id }, update: { $set: { bookOrder: i + 1 } } },
    })));
  }
}

/**
 * Puts a unit in a book — an existing one `{ id }` or a new one `{ title }` —
 * or takes it out of any (`null`). New books get `${subjectId}_BOOK_${n}`.
 * Returns the unit's book fields, or { error } when the book is unknown.
 */
export async function setUnitBook(unitId, book) {
  await connectDB();
  const unit = await Unit.findById(unitId).select('subjectId bookId').lean();
  if (!unit) return { error: 'الوحدة غير موجودة', status: 404 };
  const { subjectId, bookId: previousBook } = unit;

  let bookId = null;
  let bookTitle = null;
  if (book?.id) {
    const other = await Unit.findOne({ subjectId, bookId: book.id }).select('bookTitle').lean();
    if (!other) return { error: 'الكتاب غير موجود في هذه المادة', status: 400 };
    bookId = book.id;
    bookTitle = other.bookTitle;
  } else if (book?.title) {
    const taken = new Set((await Unit.distinct('bookId', { subjectId })).filter(Boolean));
    let n = taken.size + 1;
    while (taken.has(`${subjectId}_BOOK_${n}`)) n += 1;
    bookId = `${subjectId}_BOOK_${n}`;
    bookTitle = book.title.trim();
  }

  await Unit.updateOne({ _id: unitId }, { $set: { bookId, bookTitle, bookOrder: null } });
  await renumberBooks(subjectId, [previousBook, bookId]);
  const after = await Unit.findById(unitId).select('bookId bookTitle bookOrder').lean();
  return { bookId: after.bookId, bookTitle: after.bookTitle, bookOrder: after.bookOrder };
}

/** Renames a book: every unit in it carries the title. Returns how many. */
export async function renameBook(subjectId, bookId, title) {
  await connectDB();
  const r = await Unit.updateMany({ subjectId, bookId }, { $set: { bookTitle: title.trim() } });
  return r.matchedCount ?? r.n ?? 0;
}

// ─── getUnitsWithLessons ──────────────────────────────────────────────────────
// Returns all units + lessons for a subject, units sorted by global order,
// with lessons nested inside their unit.
export async function getUnitsWithLessons(subjectId) {
  await connectDB();

  const [units, lessons] = await Promise.all([
    Unit.find({ subjectId }).sort({ order: 1 }).lean(),
    Lesson.find({ subjectId }).sort({ order: 1 }).lean(),
  ]);

  // Whose each lesson is, and whether it is still unclaimed scaffold — the
  // editor shows a member their own lessons and offers unclaimed ones
  // (docs/team-leads.md L4). One read over the distinct owners.
  const unclaimed = await unclaimedOwners(lessons.map(lessonOwnerId));
  for (const l of lessons) {
    l.owner = lessonOwnerId(l);
    l.unclaimed = unclaimed.has(l.owner);
  }

  const lessonsByUnit = lessons.reduce((acc, l) => {
    if (!acc[l.unitContentId]) acc[l.unitContentId] = [];
    acc[l.unitContentId].push(l);
    return acc;
  }, {});

  return units.map((u) => ({
    ...u,
    lessons: lessonsByUnit[u.contentId] || [],
  }));
}
