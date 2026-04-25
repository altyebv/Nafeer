import { NextResponse }  from 'next/server';
import mongoose          from 'mongoose';
import { verifyAdminAuth }           from '@/lib/adminAuth';
import { connectDB }                 from '@/lib/db';
import { Subject }                   from '@/lib/models/Subject';
import { Unit }                      from '@/lib/models/Unit';
import { Lesson }                    from '@/lib/models/Lesson';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { initialChangelog }          from '@/lib/models/versioning';

// ─── POST /api/admin/subjects ──────────────────────────────────────────────────
//
// Creates a minimal scratch subject in MongoDB so it appears in the AdminEditor
// subject picker and can be published via the delta pipeline.
//
// Also seeds ONE approved unit + ONE approved lesson so the publish guard
// (lessons.approved > 0) is satisfied immediately — letting you hit
// "نشر للتطبيق" right after creation to generate the first remote snapshot.
//
// Body:
//   {
//     subjectId:   string   — e.g. "TEST_DELTA_01"   (must be UPPER_SNAKE_CASE)
//     nameAr:      string   — Arabic display name
//     nameEn?:     string   — optional English name
//     track?:      string   — "COMMON" | "SCIENCE" | "LITERARY"  (default: "COMMON")
//     seedContent? boolean  — if false, skip unit/lesson seeding   (default: true)
//   }
//
// Returns: { ok: true, subjectId, seeded: { units, lessons } }
//
// Admin only.

const VALID_TRACKS = new Set(['COMMON', 'SCIENCE', 'LITERARY']);

export async function POST(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    subjectId,
    nameAr,
    nameEn    = null,
    track     = 'COMMON',
    seedContent = true,
  } = body || {};

  // ── Validation ──────────────────────────────────────────────────────────────

  if (!subjectId || typeof subjectId !== 'string') {
    return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });
  }
  if (!/^[A-Z0-9_]+$/.test(subjectId)) {
    return NextResponse.json(
      { ok: false, error: 'subjectId يجب أن يكون UPPER_SNAKE_CASE (حروف كبيرة وأرقام وشرطة سفلية فقط)' },
      { status: 400 }
    );
  }
  if (!nameAr || typeof nameAr !== 'string' || !nameAr.trim()) {
    return NextResponse.json({ ok: false, error: 'nameAr مطلوب' }, { status: 400 });
  }
  if (!VALID_TRACKS.has(track)) {
    return NextResponse.json(
      { ok: false, error: `track يجب أن يكون أحد: ${[...VALID_TRACKS].join(', ')}` },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // ── Guard: reject duplicates ───────────────────────────────────────────────
    const existing = await Subject.findOne({ subjectId }).select('subjectId').lean();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: `المادة "${subjectId}" موجودة بالفعل في قاعدة البيانات` },
        { status: 409 }
      );
    }

    // ── Resolve seed contributor ───────────────────────────────────────────────
    const contributorId = new mongoose.Types.ObjectId(
      await ensureSystemSeedContributor()
    );

    // ── Create Subject ─────────────────────────────────────────────────────────
    const subject = await Subject.create({
      subjectId,
      nameAr:      nameAr.trim(),
      nameEn:      nameEn?.trim() || null,
      path:        track,
      isMajor:     false,
      order:       9000, // put test subjects at the bottom
      contributor: contributorId, // required by SubjectSchema
      createdBy:   contributorId,
      status:      'approved',
      changelog:   initialChangelog(contributorId, `Test subject created via admin API`),
    });

    let seededUnits   = 0;
    let seededLessons = 0;

    if (seedContent) {
      // ── Seed one unit ────────────────────────────────────────────────────────
      const unitContentId = `${subjectId}_U1`;
      await Unit.create({
        contentId:   unitContentId,
        subjectId,
        title:       'وحدة تجريبية',
        order:       1,
        description: 'وحدة مولّدة تلقائياً للاختبار',
        createdBy:   contributorId,
        status:      'approved',
        changelog:   initialChangelog(contributorId, 'Auto-seeded unit'),
      });
      seededUnits = 1;

      // ── Seed one approved lesson ─────────────────────────────────────────────
      // status: 'approved' so the publish guard (lessons.approved > 0) is met
      // immediately after creation — you can publish right away.
      const lessonContentId = `${subjectId}_U1_L1`;
      await Lesson.create({
        contentId:        lessonContentId,
        subjectId,
        unitContentId,
        title:            'درس تجريبي — اختبار Delta Sync',
        order:            1,
        estimatedMinutes: 10,
        summary:          'درس أُنشئ تلقائياً لاختبار مسار النشر والمزامنة التدريجية.',
        status:           'approved',
        createdBy:        contributorId,
        changelog:        initialChangelog(contributorId, 'Auto-seeded lesson (approved for delta test)'),
      });
      seededLessons = 1;
    }

    return NextResponse.json({
      ok: true,
      subjectId,
      nameAr: nameAr.trim(),
      track,
      seeded: { units: seededUnits, lessons: seededLessons },
      message: seedContent
        ? `تم إنشاء المادة "${subjectId}" مع وحدة ودرس معتمد — جاهزة للنشر الفوري`
        : `تم إنشاء المادة "${subjectId}" بدون محتوى — أضف درساً معتمداً قبل النشر`,
    });
  } catch (e) {
    // Mongoose duplicate key error (race condition)
    if (e.code === 11000) {
      return NextResponse.json(
        { ok: false, error: `المادة "${subjectId}" موجودة بالفعل` },
        { status: 409 }
      );
    }
    console.error('[POST /api/admin/subjects]', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// ─── DELETE /api/admin/subjects?subjectId=TEST_DELTA_01 ───────────────────────
//
// Hard-deletes a test subject and ALL its content from MongoDB.
// Does NOT touch Firestore or Supabase — use the remote-subjects route for that.
//
// DANGEROUS — use only for test subjects. Requires confirmation in the UI.

export async function DELETE(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');

  if (!subjectId) {
    return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });
  }

  try {
    await connectDB();

    const subject = await Subject.findOne({ subjectId }).select('subjectId').lean();
    if (!subject) {
      return NextResponse.json({ ok: false, error: 'المادة غير موجودة' }, { status: 404 });
    }

    // Delete in parallel — Room cascades handle FKs on Android side
    const [
      { deletedCount: units },
      { deletedCount: lessons },
      { deletedCount: sections },
      { deletedCount: blocks },
    ] = await Promise.all([
      (await import('@/lib/models/Unit')).Unit.deleteMany({ subjectId }),
      (await import('@/lib/models/Lesson')).Lesson.deleteMany({ subjectId }),
      (await import('@/lib/models/Section')).Section.deleteMany({ subjectId }),
      (await import('@/lib/models/Block')).Block.deleteMany({ subjectId }),
    ]);

    await Subject.deleteOne({ subjectId });

    return NextResponse.json({
      ok: true,
      subjectId,
      deleted: { subjects: 1, units, lessons, sections, blocks },
      message: `تم حذف المادة "${subjectId}" وجميع محتواها من قاعدة البيانات`,
    });
  } catch (e) {
    console.error('[DELETE /api/admin/subjects]', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}