import { NextResponse }           from 'next/server';
import { verifyAdminAuth }        from '@/lib/adminAuth';
import { connectDB }              from '@/lib/db';
import { Subject }                from '@/lib/models/Subject';
import { Unit }                   from '@/lib/models/Unit';
import { Lesson }                 from '@/lib/models/Lesson';
import { Section }                from '@/lib/models/Section';
import { Block }                  from '@/lib/models/Block';
import { Concept }                from '@/lib/models/Concept';
import { Tag }                    from '@/lib/models/Tag';
import { FeedItem }               from '@/lib/models/FeedItem';
import { Question }               from '@/lib/models/Question';
import { Exam }                   from '@/lib/models/Exam';
import { uploadFile, getPublicUrl } from '@/lib/supabase';
import { getManifest, upsertSubjectEntry } from '@/lib/FirebaseAdmin';

// ── Supabase bucket for content exports (public, read-only for app) ───────────
const EXPORTS_BUCKET = process.env.SUPABASE_EXPORTS_BUCKET || 'content-exports';

// POST /api/content/publish
// Body: { subjectId: "PHYSICS" }
// Exports approved content → uploads to Supabase → updates Firestore manifest.
// Admin only.

export async function POST(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  let subjectId;
  try {
    ({ subjectId } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!subjectId) {
    return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });
  }

  try {
    await connectDB();

    // ── 1. Fetch all approved content for this subject ────────────────────────
    //
    // IMPORTANT: Only Lessons, Questions, Concepts, FeedItems, and Tags go through
    // an explicit approval workflow (status: 'approved'). Sections and Blocks are
    // "approved by association" — they belong to approved lessons and don't have
    // their own review step. Their status stays at the 'draft' default from
    // versioningFields, so filtering them by status: 'approved' drops ALL of them.
    //
    // Sections/Blocks are fetched by subjectId with status: { $ne: 'archived' }
    // so only manually-archived items are excluded.
    const [
      subject, units, lessons, sections, blocks,
      concepts, tags, feedItems, questions, exams,
    ] = await Promise.all([
      Subject.findOne({ subjectId }).lean(),
      Unit.find({ subjectId }).sort({ order: 1 }).lean(),
      Lesson.find({ subjectId, status: 'approved' }).sort({ order: 1 }).lean(),

      // ── FIX: no status: 'approved' filter — sections are approved by their lesson ──
      Section.find({ subjectId, status: { $ne: 'archived' } }).sort({ order: 1 }).lean(),

      // ── FIX: same for blocks ───────────────────────────────────────────────
      Block.find({ subjectId, status: { $ne: 'archived' } }).sort({ order: 1 }).lean(),

      Concept.find({ subjectId, status: 'approved' }).lean(),
      Tag.find({ subjectId, status: 'approved' }).lean(),
      FeedItem.find({ subjectId, status: 'approved' }).sort({ order: 1 }).lean(),
      Question.find({ subjectId, status: 'approved' }).lean(),
      Exam.find({ subjectId, status: 'approved' }).lean(),
    ]);

    if (!subject) {
      return NextResponse.json({ ok: false, error: 'المادة غير موجودة' }, { status: 404 });
    }

    if (lessons.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'لا يوجد دروس معتمدة لهذه المادة — لا يمكن النشر' },
        { status: 422 }
      );
    }

    // ── 2. Assemble BasheerExportData (mirrors /api/export shape) ────────────
    const blocksBySection   = indexBy(blocks,   'sectionContentId');
    const sectionsByLesson  = indexBy(sections, 'lessonContentId');

    // Only index sections that belong to an approved lesson (defensive filter).
    // This ensures that if a lesson was un-approved after its sections were
    // created, those orphaned sections don't sneak into a different lesson's slot.
    const approvedLessonIds = new Set(lessons.map((l) => l.contentId));
    const lessonsByUnit     = indexBy(lessons,  'unitContentId');

    const exportData = {
      version:    '2.0',
      exportedAt: new Date().toISOString(),
      subject: {
        id:       subject.subjectId,
        nameAr:   subject.nameAr,
        nameEn:   subject.nameEn   || null,
        path:     subject.path,
        isMajor:  subject.isMajor  || false,
        order:    subject.order    || 0,
        colorHex: subject.colorHex || null,
      },
      tags: tags.map((t) => ({
        id:     t.contentId,
        nameAr: t.nameAr,
        nameEn: t.nameEn || null,
      })),
      concepts: concepts.map((c) => ({
        id:              c.contentId,
        type:            c.type,
        titleAr:         c.titleAr,
        titleEn:         c.titleEn         || null,
        definition:      c.definition      || '',
        shortDefinition: c.shortDefinition || null,
        formula:         c.formula         || null,
        imageUrl:        c.imageUrl        || null,
        difficulty:      c.difficulty      || 1,
        extraData:       c.extraData       || null,
        tagIds:          c.tagIds          || [],
      })),
      units: units.map((unit) => ({
        id:          unit.contentId,
        title:       unit.title,
        order:       unit.order,
        description: unit.description || null,
        bookId:      unit.bookId      || null,
        bookTitle:   unit.bookTitle   || null,
        lessons: (lessonsByUnit[unit.contentId] || []).map((lesson) => ({
          id:               lesson.contentId,
          title:            lesson.title,
          order:            lesson.order,
          estimatedMinutes: lesson.estimatedMinutes || 15,
          summary:          lesson.summary          || null,
          metadata:         lesson.metadata         || null,
          parentLesson:     lesson.parentLesson     || null,
          variationType:    lesson.variationType    || null,
          variationNote:    lesson.variationNote    || null,
          groupId:          lesson.groupId          || null,
          groupTitle:       lesson.groupTitle       || null,
          groupMetadata:    lesson.groupMetadata    || null,
          sections: (sectionsByLesson[lesson.contentId] || [])
            // Defensive: only include sections whose lesson is approved
            .filter(() => approvedLessonIds.has(lesson.contentId))
            .map((section) => ({
              id:           section.contentId,
              title:        section.title,
              order:        section.order,
              partIndex:    section.partIndex    ?? 0,
              learningType: section.learningType || 'UNDERSTANDING',
              conceptIds:   section.conceptIds   || [],
              blocks: (blocksBySection[section.contentId] || []).map((block) => ({
                id:         block.contentId,
                type:       block.type,
                content:    block.content    || '',
                order:      block.order,
                conceptRef: block.conceptRef || null,
                caption:    block.caption    || null,
                // ── FIX: Block.metadata is Mixed (could be a JS object).
                // BlockJson.metadata on Android is String? — always stringify objects
                // so kotlinx-serialization can parse it without a type mismatch crash.
                metadata:   coerceMixedToString(block.metadata),
              })),
            })),
        })),
      })),
      questions: questions.map((q) => ({
        id:               q.contentId,
        type:             q.type,
        textAr:           q.textAr,
        textEn:           q.textEn           || null,
        correctAnswer:    q.correctAnswer,
        options:          q.options          || null,
        explanation:      q.explanation      || null,
        imageUrl:         q.imageUrl         || null,
        tableData:        q.tableData        || null,
        difficulty:       q.difficulty       || 1,
        points:           q.points           || 1,
        estimatedSeconds: q.estimatedSeconds || 60,
        cognitiveLevel:   q.cognitiveLevel   || 'RECALL',
        source:           q.source           || 'ORIGINAL',
        sourceExamId:     q.sourceExamContentId || null,
        sourceDetails:    q.sourceDetails    || null,
        sourceYear:       q.sourceYear       || null,
        feedEligible:     q.feedEligible     || false,
        unitId:           q.unitContentId    || null,
        lessonId:         q.lessonContentId  || null,
        sectionId:        q.sectionContentId || null,
        isCheckpoint:     q.isCheckpoint     || false,
        conceptIds:       q.conceptIds       || [],
        markers:          q.markers          || [],
      })),
      exams: exams.map((e) => ({
        id:           e.contentId,
        titleAr:      e.titleAr,
        titleEn:      e.titleEn      || null,
        source:       e.source,
        year:         e.year         || null,
        schoolName:   e.schoolName   || null,
        duration:     e.duration     || null,
        totalPoints:  e.totalPoints  || null,
        description:  e.description  || null,
        examType:     e.examType     || null,
        questionIds:  e.questionContentIds || [],
        sectionsJson: e.sectionsJson || null,
      })),
      feedItems: feedItems.map((item) => ({
        id:              item.contentId,
        conceptId:       item.conceptContentId,
        type:            item.type,
        contentAr:       item.contentAr       || '',
        back:            item.back            || null,
        contentEn:       item.contentEn       || null,
        imageUrl:        item.imageUrl        || null,
        interactionType: item.interactionType || null,
        correctAnswer:   item.correctAnswer   || null,
        options:         item.options         || null,
        explanation:     item.explanation     || null,
        questionId:      item.questionContentId || null,
        priority:        item.priority        || 1,
        order:           item.order           || 0,
      })),
    };

    // ── 3. Determine next version ─────────────────────────────────────────────
    const manifest      = await getManifest().catch(() => null);
    const existingEntry = (manifest?.subjects || []).find((s) => s.id === subjectId);
    const nextVersion   = String((parseInt(existingEntry?.version || '0', 10) + 1));

    // ── 4. Upload to Supabase Storage ─────────────────────────────────────────
    const fileName   = `${subjectId.toLowerCase()}_v${nextVersion}.json`;
    const jsonBuffer = Buffer.from(JSON.stringify(exportData), 'utf-8');

    await uploadFile(EXPORTS_BUCKET, fileName, jsonBuffer, 'application/json');
    const downloadUrl = getPublicUrl(EXPORTS_BUCKET, fileName);

    if (!downloadUrl) {
      return NextResponse.json(
        { ok: false, error: 'فشل الحصول على رابط التحميل من Supabase' },
        { status: 500 }
      );
    }

    // ── 5. Update Firestore manifest ──────────────────────────────────────────
    const publishedAt = new Date().toISOString();

    // Count sections and blocks for the status endpoint + dev screen comparison
    const totalSections = sections.filter((s) => approvedLessonIds.has(s.lessonContentId)).length;
    const totalBlocks   = blocks.filter((b) => {
      // Block belongs to a section that belongs to an approved lesson
      const section = sections.find((s) => s.contentId === b.sectionContentId);
      return section && approvedLessonIds.has(section.lessonContentId);
    }).length;

    await upsertSubjectEntry({
      id:                   subjectId,
      version:              nextVersion,
      downloadUrl,
      enabled:              true,
      minAppVersion:        '1.0',
      updatedAt:            publishedAt,
      // Snapshot counts — shown in the dev SyncStatus screen for comparison
      approvedLessonsCount: lessons.length,
      approvedSectionsCount: totalSections,
      approvedBlocksCount:   totalBlocks,
    });

    // ── 6. Return summary ─────────────────────────────────────────────────────
    return NextResponse.json({
      ok: true,
      subjectId,
      version:     nextVersion,
      downloadUrl,
      publishedAt,
      stats: {
        lessons:   lessons.length,
        sections:  totalSections,
        blocks:    totalBlocks,
        questions: questions.length,
        feedItems: feedItems.length,
        concepts:  concepts.length,
        exams:     exams.length,
      },
    });
  } catch (e) {
    console.error('[POST /api/content/publish]', e);
    return NextResponse.json({ ok: false, error: e.message || 'خطأ في الخادم' }, { status: 500 });
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Group an array of objects by a key into a map of arrays. */
function indexBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (k) { if (!acc[k]) acc[k] = []; acc[k].push(item); }
    return acc;
  }, {});
}

/**
 * Coerce a Mongoose Mixed value to String | null so the Android BlockJson
 * field (String?) can always parse it without a type mismatch crash.
 *
 * - null / undefined → null
 * - already a string → pass through
 * - object / array   → JSON.stringify (BlockEntity stores it as a JSON string)
 */
function coerceMixedToString(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}