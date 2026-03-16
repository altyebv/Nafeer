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

// GET /api/export?subjectId=PHYSICS[&includeAll=true]
//
// Returns the full BasheerExportData JSON for a subject.
// By default: only 'approved' content.
// includeAll=true: includes drafts too (for preview/dev purposes — admin only).
//
// This is the same shape as the old exportData() from dataStore.js,
// ensuring Android compatibility.
//
export async function GET(request) {
  try {
    const params    = new URL(request.url).searchParams;
    const subjectId = params.get('subjectId');
    const includeAll = params.get('includeAll') === 'true';

    if (!subjectId) return err('subjectId مطلوب');

    const user = await requireSubjectAccess(subjectId);

    // Only admins can export all statuses
    const statusFilter = includeAll && user.role === 'admin'
      ? {}
      : { status: 'approved' };

    await connectDB();

    // Fetch everything in parallel
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
      Lesson.find({ subjectId, ...statusFilter }).sort({ order: 1 }).lean(),
      Section.find({ subjectId, ...statusFilter }).sort({ order: 1 }).lean(),
      Block.find({ subjectId, ...statusFilter }).sort({ order: 1 }).lean(),
      Concept.find({ subjectId, ...statusFilter }).lean(),
      Tag.find({ subjectId }).lean(),
      FeedItem.find({ subjectId, ...statusFilter }).sort({ order: 1 }).lean(),
      Question.find({ subjectId, ...statusFilter }).lean(),
      Exam.find({ subjectId, ...statusFilter }).lean(),
    ]);

    if (!subject) return err('المادة غير موجودة في قاعدة البيانات', 404);

    // ── Assemble nested structure (matching old exportData() shape) ────────

    const blocksBySection = blocks.reduce((acc, b) => {
      if (!acc[b.sectionContentId]) acc[b.sectionContentId] = [];
      acc[b.sectionContentId].push(b);
      return acc;
    }, {});

    const sectionsByLesson = sections.reduce((acc, s) => {
      if (!acc[s.lessonContentId]) acc[s.lessonContentId] = [];
      acc[s.lessonContentId].push(s);
      return acc;
    }, {});

    const lessonsByUnit = lessons.reduce((acc, l) => {
      if (!acc[l.unitContentId]) acc[l.unitContentId] = [];
      acc[l.unitContentId].push(l);
      return acc;
    }, {});

    const exportData = {
      version:    '2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
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
        lessons: (lessonsByUnit[unit.contentId] || []).map((lesson) => ({
          id:               lesson.contentId,
          title:            lesson.title,
          order:            lesson.order,
          estimatedMinutes: lesson.estimatedMinutes || 15,
          summary:          lesson.summary          || null,
          sections: (sectionsByLesson[lesson.contentId] || []).map((section) => ({
            id:           section.contentId,
            title:        section.title,
            order:        section.order,
            learningType: section.learningType || 'UNDERSTANDING',
            conceptIds:   section.conceptIds   || [],
            blocks: (blocksBySection[section.contentId] || []).map((block) => ({
              id:         block.contentId,
              type:       block.type,
              content:    block.content    || '',
              order:      block.order,
              conceptRef: block.conceptRef || null,
              caption:    block.caption    || null,
              metadata:   block.metadata   || null,
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

    return ok(exportData);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/export]', e);
    return err('خطأ في الخادم', 500);
  }
}