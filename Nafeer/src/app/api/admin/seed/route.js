import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { Subject }         from '@/lib/models/Subject';
import { Unit }            from '@/lib/models/Unit';
import { Lesson }          from '@/lib/models/Lesson';
import { Section }         from '@/lib/models/Section';
import { Block }           from '@/lib/models/Block';
import { Concept }         from '@/lib/models/Concept';
import { FeedItem }        from '@/lib/models/FeedItem';
import { Question }        from '@/lib/models/Question';
import { bootstrapSubject } from '@/lib/api/subject';
import { ensureSystemSeedContributor } from '@/lib/systemseedActor';
import { SUBJECTS_CATALOG, buildSubjectScaffold } from '@/shared/curriculum';

// ─── GET /api/admin/seed ──────────────────────────────────────────────────────
// Returns the seeding status of every subject in the catalog:
// how many units/lessons are in the DB vs what the catalog expects,
// and whether there are any stale contentIds (in DB but not in catalog).

export async function GET() {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  await connectDB();

  // Pull all units and lessons grouped by subjectId in one pass
  const [unitAgg, lessonAgg] = await Promise.all([
    Unit.aggregate([
      { $group: { _id: '$subjectId', count: { $sum: 1 }, ids: { $push: '$contentId' } } }
    ]),
    Lesson.aggregate([
      { $group: {
        _id:      '$subjectId',
        count:    { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        ids:      { $push: '$contentId' },
      }}
    ]),
  ]);

  const unitMap   = Object.fromEntries(unitAgg.map((r)   => [r._id, r]));
  const lessonMap = Object.fromEntries(lessonAgg.map((r) => [r._id, r]));

  const subjects = SUBJECTS_CATALOG.map((cat) => {
    // Build what the scaffold *should* produce
    let scaffold;
    try   { scaffold = buildSubjectScaffold(cat.id); }
    catch { scaffold = null; }

    const expectedUnits   = scaffold?.units.length   ?? 0;
    const expectedLessons = scaffold?.lessons.length ?? 0;

    const dbUnits    = unitMap[cat.id]   ?? { count: 0, ids: [] };
    const dbLessons  = lessonMap[cat.id] ?? { count: 0, ids: [], approved: 0 };

    // Stale = IDs in DB that are no longer in the catalog scaffold
    const catalogUnitIds   = new Set(scaffold?.units.map((u)   => u.id)   ?? []);
    const catalogLessonIds = new Set(scaffold?.lessons.map((l) => l.id)   ?? []);
    const staleUnits       = dbUnits.ids.filter((id)   => !catalogUnitIds.has(id));
    const staleLessons     = dbLessons.ids.filter((id) => !catalogLessonIds.has(id));

    // Missing = in catalog but not yet in DB
    const dbUnitSet   = new Set(dbUnits.ids);
    const dbLessonSet = new Set(dbLessons.ids);
    const missingUnits   = scaffold?.units.filter((u)   => !dbUnitSet.has(u.id))     ?? [];
    const missingLessons = scaffold?.lessons.filter((l) => !dbLessonSet.has(l.id))   ?? [];

    const seeded = dbUnits.count > 0 || dbLessons.count > 0;

    return {
      id:              cat.id,
      nameAr:          cat.nameAr,
      track:           cat.track,
      isMajor:         cat.isMajor,
      order:           cat.order,
      // Catalog targets
      expectedUnits,
      expectedLessons,
      // DB state
      dbUnits:         dbUnits.count,
      dbLessons:       dbLessons.count,
      approvedLessons: dbLessons.approved,
      // Health signals
      seeded,
      missingUnits:    missingUnits.length,
      missingLessons:  missingLessons.length,
      staleUnits:      staleUnits.length,
      staleLessons:    staleLessons.length,
      staleUnitIds:    staleUnits,
      staleLessonIds:  staleLessons,
      // Catalog error (duplicate orders, etc.)
      catalogError:    scaffold === null ? 'خطأ في بناء المنهج — تحقق من الأوامر المكررة' : null,
    };
  });

  return NextResponse.json({ ok: true, subjects });
}

// ─── POST /api/admin/seed ─────────────────────────────────────────────────────
// Actions:
//   { action: 'bootstrap', subjectId }          — seed missing units/lessons only
//   { action: 'wipe',      subjectId }          — delete everything for the subject
//   { action: 'reseed',    subjectId }          — wipe then bootstrap (atomic)
//   { action: 'wipe_stale', subjectId }         — delete only stale unit/lesson IDs
//   { action: 'bootstrap_all' }                 — seed all unseeded subjects

export async function POST(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  const body = await request.json();
  const { action, subjectId } = body;

  await connectDB();
  const seedContributorId = await ensureSystemSeedContributor();

  // ── bootstrap ──────────────────────────────────────────────────────────────
  if (action === 'bootstrap') {
    if (!subjectId) return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });
    try {
      const result = await bootstrapSubject(subjectId, seedContributorId);
      return NextResponse.json({ ok: true, result });
    } catch (e) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
  }

  // ── wipe ───────────────────────────────────────────────────────────────────
  if (action === 'wipe') {
    if (!subjectId) return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });

    const sections = await Section.find({ subjectId }).select('contentId').lean();
    const sectionIds = sections.map((s) => s.contentId);

    const [, , units, lessons, concepts, feedItems, questions, subjects] = await Promise.all([
      sectionIds.length ? Block.deleteMany({ sectionContentId: { $in: sectionIds } }) : Promise.resolve(),
      Section.deleteMany({ subjectId }),
      Unit.deleteMany({ subjectId }),
      Lesson.deleteMany({ subjectId }),
      Concept.deleteMany({ subjectId }),
      FeedItem.deleteMany({ subjectId }),
      Question.deleteMany({ subjectId }),
      Subject.deleteOne({ subjectId }),
    ]);

    return NextResponse.json({
      ok: true,
      result: {
        deletedUnits:    units.deletedCount,
        deletedLessons:  lessons.deletedCount,
        deletedConcepts: concepts.deletedCount,
        deletedFeedItems: feedItems.deletedCount,
        deletedQuestions: questions.deletedCount,
      },
    });
  }

  // ── reseed ─────────────────────────────────────────────────────────────────
  if (action === 'reseed') {
    if (!subjectId) return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });

    // Wipe units and lessons only (keep approved content warnings)
    const approvedCount = await Lesson.countDocuments({ subjectId, status: 'approved' });
    if (approvedCount > 0) {
      return NextResponse.json({
        ok:    false,
        error: `لا يمكن إعادة التهيئة: يوجد ${approvedCount} درس معتمد — استخدم wipe+force للمتابعة`,
      }, { status: 409 });
    }

    await Promise.all([
      Unit.deleteMany({ subjectId }),
      Lesson.deleteMany({ subjectId }),
      Subject.deleteOne({ subjectId }),
    ]);

    try {
      const result = await bootstrapSubject(subjectId, seedContributorId);
      return NextResponse.json({ ok: true, result });
    } catch (e) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
  }

  // ── wipe_stale ─────────────────────────────────────────────────────────────
  if (action === 'wipe_stale') {
    if (!subjectId) return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });

    const scaffold = buildSubjectScaffold(subjectId);
    if (!scaffold) return NextResponse.json({ ok: false, error: 'خطأ في بناء المنهج' }, { status: 400 });

    const catalogUnitIds   = new Set(scaffold.units.map((u)   => u.id));
    const catalogLessonIds = new Set(scaffold.lessons.map((l) => l.id));

    const [dbUnits, dbLessons] = await Promise.all([
      Unit.find({ subjectId }).select('contentId').lean(),
      Lesson.find({ subjectId }).select('contentId').lean(),
    ]);

    const staleUnitIds   = dbUnits.map((u)   => u.contentId).filter((id) => !catalogUnitIds.has(id));
    const staleLessonIds = dbLessons.map((l) => l.contentId).filter((id) => !catalogLessonIds.has(id));

    const [unitDel, lessonDel] = await Promise.all([
      staleUnitIds.length   ? Unit.deleteMany({ contentId: { $in: staleUnitIds } })   : Promise.resolve({ deletedCount: 0 }),
      staleLessonIds.length ? Lesson.deleteMany({ contentId: { $in: staleLessonIds } }) : Promise.resolve({ deletedCount: 0 }),
    ]);

    return NextResponse.json({
      ok: true,
      result: {
        deletedUnits:   unitDel.deletedCount,
        deletedLessons: lessonDel.deletedCount,
      },
    });
  }

  // ── bootstrap_all ──────────────────────────────────────────────────────────
  if (action === 'bootstrap_all') {
    const results = [];
    for (const cat of SUBJECTS_CATALOG) {
      try {
        const r = await bootstrapSubject(cat.id, seedContributorId);
        results.push({ id: cat.id, ok: true, ...r });
      } catch (e) {
        results.push({ id: cat.id, ok: false, error: e.message });
      }
    }
    return NextResponse.json({ ok: true, results });
  }

  return NextResponse.json({ ok: false, error: `إجراء غير معروف: ${action}` }, { status: 400 });
}