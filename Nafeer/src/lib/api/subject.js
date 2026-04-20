import { connectDB } from '@/lib/db';
import { Subject } from '@/lib/models/Subject';
import { Unit } from '@/lib/models/Unit';
import { Lesson } from '@/lib/models/Lesson';
import { initialChangelog } from '@/lib/models/versioning';
import { buildSubjectScaffold, SUBJECTS_BY_ID } from '@/shared/curriculum';

// ─── getSubject ───────────────────────────────────────────────────────────────
export async function getSubject(subjectId) {
  await connectDB();
  return Subject.findOne({ subjectId }).lean();
}

// ─── getSubjectWithProgress ───────────────────────────────────────────────────
export async function getSubjectWithProgress(subjectId) {
  await connectDB();

  const subject = await Subject.findOne({ subjectId }).lean();
  if (!subject) return null;

  const [totalLessons, approvedLessons] = await Promise.all([
    Lesson.countDocuments({ subjectId }),
    Lesson.countDocuments({ subjectId, status: 'approved' }),
  ]);

  return { ...subject, totalLessons, approvedLessons };
}

// ─── getAllSubjectsProgress ───────────────────────────────────────────────────
export async function getAllSubjectsProgress() {
  await connectDB();

  const counts = await Lesson.aggregate([
    {
      $group: {
        _id:      '$subjectId',
        total:    { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
      },
    },
  ]);

  const countMap = Object.fromEntries(
    counts.map((c) => [c._id, { total: c.total, approved: c.approved }])
  );

  const { SUBJECTS_CATALOG } = await import('@/shared/curriculum');
  return SUBJECTS_CATALOG.map((subject) => ({
    subjectId:       subject.id,
    nameAr:          subject.nameAr,
    track:           subject.track,
    isMajor:         subject.isMajor,
    color:           subject.color,
    order:           subject.order,
    totalLessons:    countMap[subject.id]?.total    || 0,
    approvedLessons: countMap[subject.id]?.approved || 0,
    targetLessons:   subject.units.reduce((acc, u) => acc + u.lessonCount, 0),
  }));
}

// ─── bootstrapSubject ─────────────────────────────────────────────────────────
// Called on editor mount. Ensures Subject + all Units + all Lessons exist.
// Uses the deterministic scaffold from curriculum.js.
// Safe to call multiple times — only creates what's missing.
//
// The scaffold may throw if the curriculum has duplicate unit orders.
// That's intentional — surface the bug immediately rather than silently
// dropping units in Atlas.
//
export async function bootstrapSubject(subjectId, contributorId) {
  await connectDB();

  const catalog = SUBJECTS_BY_ID[subjectId];
  if (!catalog) throw new Error(`Unknown subjectId: ${subjectId}`);

  // buildSubjectScaffold validates for duplicate unit orders and throws if found
  const scaffold = buildSubjectScaffold(subjectId);

  // ── Subject document ──────────────────────────────────────────────────────
  const existingSubject = await Subject.findOne({ subjectId });

  if (!existingSubject) {
    await Subject.create({
      subjectId,
      nameAr:      catalog.nameAr,
      nameEn:      catalog.nameEn,
      path:        catalog.track,
      isMajor:     catalog.isMajor,
      order:       catalog.order,
      contributor: contributorId,
      createdBy:   contributorId,
      changelog:   initialChangelog(contributorId, 'bootstrapped from curriculum'),
    });
  }

  // ── Units ─────────────────────────────────────────────────────────────────
  const existingUnitIds = new Set(
    (await Unit.find({ subjectId }).select('contentId').lean()).map((u) => u.contentId)
  );

  const newUnits = scaffold.units
    .filter((u) => !existingUnitIds.has(u.id))
    .map((u) => ({
      contentId:  u.id,
      subjectId,
      title:      u.title,
      order:      u.order,
      // ── Book metadata — critical for multi-book subjects (ARABIC, MATH_SCIENCE…)
      bookId:     u.bookId    ?? null,
      bookTitle:  u.bookTitle ?? null,
      // bookOrder: display-only per-book numbering (resets to 1 per book)
      bookOrder:  u.bookOrder ?? null,
      createdBy:  contributorId,
      changelog:  initialChangelog(contributorId),
    }));

  if (newUnits.length > 0) {
    // ordered: true so a duplicate contentId (curriculum bug) throws loudly
    // rather than silently dropping units.
    await Unit.insertMany(newUnits, { ordered: true });
  }

  // ── Lessons ───────────────────────────────────────────────────────────────
  const existingLessonIds = new Set(
    (await Lesson.find({ subjectId }).select('contentId').lean()).map((l) => l.contentId)
  );

  const newLessons = scaffold.lessons
    .filter((l) => !existingLessonIds.has(l.id))
    .map((l) => ({
      contentId:        l.id,
      subjectId,
      unitContentId:    l.unitId,
      title:            l.title,
      order:            l.order,
      estimatedMinutes: l.estimatedMinutes,
      summary:          null,
      createdBy:        contributorId,
      changelog:        initialChangelog(contributorId),
    }));

  if (newLessons.length > 0) {
    await Lesson.insertMany(newLessons, { ordered: true });
  }

  return {
    subject:        catalog,
    unitsCreated:   newUnits.length,
    lessonsCreated: newLessons.length,
  };
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