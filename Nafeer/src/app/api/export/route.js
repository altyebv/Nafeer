import { requireSubjectAccess, ok, err } from '@/lib/api/guard';
import { connectDB } from '@/lib/db';
import { Subject } from '@/lib/models/Subject';
import { Unit } from '@/lib/models/Unit';
import { Lesson } from '@/lib/models/Lesson';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { Concept } from '@/lib/models/Concept';
import { Tag } from '@/lib/models/Tag';
import { FeedItem } from '@/lib/models/FeedItem';
import { Question } from '@/lib/models/Question';
import { Exam } from '@/lib/models/Exam';
import { getManifest } from '@/lib/FirebaseAdmin';

// GET /api/export?subjectId=PHYSICS[&includeAll=true]
//
// Returns the full BasheerExportData JSON for a subject.
// By default: only approved content.
// includeAll=true: includes drafts too (for preview/dev purposes - admin only).
//
// This endpoint now mirrors publish semantics:
// - lessons/concepts/feed/questions/exams/tags follow status filtering
// - sections/blocks are approved by association and exclude only archived docs
//
export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    const subjectId = params.get('subjectId');
    const includeAll = params.get('includeAll') === 'true';

    if (!subjectId) return err('subjectId مطلوب');

    const user = await requireSubjectAccess(subjectId);
    const canIncludeAll = includeAll && user.role === 'admin';

    await connectDB();

    const contentStatusFilter = canIncludeAll ? {} : { status: 'approved' };
    const manifest = await getManifest().catch(() => null);
    const manifestEntry = (manifest?.subjects || []).find((entry) => entry.id === subjectId) || null;

    const [
      subject,
      units,
      lessons,
      sections,
      blocks,
      concepts,
      tags,
      feedItems,
      questions,
      exams,
    ] = await Promise.all([
      Subject.findOne({ subjectId }).lean(),
      Unit.find({ subjectId }).sort({ order: 1 }).lean(),
      Lesson.find({ subjectId, ...contentStatusFilter }).sort({ order: 1 }).lean(),
      Section.find({ subjectId, status: { $ne: 'archived' } }).sort({ order: 1 }).lean(),
      Block.find({ subjectId, status: { $ne: 'archived' } }).sort({ order: 1 }).lean(),
      Concept.find({ subjectId, ...contentStatusFilter }).lean(),
      Tag.find({ subjectId, ...contentStatusFilter }).lean(),
      FeedItem.find({ subjectId, ...contentStatusFilter }).sort({ order: 1 }).lean(),
      Question.find({ subjectId, ...contentStatusFilter }).lean(),
      Exam.find({ subjectId, ...contentStatusFilter }).lean(),
    ]);

    if (!subject) {
      const remoteData = await loadRemoteSubjectExport(manifestEntry?.downloadUrl);
      if (remoteData) return ok(remoteData, { origin: 'remote' });
      return err('المادة غير موجودة في قاعدة البيانات', 404);
    }

    const approvedLessonIds = new Set(lessons.map((lesson) => lesson.contentId));

    const scopedSections = sections.filter((section) => {
      if (canIncludeAll) return true;
      return approvedLessonIds.has(section.lessonContentId);
    });

    const scopedSectionIds = new Set(scopedSections.map((section) => section.contentId));
    const scopedBlocks = blocks.filter((block) => scopedSectionIds.has(block.sectionContentId));

    const blocksBySection = scopedBlocks.reduce((acc, block) => {
      if (!acc[block.sectionContentId]) acc[block.sectionContentId] = [];
      acc[block.sectionContentId].push(block);
      return acc;
    }, {});

    const sectionsByLesson = scopedSections.reduce((acc, section) => {
      if (!acc[section.lessonContentId]) acc[section.lessonContentId] = [];
      acc[section.lessonContentId].push(section);
      return acc;
    }, {});

    const lessonsByUnit = lessons.reduce((acc, lesson) => {
      if (!acc[lesson.unitContentId]) acc[lesson.unitContentId] = [];
      acc[lesson.unitContentId].push(lesson);
      return acc;
    }, {});

    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      subject: {
        id: subject.subjectId,
        nameAr: subject.nameAr,
        nameEn: subject.nameEn || null,
        path: subject.path,
        isMajor: subject.isMajor || false,
        order: subject.order || 0,
        colorHex: subject.colorHex || null,
      },
      tags: tags.map((tag) => ({
        id: tag.contentId,
        nameAr: tag.nameAr,
        nameEn: tag.nameEn || null,
        status: tag.status || 'draft',
      })),
      concepts: concepts.map((concept) => ({
        id: concept.contentId,
        type: concept.type,
        titleAr: concept.titleAr,
        titleEn: concept.titleEn || null,
        definition: concept.definition || '',
        shortDefinition: concept.shortDefinition || null,
        formula: concept.formula || null,
        imageUrl: concept.imageUrl || null,
        difficulty: concept.difficulty || 1,
        extraData: concept.extraData || null,
        tagIds: concept.tagIds || [],
        status: concept.status || 'draft',
      })),
      units: units.map((unit) => ({
        id: unit.contentId,
        title: unit.title,
        order: unit.order,
        description: unit.description || null,
        bookId: unit.bookId || null,
        bookTitle: unit.bookTitle || null,
        lessons: (lessonsByUnit[unit.contentId] || []).map((lesson) => ({
          id: lesson.contentId,
          metadata: lesson.metadata || null,
          title: lesson.title,
          order: lesson.order,
          estimatedMinutes: lesson.estimatedMinutes || 15,
          summary: lesson.summary || null,
          parentLesson: lesson.parentLesson || null,
          variationType: lesson.variationType || null,
          variationNote: lesson.variationNote || null,
          groupId: lesson.groupId || null,
          groupTitle: lesson.groupTitle || null,
          groupMetadata: lesson.groupMetadata || null,
          status: lesson.status || 'draft',
          sections: (sectionsByLesson[lesson.contentId] || []).map((section) => ({
            id: section.contentId,
            title: section.title,
            order: section.order,
            partIndex: section.partIndex ?? 0,
            learningType: section.learningType || 'UNDERSTANDING',
            conceptIds: section.conceptIds || [],
            status: section.status || 'draft',
            blocks: (blocksBySection[section.contentId] || []).map((block) => ({
              id: block.contentId,
              type: block.type,
              content: block.content || '',
              order: block.order,
              conceptRef: block.conceptRef || null,
              caption: block.caption || null,
              metadata: block.metadata || null,
              status: block.status || 'draft',
            })),
          })),
        })),
      })),
      questions: questions.map((question) => ({
        id: question.contentId,
        type: question.type,
        textAr: question.textAr,
        textEn: question.textEn || null,
        correctAnswer: question.correctAnswer,
        options: question.options || null,
        explanation: question.explanation || null,
        imageUrl: question.imageUrl || null,
        tableData: question.tableData || null,
        difficulty: question.difficulty || 1,
        points: question.points || 1,
        estimatedSeconds: question.estimatedSeconds || 60,
        cognitiveLevel: question.cognitiveLevel || 'RECALL',
        source: question.source || 'ORIGINAL',
        sourceExamId: question.sourceExamContentId || null,
        sourceDetails: question.sourceDetails || null,
        sourceYear: question.sourceYear || null,
        feedEligible: question.feedEligible || false,
        unitId: question.unitContentId || null,
        lessonId: question.lessonContentId || null,
        sectionId: question.sectionContentId || null,
        isCheckpoint: question.isCheckpoint || false,
        conceptIds: question.conceptIds || [],
        markers: question.markers || [],
        status: question.status || 'draft',
      })),
      exams: exams.map((exam) => ({
        id: exam.contentId,
        titleAr: exam.titleAr,
        titleEn: exam.titleEn || null,
        source: exam.source,
        year: exam.year || null,
        schoolName: exam.schoolName || null,
        duration: exam.duration || null,
        totalPoints: exam.totalPoints || null,
        description: exam.description || null,
        examType: exam.examType || null,
        questionIds: exam.questionContentIds || [],
        sectionsJson: exam.sectionsJson || null,
        status: exam.status || 'draft',
      })),
      feedItems: feedItems.map((item) => ({
        id: item.contentId,
        conceptId: item.conceptContentId,
        type: item.type,
        contentAr: item.contentAr || '',
        back: item.back || null,
        contentEn: item.contentEn || null,
        imageUrl: item.imageUrl || null,
        interactionType: item.interactionType || null,
        correctAnswer: item.correctAnswer || null,
        options: item.options || null,
        explanation: item.explanation || null,
        questionId: item.questionContentId || null,
        priority: item.priority || 1,
        order: item.order || 0,
        lessonId: item.lessonContentId || null,
        unitId: item.unitContentId || null,
        status: item.status || 'draft',
      })),
    };

    if (
      !canIncludeAll &&
      manifestEntry?.downloadUrl &&
      lessons.length === 0 &&
      concepts.length === 0 &&
      feedItems.length === 0 &&
      questions.length === 0
    ) {
      const remoteData = await loadRemoteSubjectExport(manifestEntry.downloadUrl);
      if (remoteData) return ok(remoteData, { origin: 'remote' });
    }

    return ok(exportData, { origin: 'atlas' });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/export]', e);
    return err('خطأ في الخادم', 500);
  }
}

async function loadRemoteSubjectExport(downloadUrl) {
  if (!downloadUrl) return null;

  try {
    const res = await fetch(downloadUrl, { cache: 'no-store' });
    if (!res.ok) return null;

    const data = await res.json();
    return data && typeof data === 'object' ? data : null;
  } catch (e) {
    console.warn('[GET /api/export] remote fallback failed:', e.message);
    return null;
  }
}
