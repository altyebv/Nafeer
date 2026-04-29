/**
 * STORE INDEX
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exports all domain stores.
 * Also provides the composite `useDataStore` hook for backward compatibility.
 */

export { useEditorStore }  from './editorStore';
export { useSubjectStore } from './subjectStore';
export { useContentStore } from './contentStore';
export { useConceptStore } from './conceptStore';
export { useFeedStore }    from './feedStore';
export { useQuizStore }    from './quizStore';
export { useMediaStore }   from './mediaStore';

import { useSubjectStore } from './subjectStore';
import { useContentStore } from './contentStore';
import { useConceptStore } from './conceptStore';
import { useFeedStore }    from './feedStore';
import { useQuizStore }    from './quizStore';

// ─── useDataStore ─────────────────────────────────────────────────────────────
// Composite hook. Merges all domain stores. Backward compat for existing components.
// New components should import from individual stores.
export function useDataStore(selector) {
  const subject  = useSubjectStore();
  const content  = useContentStore();
  const concepts = useConceptStore();
  const feed     = useFeedStore();
  const quiz     = useQuizStore();

  const merged = {
    // ── Data ────────────────────────────────────────────────────────────────
    subject:   subject.subject,
    units:     subject.units,
    lessons:   subject.lessons,
    sections:  content.sections,
    blocks:    content.blocks,
    concepts:  concepts.concepts,
    tags:      concepts.tags,
    feedItems: feed.feedItems,
    questions: quiz.questions,
    exams:     quiz.exams,

    // ── Subject ─────────────────────────────────────────────────────────────
    setSubject:  subject.setSubject,
    addUnit:     subject.addUnit,
    updateUnit:  subject.updateUnit,
    deleteUnit:  (id) => {
      const lessonIds  = subject.lessons.filter((l) => l.unitId === id).map((l) => l.id);
      const sectionIds = content.sections.filter((s) => lessonIds.includes(s.lessonId)).map((s) => s.id);
      subject.deleteUnit(id);
      content.deleteLessonContent(null, sectionIds);
    },
    addLesson:    subject.addLesson,
    updateLesson: subject.updateLesson,
    deleteLesson: (id) => {
      const sectionIds = content.sections.filter((s) => s.lessonId === id).map((s) => s.id);
      subject.deleteLesson(id);
      content.deleteLessonContent(id, sectionIds);
    },
    bootstrapFromSubject: subject.bootstrapFromSubject,
    loadFromAtlas:        subject.loadFromAtlas,

    // ── Content ──────────────────────────────────────────────────────────────
    addSection:               content.addSection,
    updateSection:            content.updateSection,
    deleteSection:            content.deleteSection,
    linkConceptToSection:     content.linkConceptToSection,
    unlinkConceptFromSection: content.unlinkConceptFromSection,
    addBlock:                 content.addBlock,
    updateBlock:              content.updateBlock,
    deleteBlock:              content.deleteBlock,
    // Alias so AdminEditorWorkspace can call loadContent({ sections, blocks })
    loadContent: content.loadLessonContent,

    // ── Concepts ─────────────────────────────────────────────────────────────
    addConcept:    concepts.addConcept,
    updateConcept: concepts.updateConcept,
    deleteConcept: (id) => {
      concepts.deleteConcept(id);
      content.sections.forEach((s) => {
        if ((s.conceptIds || []).includes(id)) {
          content.unlinkConceptFromSection(s.id, id);
        }
      });
    },
    linkTagToConcept:     concepts.linkTagToConcept,
    unlinkTagFromConcept: concepts.unlinkTagFromConcept,
    addTag:               concepts.addTag,
    updateTag:            concepts.updateTag,
    deleteTag:            concepts.deleteTag,

    // ── Feed ─────────────────────────────────────────────────────────────────
    addFeedItem:    feed.addFeedItem,
    updateFeedItem: feed.updateFeedItem,
    deleteFeedItem: feed.deleteFeedItem,
    // Bulk loader — replaces all feed items atomically (used by AdminEditorWorkspace)
    loadFeedItems:  feed.loadFeedItems,

    // ── Quiz ─────────────────────────────────────────────────────────────────
    addQuestion:               quiz.addQuestion,
    updateQuestion:            quiz.updateQuestion,
    deleteQuestion:            quiz.deleteQuestion,
    linkConceptToQuestion:     quiz.linkConceptToQuestion,
    unlinkConceptFromQuestion: quiz.unlinkConceptFromQuestion,
    addExam:                   quiz.addExam,
    updateExam:                quiz.updateExam,
    deleteExam:                quiz.deleteExam,
    addQuestionToExam:         quiz.addQuestionToExam,
    removeQuestionFromExam:    quiz.removeQuestionFromExam,
    // Bulk loaders
    loadQuestions: quiz.loadQuestions,
    loadExams:     quiz.loadExams,

    // ── Reset helpers ─────────────────────────────────────────────────────────
    resetSubject:  subject.resetSubject,
    resetContent:  content.resetContent,
    resetConcepts: concepts.resetConcepts,
    resetFeed:     feed.resetFeed,
    resetQuiz:     quiz.resetQuiz,

    // ── Export / Import ───────────────────────────────────────────────────────
    exportData: () => assembleExportData(merged),

    // Full workspace load — called by AdminEditorWorkspace after fetching /api/export.
    // Uses bulk loaders so each store is replaced atomically (no duplicate-add risk).
    importData: (data) => {
      const units = [], lessons = [], sections = [], blocks = [];

      (data.units || []).forEach((unit) => {
        const { lessons: ul, ...ud } = unit;
        units.push(ud);
        (ul || []).forEach((lesson) => {
          const { sections: ls, status: lessonStatus, ...ld } = lesson;
          lessons.push({ ...ld, unitId: unit.id, atlasStatus: lessonStatus || ld.atlasStatus || 'draft' });
          (ls || []).forEach((section) => {
            const { blocks: sb, ...sd } = section;
            sections.push({ ...sd, lessonId: lesson.id });
            (sb || []).forEach((block) => blocks.push({ ...block, sectionId: section.id }));
          });
        });
      });

      subject.loadFromAtlas({ subject: data.subject || null, units, lessons });
      content.loadLessonContent({ sections, blocks });

      // Concepts + tags — no bulk loader needed (small sets, addConcept is idempotent now)
      concepts.resetConcepts();
      (data.concepts || []).forEach((c) => concepts.addConcept({ ...c, atlasStatus: c.status || c.atlasStatus || 'draft' }));
      (data.tags     || []).forEach((t) => concepts.addTag(t));

      // Feed items — use bulk loader to avoid order miscalculation from addFeedItem
      feed.loadFeedItems(
        (data.feedItems || []).map((f) => ({
          ...f,
          atlasStatus: f.status || f.atlasStatus || 'draft',
          // Remap Atlas DB field names → local store field names
          conceptId:  f.conceptId  || f.conceptContentId  || null,
          lessonId:   f.lessonId   || f.lessonContentId   || null,
          unitId:     f.unitId     || f.unitContentId      || null,
          questionId: f.questionId || f.questionContentId  || null,
        }))
      );

      // Questions + exams — use bulk loaders
      quiz.loadQuestions(
        (data.questions || []).map((q) => ({
          ...q,
          atlasStatus: q.status || q.atlasStatus || 'draft',
          markers:     q.markers || [],
          // Remap Atlas DB field names → local store field names
          // (mirrors the same pattern used for feed items above)
          lessonId:  q.lessonId  || q.lessonContentId  || null,
          unitId:    q.unitId    || q.unitContentId    || null,
          sectionId: q.sectionId || q.sectionContentId || null,
        }))
      );
      quiz.loadExams(
        (data.exams || []).map((e) => ({
          ...e,
          atlasStatus: e.status || e.atlasStatus || 'draft',
        }))
      );
    },

    resetAll: () => {
      subject.resetSubject();
      content.resetContent();
      concepts.resetConcepts();
      feed.resetFeed();
      quiz.resetQuiz();
    },
  };

  return selector ? selector(merged) : merged;
}

// ─── assembleExportData ───────────────────────────────────────────────────────
function assembleExportData(s) {
  return {
    version: '2.0',
    subject: s.subject ? {
      id: s.subject.id, nameAr: s.subject.nameAr, nameEn: s.subject.nameEn || null,
      path: s.subject.path, isMajor: s.subject.isMajor || false,
      order: s.subject.order || 0, colorHex: s.subject.colorHex || null,
    } : null,
    tags:     s.tags.map((t) => ({ id: t.id, nameAr: t.nameAr, nameEn: t.nameEn || null })),
    concepts: s.concepts.map((c) => ({
      id: c.id, type: c.type, titleAr: c.titleAr, titleEn: c.titleEn || null,
      definition: c.definition || '', shortDefinition: c.shortDefinition || null,
      formula: c.formula || null, imageUrl: c.imageUrl || null,
      difficulty: c.difficulty || 1, extraData: c.extraData || null, tagIds: c.tagIds || [],
    })),
    units: s.units.sort((a, b) => a.order - b.order).map((unit) => ({
      id: unit.id, title: unit.title, order: unit.order, description: unit.description || null,
      bookId:    unit.bookId    || null,
      bookTitle: unit.bookTitle || null,
      lessons: s.lessons.filter((l) => l.unitId === unit.id).sort((a, b) => a.order - b.order)
        .map((lesson) => ({
          id: lesson.id, title: lesson.title, order: lesson.order,
          estimatedMinutes: lesson.estimatedMinutes || 15, summary: lesson.summary || null,
          metadata:      lesson.metadata      || null,
          parentLesson:  lesson.parentLesson  || null,
          variationType: lesson.variationType || null,
          variationNote: lesson.variationNote || null,
          groupId:       lesson.groupId       || null,
          groupTitle:    lesson.groupTitle    || null,
          groupMetadata: lesson.groupMetadata || null,
          sections: s.sections.filter((sec) => sec.lessonId === lesson.id).sort((a, b) => a.order - b.order)
            .map((section) => ({
              id: section.id, title: section.title, order: section.order,
              learningType: section.learningType || 'UNDERSTANDING', conceptIds: section.conceptIds || [],
              partIndex: section.partIndex ?? 0,
              blocks: s.blocks.filter((b) => b.sectionId === section.id).sort((a, b) => a.order - b.order)
                .map((block) => ({
                  id: block.id, type: block.type, content: block.content || '',
                  order: block.order, conceptRef: block.conceptRef || null,
                  caption: block.caption || null, metadata: block.metadata || null,
                })),
            })),
        })),
    })),
    questions: s.questions.map((q) => ({
      id: q.id, type: q.type, textAr: q.textAr, textEn: q.textEn || null,
      correctAnswer: q.correctAnswer, options: q.options || null, explanation: q.explanation || null,
      imageUrl: q.imageUrl || null, tableData: q.tableData || null, difficulty: q.difficulty || 1,
      points: q.points || 1, estimatedSeconds: q.estimatedSeconds || 60,
      cognitiveLevel: q.cognitiveLevel || 'RECALL', source: q.source || 'ORIGINAL',
      sourceExamId: q.sourceExamId || null, sourceDetails: q.sourceDetails || null,
      sourceYear: q.sourceYear || null, feedEligible: q.feedEligible || false,
      unitId: q.unitId || null, lessonId: q.lessonId || null, sectionId: q.sectionId || null,
      isCheckpoint: q.isCheckpoint || false, conceptIds: q.conceptIds || [],
      markers: q.markers || [],
    })),
    exams: s.exams.map((e) => ({
      id: e.id, titleAr: e.titleAr, titleEn: e.titleEn || null, source: e.source,
      year: e.year || null, schoolName: e.schoolName || null, duration: e.duration || null,
      totalPoints: e.totalPoints || null, description: e.description || null,
      examType: e.examType || null, questionIds: e.questionIds || [], sectionsJson: e.sectionsJson || null,
    })),
    feedItems: s.feedItems.map((item) => ({
      id: item.id, conceptId: item.conceptId, type: item.type, contentAr: item.contentAr || '',
      back: item.back || null, contentEn: item.contentEn || null, imageUrl: item.imageUrl || null,
      interactionType: item.interactionType || null, correctAnswer: item.correctAnswer || null,
      options: item.options || null, explanation: item.explanation || null,
      questionId: item.questionId || null, priority: item.priority || 1, order: item.order || 0,
      lessonId: item.lessonId || null, unitId: item.unitId || null,
    })),
  };
}