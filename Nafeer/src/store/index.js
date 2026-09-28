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

import { useSyncExternalStore, useCallback, useRef } from 'react';
import { useShallow }      from 'zustand/react/shallow';
import { useSubjectStore } from './subjectStore';
import { useContentStore } from './contentStore';
import { useConceptStore } from './conceptStore';
import { useFeedStore }    from './feedStore';
import { useQuizStore }    from './quizStore';

const STORES = [useSubjectStore, useContentStore, useConceptStore, useFeedStore, useQuizStore];

// ─── Merged snapshot cache ────────────────────────────────────────────────────
// buildMerged() allocates a fresh ~60-key object. useSyncExternalStore requires
// getSnapshot to return a referentially stable value between store changes, or
// it re-renders forever, so the result is cached and invalidated by a single
// subscription to all five stores.
let mergedCache = null;

function subscribeAll(onChange) {
  const unsubs = STORES.map((s) => s.subscribe(() => { mergedCache = null; onChange(); }));
  return () => unsubs.forEach((u) => u());
}

function getMerged() {
  if (mergedCache === null) mergedCache = buildMerged();
  return mergedCache;
}

// ─── Server snapshot ──────────────────────────────────────────────────────────
// React calls getServerSnapshot during SSR *and* again while hydrating on the
// client. The domain stores use zustand's persist middleware, which rehydrates
// from localStorage before React boots — so handing React the live snapshot
// during hydration compares server HTML built from empty arrays against client
// state already holding 58 lessons, and the tree is thrown away.
//
// This returns the empty shape the server actually rendered. Real data arrives
// on the first post-hydration store notification.
const EMPTY_DATA = {
  subject: null, units: [], lessons: [], sections: [], blocks: [],
  concepts: [], tags: [], feedItems: [], questions: [], exams: [],
};
let serverCache = null;

function getServerMerged() {
  if (serverCache === null) serverCache = { ...buildMerged(), ...EMPTY_DATA };
  return serverCache;
}

// ─── useDataStore ─────────────────────────────────────────────────────────────
// Composite hook over the five domain stores.
//
// This used to call each store's hook with no selector, subscribing every
// consumer to all five stores, then rebuild the merged object on every render
// and apply the caller's selector to the *result*. The selector therefore did
// nothing for subscription purposes: any change anywhere re-rendered every
// consumer, and 18 of 22 call sites passed no selector at all.
//
// Now the selector runs against a cached snapshot and its output is compared
// shallowly, so `useDataStore((s) => s.concepts)` re-renders only when
// concepts actually change. Call sites that pass an object literal should wrap
// it in useShallow (re-exported below) — or just use the domain store directly.
export function useDataStore(selector) {
  // Cache the selected value against the snapshot it came from, so a selector
  // returning a fresh object doesn't hand useSyncExternalStore a new reference
  // on every read (which would loop).
  const live   = useRef({ from: null, value: undefined });
  const server = useRef({ from: null, value: undefined });

  const getSelection = useCallback(() => {
    const merged = getMerged();
    if (live.current.from !== merged) {
      live.current = { from: merged, value: selector ? selector(merged) : merged };
    }
    return live.current.value;
  }, [selector]);

  const getServerSelection = useCallback(() => {
    const merged = getServerMerged();
    if (server.current.from !== merged) {
      server.current = { from: merged, value: selector ? selector(merged) : merged };
    }
    return server.current.value;
  }, [selector]);

  return useSyncExternalStore(subscribeAll, getSelection, getServerSelection);
}

export { useShallow };

function buildMerged() {
  const subject  = useSubjectStore.getState();
  const content  = useContentStore.getState();
  const concepts = useConceptStore.getState();
  const feed     = useFeedStore.getState();
  const quiz     = useQuizStore.getState();

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
    reorderBlocks:            content.reorderBlocks,   // ← new
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

      concepts.resetConcepts();
      (data.concepts || []).forEach((c) => concepts.addConcept({ ...c, atlasStatus: c.status || c.atlasStatus || 'draft' }));
      (data.tags     || []).forEach((t) => concepts.addTag(t));

      feed.loadFeedItems(
        (data.feedItems || []).map((f) => ({
          ...f,
          atlasStatus: f.status || f.atlasStatus || 'draft',
          lessonId:   f.lessonId   || f.lessonContentId   || null,
          unitId:     f.unitId     || f.unitContentId      || null,
          questionId: f.questionId || f.questionContentId  || null,
        }))
      );

      quiz.loadQuestions(
        (data.questions || []).map((q) => ({
          ...q,
          atlasStatus: q.status || q.atlasStatus || 'draft',
          markers: q.markers || [],
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

  return merged;
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