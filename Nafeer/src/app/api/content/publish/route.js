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
import { getManifest, upsertDeltaSubjectEntry } from '@/lib/FirebaseAdmin';
import { buildAndUploadDelta }    from '@/lib/deltaEngine';
import crypto from 'crypto';

const EXPORTS_BUCKET = process.env.SUPABASE_EXPORTS_BUCKET || 'content-exports';

// ── POST /api/content/publish ─────────────────────────────────────────────────
//
// Body: { subjectId: "PHYSICS", mode?: "delta" | "full", bump?: "major" }
//
// mode    — defaults to "delta". Pass "full" to force a full re-export
//           (migration baseline or manifest recovery).
//
// bump    — omit for a normal patch publish (auto-increments MAJOR.patch).
//           Pass "major" to cut a named release: increments MAJOR, resets patch
//           to 0. Ignored when mode is "full" (full always resets patch to 0).
//
// ── Version scheme: MAJOR.patch ──────────────────────────────────────────────
//
//   contentVersion is a human-readable "MAJOR.patch" string, e.g. "1.3".
//
//   patch  — auto-increments when delta produces real bundles (content changed).
//            Stays the same when nothing changed → no-op publish → no Firestore write.
//   MAJOR  — manually bumped via bump:"major". Signals a significant release
//            (new unit live, curriculum restructure, etc). Resets patch to 0.
//
//   A full publish always resets patch to 0: "MAJOR.0".
//
// Admin only.

export async function POST(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  let subjectId, mode, bump;
  try {
    ({ subjectId, mode = 'delta', bump = null } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!subjectId) {
    return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });
  }
  if (!['delta', 'full'].includes(mode)) {
    return NextResponse.json({ ok: false, error: 'mode must be "delta" or "full"' }, { status: 400 });
  }
  if (bump != null && bump !== 'major') {
    return NextResponse.json({ ok: false, error: 'bump must be "major" or omitted' }, { status: 400 });
  }

  try {
    await connectDB();

    // ── 1. Fetch all approved content for this subject ────────────────────────
    const [
      subject, units, lessons, sections, blocks,
      concepts, tags, feedItems, questions, exams,
    ] = await Promise.all([
      Subject.findOne({ subjectId }).lean(),
      Unit.find({ subjectId }).sort({ order: 1 }).lean(),
      Lesson.find({ subjectId, status: 'approved' }).sort({ order: 1 }).lean(),
      Section.find({ subjectId, status: { $ne: 'archived' } }).sort({ order: 1 }).lean(),
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

    // ── 2. Get current manifest entry ─────────────────────────────────────────
    const manifest  = await getManifest().catch(() => null);
    const prevEntry = (manifest?.subjects || []).find((s) => s.id === subjectId) || null;

    // Parse the previous MAJOR.patch version (also handles legacy integer strings)
    const prevContentVersion = prevEntry?.contentVersion || prevEntry?.version || null;
    const { major: prevMajor, patch: prevPatch } = parseVersion(prevContentVersion);
    const publishedAt = new Date().toISOString();
    // contentVersion is computed after the delta runs — only bump when bundles exist.
    // For full publish it is computed here since there is no delta step.
    const fullContentVersion = mode === 'full'
      ? bump === 'major'
        ? `${prevMajor + 1}.0`
        : `${prevMajor}.0`       // full publish always resets patch
      : null;                    // delta path defers version computation

    // ── 3. Build export DTOs (shared by both paths) ───────────────────────────
    const approvedLessonIds = new Set(lessons.map((l) => l.contentId));
    const blocksBySection   = indexBy(blocks,   'sectionContentId');
    const sectionsByLesson  = indexBy(sections, 'lessonContentId');
    const lessonsByUnit     = indexBy(lessons,  'unitContentId');

    // ── Subject
    const subjectExport = {
      id:       subject.subjectId,
      nameAr:   subject.nameAr,
      nameEn:   subject.nameEn   || null,
      path:     subject.path,
      isMajor:  subject.isMajor  || false,
      order:    subject.order    || 0,
      colorHex: subject.colorHex || null,
      iconRes:  subject.iconUrl  || null,
    };

    // ── Tags
    const tagsExport = tags.map((t) => ({
      id:     t.contentId,
      nameAr: t.nameAr,
      nameEn: t.nameEn || null,
    }));

    // ── Concepts
    const conceptsExport = concepts.map((c) => ({
      id:              c.contentId,
      type:            c.type,
      titleAr:         c.titleAr,
      titleEn:         c.titleEn         || null,
      definition:      c.definition      || '',
      shortDefinition: c.shortDefinition || null,
      formula:         c.formula         || null,
      imageUrl:        c.imageUrl        || null,
      difficulty:      c.difficulty      || 1,
      extraData:       coerceMixedToString(c.extraData),
      tagIds:          c.tagIds          || [],
    }));

    // ── Units (flat — no nested lessons; delta patches deliver lessons separately)
    const unitsExport = units.map((unit) => ({
      id:          unit.contentId,
      title:       unit.title,
      order:       unit.order,
      description: unit.description || null,
      bookId:      unit.bookId      || null,
      bookTitle:   unit.bookTitle   || null,
    }));

    // ── Lessons (flat — carry unitId FK for delta path)
    const lessonsExport = lessons.map((lesson) => ({
      id:               lesson.contentId,
      unitId:           lesson.unitContentId,       // FK for delta patches
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
    }));

    // ── Sections (flat — carry lessonId FK)
    const sectionsExport = sections
      .filter((s) => approvedLessonIds.has(s.lessonContentId))
      .map((section) => ({
        id:           section.contentId,
        lessonId:     section.lessonContentId,      // FK for delta patches
        title:        section.title,
        order:        section.order,
        partIndex:    section.partIndex    ?? 0,
        learningType: section.learningType || 'UNDERSTANDING',
        conceptIds:   section.conceptIds   || [],
      }));

    // ── Blocks (flat — carry sectionId FK)
    const approvedSectionIds = new Set(sectionsExport.map((s) => s.id));
    const blocksExport = blocks
      .filter((b) => approvedSectionIds.has(b.sectionContentId))
      .map((block) => ({
        id:         block.contentId,
        sectionId:  block.sectionContentId,          // FK for delta patches
        type:       block.type,
        content:    block.content    || '',
        order:      block.order,
        conceptRef: block.conceptRef || null,
        caption:    block.caption    || null,
        metadata:   coerceMixedToString(block.metadata),
        mediaPath:  block.mediaPath  || null,
      }));

    // ── Questions
    const questionsExport = questions.map((q) => ({
      id:               q.contentId,
      type:             q.type,
      textAr:           q.textAr,
      textEn:           q.textEn           || null,
      correctAnswer:    q.correctAnswer,
      options:          coerceMixedToString(q.options),
      explanation:      q.explanation      || null,
      imageUrl:         q.imageUrl         || null,
      tableData:        coerceMixedToString(q.tableData),
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
    }));

    // ── Exams
    const examsExport = exams.map((e) => ({
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
      sectionsJson: coerceMixedToString(e.sectionsJson),
    }));

    // ── Feed items
    const feedItemsExport = feedItems.map((item) => ({
      id:              item.contentId,
      conceptId:       item.conceptContentId,
      type:            item.type,
      contentAr:       item.contentAr       || '',
      back:            item.back            || null,
      contentEn:       item.contentEn       || null,
      imageUrl:        item.imageUrl        || null,
      interactionType: item.interactionType || null,
      correctAnswer:   item.correctAnswer   || null,
      options:         coerceMixedToString(item.options),
      explanation:     item.explanation     || null,
      questionId:      item.questionContentId || null,
      priority:        item.priority        || 1,
      order:           item.order           || 0,
      lessonId:        item.lessonContentId || null,   
      unitId:          item.unitContentId   || null,   
    }));

    // ── Stat counters (shared by both paths) ──────────────────────────────────
    const totalSections = sectionsExport.length;
    const totalBlocks   = blocksExport.length;

    // ── Dispatch to delta or full path ────────────────────────────────────────
    if (mode === 'delta') {
      return await handleDeltaPublish({
        subjectId,
        prevMajor,
        prevPatch,
        bump,
        publishedAt,
        prevEntry,
        snapshot: {
          subject,
          subjectExport,
          tags,       tagsExport,
          concepts,   conceptsExport,
          units,      unitsExport,
          lessons,    lessonsExport,
          sections,   sectionsExport,
          blocks,     blocksExport,
          questions,  questionsExport,
          exams,      examsExport,
          feedItems,  feedItemsExport,
          
        },
        stats: {
          lessons:   lessons.length,
          sections:  totalSections,
          blocks:    totalBlocks,
          questions: questions.length,
          feedItems: feedItems.length,
          concepts:  concepts.length,
          exams:     exams.length,
        },
        // Also assemble the full export for legacy fields (in case we need to
        // keep legacyDownloadUrl alive while some app versions are still on v2)
        legacyEntry: prevEntry?.legacyDownloadUrl
          ? {
              downloadUrl: prevEntry.legacyDownloadUrl,
              sha256:      prevEntry.legacySha256,
              size:        prevEntry.legacySize,
            }
          : null,
      });
    } else {
      return await handleFullPublish({
        subjectId,
        contentVersion: fullContentVersion,
        publishedAt,
        prevEntry,
        exportData: assembleFullExport({
          subjectExport, tagsExport, conceptsExport,
          unitsExport, lessonsExport: lessons, // full export uses nested shape
          sectionsExport: sections, blocksExport: blocks,
          questionsExport, examsExport, feedItemsExport,
          lessonsByUnit, sectionsByLesson, blocksBySection,
          approvedLessonIds,
        }),
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
    }

  } catch (e) {
    console.error('[POST /api/content/publish]', e);
    return NextResponse.json({ ok: false, error: e.message || 'خطأ في الخادم' }, { status: 500 });
  }
}

// ── Delta publish path ────────────────────────────────────────────────────────

async function handleDeltaPublish({
  subjectId, prevMajor, prevPatch, bump, publishedAt, prevEntry,
  snapshot, stats, legacyEntry,
}) {
  const { entityIndex, patches, deletedByType, stats: deltaStats } =
    await buildAndUploadDelta({
      subjectId,
      exportVersion: '1.0',
      snapshot,
      prevEntry,
    });

  // ── No-op guard ────────────────────────────────────────────────────────────
  // If the delta engine found nothing changed, skip the Firestore write entirely.
  // contentVersion stays the same — Android sees no change and skips the sync.
  if (deltaStats.bundlesUploaded === 0 && deltaStats.deletedEntities === 0) {
    const currentVersion = prevEntry?.contentVersion || prevEntry?.version || `${prevMajor}.0`;
    return NextResponse.json({
      ok: true,
      mode: 'delta',
      subjectId,
      contentVersion: currentVersion,
      publishedAt: prevEntry?.updatedAt || publishedAt,
      noChange: true,
      delta: { bundlesUploaded: 0, changedEntities: 0, deletedEntities: 0 },
      stats,
    });
  }

  // ── Compute new version ────────────────────────────────────────────────────
  // bump:"major" → increment MAJOR, reset patch to 0.
  // normal delta  → keep MAJOR, increment patch.
  const contentVersion = bump === 'major'
    ? `${prevMajor + 1}.0`
    : `${prevMajor}.${prevPatch + 1}`;

  await upsertDeltaSubjectEntry({
    subjectId,
    contentVersion,
    updatedAt:             publishedAt,
    enabled:               prevEntry?.enabled ?? true,
    minAppVersion:         prevEntry?.minAppVersion || '1.0',
    entityIndex,
    patches,
    approvedLessonsCount:  stats.lessons,
    approvedSectionsCount: stats.sections,
    approvedBlocksCount:   stats.blocks,
    legacyDownloadUrl:     legacyEntry?.downloadUrl || null,
    legacySha256:          legacyEntry?.sha256       || null,
    legacySize:            legacyEntry?.size         || null,
  });

  return NextResponse.json({
    ok: true,
    mode: 'delta',
    subjectId,
    contentVersion,
    publishedAt,
    delta: {
      bundlesUploaded:  deltaStats.bundlesUploaded,
      changedEntities:  deltaStats.changedEntities,
      deletedEntities:  deltaStats.deletedEntities,
      deletedByType,
    },
    stats,
  });
}

// ── Full (legacy) publish path ────────────────────────────────────────────────

async function handleFullPublish({
  subjectId, contentVersion, publishedAt, prevEntry,
  exportData, stats,
}) {
  const fileName   = `${subjectId.toLowerCase()}_v${contentVersion}.json`;
  const jsonBuffer = Buffer.from(JSON.stringify(exportData), 'utf-8');
  const sha256     = crypto.createHash('sha256').update(jsonBuffer).digest('hex');
  const size       = jsonBuffer.length;

  await uploadFile(EXPORTS_BUCKET, fileName, jsonBuffer, 'application/json');
  const downloadUrl = getPublicUrl(EXPORTS_BUCKET, fileName);

  if (!downloadUrl) {
    return NextResponse.json(
      { ok: false, error: 'فشل الحصول على رابط التحميل من Supabase' },
      { status: 500 }
    );
  }

  // Write as legacy entry (no entityIndex / patches) so old app builds keep working.
  // Also sets contentVersion so the v3 app can do a coarse guard.
  await upsertDeltaSubjectEntry({
    subjectId,
    contentVersion,
    updatedAt:             publishedAt,
    enabled:               prevEntry?.enabled ?? true,
    minAppVersion:         prevEntry?.minAppVersion || '1.0',
    entityIndex:           null,   // null → Android takes legacy path
    patches:               [],
    approvedLessonsCount:  stats.lessons,
    approvedSectionsCount: stats.sections,
    approvedBlocksCount:   stats.blocks,
    legacyDownloadUrl:     downloadUrl,
    legacySha256:          sha256,
    legacySize:            size,
  });

  return NextResponse.json({
    ok: true,
    mode: 'full',
    subjectId,
    contentVersion,
    downloadUrl,
    publishedAt,
    stats,
  });
}

// ── Full export assembler (legacy nested shape for mode:"full") ───────────────

function assembleFullExport({
  subjectExport, tagsExport, conceptsExport,
  unitsExport, lessonsExport, sectionsExport, blocksExport,
  questionsExport, examsExport, feedItemsExport,
  lessonsByUnit, sectionsByLesson, blocksBySection,
  approvedLessonIds,
}) {
  return {
    version:    '2.0',
    exportedAt: new Date().toISOString(),
    subject:    subjectExport,
    tags:       tagsExport,
    concepts:   conceptsExport,
    units: unitsExport.map((unit) => ({
      ...unit,
      lessons: (lessonsByUnit[unit.id] || []).map((lesson) => ({
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
              metadata:   coerceMixedToString(block.metadata),
              mediaPath:  block.mediaPath  || null,
            })),
          })),
      })),
    })),
    questions: questionsExport,
    exams:     examsExport,
    feedItems: feedItemsExport,
  };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Parse a "MAJOR.patch" version string into its components.
 * Also handles legacy bare-integer strings ("47" → major:47, patch:0).
 * Returns { major: number, patch: number }.
 */
function parseVersion(v) {
  if (!v) return { major: 1, patch: 0 };
  const str = String(v);
  const dot = str.indexOf('.');
  if (dot === -1) {
    // Legacy integer — treat as MAJOR.0 so next publish is MAJOR.1
    const n = parseInt(str, 10);
    return { major: isNaN(n) ? 1 : n, patch: 0 };
  }
  const major = parseInt(str.slice(0, dot), 10);
  const patch = parseInt(str.slice(dot + 1), 10);
  return {
    major: isNaN(major) ? 1 : major,
    patch: isNaN(patch) ? 0 : patch,
  };
}

function indexBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (k) { if (!acc[k]) acc[k] = []; acc[k].push(item); }
    return acc;
  }, {});
}

function coerceMixedToString(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}