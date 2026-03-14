import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── quizStore ────────────────────────────────────────────────────────────────
// Owns: questions, exams

export const useQuizStore = create(
  persist(
    (set) => ({
      questions: [],
      exams:     [],

      // ── Questions ─────────────────────────────────────────────────────────
      addQuestion: (question) =>
        set((state) => ({
          questions: [
            ...state.questions,
            {
              id:               generateId('q'),
              type:             'MCQ',
              textAr:           '',
              textEn:           null,
              correctAnswer:    '',
              options:          null,
              explanation:      null,
              imageUrl:         null,
              tableData:        null,
              difficulty:       1,
              points:           1,
              estimatedSeconds: 60,
              cognitiveLevel:   'RECALL',
              source:           'ORIGINAL',
              sourceExamId:     null,
              sourceDetails:    null,
              sourceYear:       null,
              feedEligible:     false,
              unitId:           null,
              lessonId:         null,
              sectionId:        null,
              isCheckpoint:     false,
              conceptIds:       [],
              ...question,
            },
          ],
        })),

      updateQuestion: (id, updates) =>
        set((state) => ({
          questions: state.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        })),

      deleteQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
          exams:     state.exams.map((e) => ({
            ...e,
            questionIds: (e.questionIds || []).filter((qId) => qId !== id),
          })),
        })),

      linkConceptToQuestion: (questionId, conceptId) =>
        set((state) => ({
          questions: state.questions.map((q) => {
            if (q.id !== questionId) return q;
            const conceptIds = q.conceptIds || [];
            if (conceptIds.includes(conceptId)) return q;
            return { ...q, conceptIds: [...conceptIds, conceptId] };
          }),
        })),

      unlinkConceptFromQuestion: (questionId, conceptId) =>
        set((state) => ({
          questions: state.questions.map((q) => {
            if (q.id !== questionId) return q;
            return { ...q, conceptIds: (q.conceptIds || []).filter((id) => id !== conceptId) };
          }),
        })),

      // ── Exams ─────────────────────────────────────────────────────────────
      addExam: (exam) =>
        set((state) => ({
          exams: [
            ...state.exams,
            {
              id:           generateId('exam'),
              titleAr:      '',
              titleEn:      null,
              source:       'MINISTRY',
              year:         null,
              schoolName:   null,
              duration:     null,
              totalPoints:  null,
              description:  null,
              examType:     null,
              questionIds:  [],
              sectionsJson: null,
              ...exam,
            },
          ],
        })),

      updateExam: (id, updates) =>
        set((state) => ({
          exams: state.exams.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      deleteExam: (id) =>
        set((state) => ({ exams: state.exams.filter((e) => e.id !== id) })),

      addQuestionToExam: (examId, questionId) =>
        set((state) => ({
          exams: state.exams.map((e) => {
            if (e.id !== examId) return e;
            const questionIds = e.questionIds || [];
            if (questionIds.includes(questionId)) return e;
            return { ...e, questionIds: [...questionIds, questionId] };
          }),
        })),

      removeQuestionFromExam: (examId, questionId) =>
        set((state) => ({
          exams: state.exams.map((e) => {
            if (e.id !== examId) return e;
            return { ...e, questionIds: (e.questionIds || []).filter((id) => id !== questionId) };
          }),
        })),

      resetQuiz: () => set({ questions: [], exams: [] }),
    }),
    { name: 'basheer-quiz' }
  )
);