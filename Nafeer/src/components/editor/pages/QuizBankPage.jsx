'use client';
import { useState }       from 'react';
import { useDataStore }   from '@/store/dataStore';
import { useAtlasSync }   from '@/hooks/useAtlasSync';
import { sanitiseMarkers } from '@/lib/markerUtils';

import QuestionsTab   from '@/components/editor/quizbank/QuestionsTab';
import ExamsTab       from '@/components/editor/quizbank/ExamTab';
import QuestionModal  from '@/components/editor/quizbank/QuestionModal';
import ExamModal      from '@/components/editor/quizbank/ExamModal';

// ─── Empty-form factories ─────────────────────────────────────────────────────

const emptyQuestion = () => ({
  type: 'MCQ', textAr: '', textEn: null, correctAnswer: '', options: null,
  explanation: null, imageUrl: null, tableData: null,
  difficulty: 1, points: 1, estimatedSeconds: 60,
  cognitiveLevel: 'RECALL', source: 'ORIGINAL',
  sourceExamId: null, sourceDetails: null, sourceYear: null,
  feedEligible: false, unitId: null, lessonId: null, sectionId: null,
  isCheckpoint: false, conceptIds: [],
  markers: [], _markersOpen: false,
});

const emptyExam = () => ({
  titleAr: '', titleEn: null, source: 'MINISTRY', year: null,
  schoolName: null, duration: null, totalPoints: null,
  description: null, examType: null, questionIds: [],
});

// ─── QuizBankPage ─────────────────────────────────────────────────────────────
// Slim orchestrator: owns cross-tab state and save/delete handlers.
// All rendering is delegated to QuestionsTab / ExamsTab / the two modals.

export default function QuizBankPage({ subjectId, isAdmin = false }) {
  const {
    questions, exams, concepts, units, lessons,
    addQuestion, updateQuestion, deleteQuestion,
    addExam, updateExam, deleteExam,
    addQuestionToExam, removeQuestionFromExam,
  } = useDataStore();

  // ── Subject-scoped views ─────────────────────────────────────────────────
  // Hide questions/exams that belong to a different subject.
  // Items without a subjectId are also hidden when a subject context is active
  // to prevent test/orphaned data from leaking into unrelated subjects.
  const visibleQuestions = subjectId
    ? questions.filter((q) => q.subjectId === subjectId)
    : questions;

  const visibleConcepts = subjectId
    ? concepts.filter((c) => c.subjectId === subjectId)
    : concepts;

  const {
    syncQuestion, syncExam,
    submitForReview,
    deleteQuestion: atlasDeleteQuestion,
    deleteExam:     atlasDeleteExam,
  } = useAtlasSync();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [tab,           setTab]           = useState('questions'); // 'questions' | 'exams'
  const [showQModal,    setShowQModal]    = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingQId,    setEditingQId]    = useState(null);
  const [editingExamId, setEditingExamId] = useState(null);
  const [qForm,         setQForm]         = useState(emptyQuestion);
  const [examForm,      setExamForm]      = useState(emptyExam);

  const isTestSubject = isAdmin || subjectId?.startsWith('TEST_');

  // ── Question handlers ────────────────────────────────────────────────────
  const openAddQuestion = () => {
    setQForm(emptyQuestion());
    setEditingQId(null);
    setShowQModal(true);
  };

  const openEditQuestion = (q) => {
    setQForm({
      type:             q.type,
      textAr:           q.textAr,
      textEn:           q.textEn           || '',
      correctAnswer:    q.correctAnswer,
      options:          q.options          || null,
      explanation:      q.explanation      || '',
      imageUrl:         q.imageUrl         || '',
      tableData:        q.tableData        || null,
      difficulty:       q.difficulty       || 1,
      points:           q.points           || 1,
      estimatedSeconds: q.estimatedSeconds || 60,
      cognitiveLevel:   q.cognitiveLevel   || 'RECALL',
      source:           q.source           || 'ORIGINAL',
      sourceExamId:     q.sourceExamId     || null,
      sourceDetails:    q.sourceDetails    || null,
      sourceYear:       q.sourceYear       || null,
      feedEligible:     q.feedEligible     || false,
      unitId:           q.unitId           || null,
      lessonId:         q.lessonId         || null,
      sectionId:        q.sectionId        || null,
      isCheckpoint:     q.isCheckpoint     || false,
      conceptIds:       q.conceptIds       || [],
      markers:          sanitiseMarkers(q.markers),
      _markersOpen:     false,
    });
    setEditingQId(q.id);
    setShowQModal(true);
  };

  const handleSaveQuestion = () => {
    if (!qForm.textAr.trim() || (!qForm.lessonId && !isTestSubject)) return;
    const { _markersOpen, ...saveForm } = qForm;

    if (editingQId) {
      updateQuestion(editingQId, saveForm);
      if (subjectId) syncQuestion(editingQId, subjectId).catch(() => {});
    } else {
      const newId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      addQuestion({ ...saveForm, id: newId, subjectId: subjectId || undefined });
      if (subjectId) syncQuestion(newId, subjectId).catch(() => {});
    }
    setShowQModal(false);
  };

  const handleDeleteQuestion = (questionId) => {
    deleteQuestion(questionId);
    if (subjectId) atlasDeleteQuestion(questionId);
  };

  const handleSubmitForReview = (questionId) => {
    submitForReview(questionId, 'question').catch(() => {});
  };

  // ── Exam handlers ────────────────────────────────────────────────────────
  const openAddExam = () => {
    setExamForm(emptyExam());
    setEditingExamId(null);
    setShowExamModal(true);
  };

  const openEditExam = (exam) => {
    setExamForm({ ...exam, questionIds: exam.questionIds || [] });
    setEditingExamId(exam.id);
    setShowExamModal(true);
  };

  const handleSaveExam = () => {
    if (!examForm.titleAr.trim()) return;
    if (editingExamId) {
      updateExam(editingExamId, examForm);
      if (subjectId) syncExam(editingExamId, subjectId).catch(() => {});
    } else {
      const newId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      addExam({ ...examForm, id: newId });
      if (subjectId) syncExam(newId, subjectId).catch(() => {});
    }
    setShowExamModal(false);
  };

  const handleDeleteExam = (examId) => {
    deleteExam(examId);
    if (subjectId) atlasDeleteExam(examId);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-sand-200 font-arabic">بنك الأسئلة</h1>
          <p className="text-ink-500 mt-0.5 text-sm font-arabic">
            {visibleQuestions.length} سؤال · {exams.length} امتحان
          </p>
        </div>
        <div className="flex gap-2">
          {tab === 'questions' && (
            <button
              onClick={openAddQuestion}
              className="px-4 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-semibold font-arabic text-sm"
            >
              + سؤال جديد
            </button>
          )}
          {tab === 'exams' && (
            <button
              onClick={openAddExam}
              className="px-4 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-semibold font-arabic text-sm"
            >
              + امتحان جديد
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-ink-900 border border-ink-800 p-1 rounded-xl w-fit">
        {[['questions', '📋 الأسئلة'], ['exams', '📄 الامتحانات']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-arabic transition-colors
              ${tab === id ? 'bg-ink-700 text-sand-300' : 'text-ink-500 hover:text-ink-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      {tab === 'questions' && (
        <QuestionsTab
          questions={visibleQuestions}
          subjectId={subjectId}
          onEdit={openEditQuestion}
          onDelete={handleDeleteQuestion}
          onSubmitForReview={handleSubmitForReview}
          onAddQuestion={openAddQuestion}
        />
      )}

      {tab === 'exams' && (
        <ExamsTab
          exams={exams}
          questions={visibleQuestions}
          onEdit={openEditExam}
          onDelete={handleDeleteExam}
          onAddQuestion={addQuestionToExam}
          onRemoveQuestion={removeQuestionFromExam}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <QuestionModal
        isOpen={showQModal}
        onClose={() => setShowQModal(false)}
        editingId={editingQId}
        form={qForm}
        setForm={setQForm}
        onSave={handleSaveQuestion}
        concepts={visibleConcepts}
        units={units}
        lessons={lessons}
        isTestSubject={isTestSubject}
      />

      <ExamModal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        editingId={editingExamId}
        form={examForm}
        setForm={setExamForm}
        onSave={handleSaveExam}
      />

    </div>
  );
}