'use client';
import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useAtlasSync } from '@/hooks/useAtlasSync';
import { sanitiseMarkers } from '@/lib/markerUtils';

import QuestionsTab from '@/components/editor/quizbank/QuestionsTab';
import ExamsTab from '@/components/editor/quizbank/ExamTab';
import QuestionModal from '@/components/editor/quizbank/QuestionModal';
import ExamModal from '@/components/editor/quizbank/ExamModal';

const emptyQuestion = () => ({
  type: 'MCQ',
  textAr: '',
  textEn: null,
  correctAnswer: '',
  options: ['', '', '', ''],
  explanation: null,
  imageUrl: null,
  tableData: null,
  difficulty: 1,
  points: 1,
  estimatedSeconds: 60,
  cognitiveLevel: 'RECALL',
  source: 'ORIGINAL',
  sourceExamId: null,
  sourceDetails: null,
  sourceYear: null,
  feedEligible: true,
  unitId: null,
  lessonId: null,
  sectionId: null,
  isCheckpoint: false,
  conceptIds: [],
  markers: [],
  _markersOpen: false,
});

const emptyExam = () => ({
  titleAr: '',
  titleEn: null,
  source: 'MINISTRY',
  year: null,
  schoolName: null,
  duration: null,
  totalPoints: null,
  description: null,
  examType: null,
  questionIds: [],
});

const cleanOptional = (value) => {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normaliseQuestion = (draft) => {
  const normalised = {
    ...draft,
    textAr: draft.textAr.trim(),
    textEn: cleanOptional(draft.textEn),
    explanation: cleanOptional(draft.explanation),
    imageUrl: cleanOptional(draft.imageUrl),
    sourceDetails: cleanOptional(draft.sourceDetails),
    correctAnswer: draft.correctAnswer?.trim() || '',
    difficulty: Number(draft.difficulty) || 1,
    points: Number(draft.points) || 1,
    estimatedSeconds: Number(draft.estimatedSeconds) || 60,
  };

  if (normalised.type === 'MCQ' && Array.isArray(normalised.options)) {
    normalised.options = normalised.options.map((option) => option.trim()).filter(Boolean);
  }
  if (normalised.type === 'MATCH' && Array.isArray(normalised.options)) {
    normalised.options = normalised.options.filter((pair) => pair.right?.trim() && pair.left?.trim());
  }
  if (normalised.type === 'ORDER' && Array.isArray(normalised.options)) {
    normalised.options = normalised.options.map((item) => item.trim()).filter(Boolean);
    normalised.correctAnswer = normalised.options.join(' | ');
  }

  return normalised;
};

export default function QuizBankPage({ subjectId, isAdmin = false }) {
  const {
    questions,
    exams,
    concepts,
    units,
    lessons,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addExam,
    updateExam,
    deleteExam,
    addQuestionToExam,
    removeQuestionFromExam,
  } = useDataStore();

  const visibleQuestions = subjectId
    ? questions.filter((q) => q.subjectId === subjectId)
    : questions;

  const visibleConcepts = subjectId
    ? concepts.filter((c) => c.subjectId === subjectId)
    : concepts;

  const visibleExams = subjectId
    ? exams.filter((exam) => !exam.subjectId || exam.subjectId === subjectId)
    : exams;

  const {
    syncQuestion,
    syncExam,
    submitForReview,
    deleteQuestion: atlasDeleteQuestion,
    deleteExam: atlasDeleteExam,
  } = useAtlasSync();

  const [tab, setTab] = useState('questions');
  const [showQModal, setShowQModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingQId, setEditingQId] = useState(null);
  const [editingExamId, setEditingExamId] = useState(null);
  const [qForm, setQForm] = useState(emptyQuestion);
  const [examForm, setExamForm] = useState(emptyExam);

  const isTestSubject = isAdmin || subjectId?.startsWith('TEST_');
  const reviewCount = visibleQuestions.filter((q) => q.atlasStatus === 'review').length;
  const draftCount = visibleQuestions.filter((q) => !q.atlasStatus || q.atlasStatus === 'draft').length;
  const linkedCount = visibleQuestions.filter((q) => q.lessonId).length;

  const openAddQuestion = () => {
    setQForm(emptyQuestion());
    setEditingQId(null);
    setShowQModal(true);
  };

  const openEditQuestion = (q) => {
    setQForm({
      type: q.type,
      textAr: q.textAr,
      textEn: q.textEn || '',
      correctAnswer: q.correctAnswer,
      options: q.options || (q.type === 'MCQ' ? ['', '', '', ''] : null),
      explanation: q.explanation || '',
      imageUrl: q.imageUrl || '',
      tableData: q.tableData || null,
      difficulty: q.difficulty || 1,
      points: q.points || 1,
      estimatedSeconds: q.estimatedSeconds || 60,
      cognitiveLevel: q.cognitiveLevel || 'RECALL',
      source: q.source || 'ORIGINAL',
      sourceExamId: q.sourceExamId || null,
      sourceDetails: q.sourceDetails || null,
      sourceYear: q.sourceYear || null,
      feedEligible: q.feedEligible || false,
      unitId: q.unitId || null,
      lessonId: q.lessonId || null,
      sectionId: q.sectionId || null,
      isCheckpoint: q.isCheckpoint || false,
      conceptIds: q.conceptIds || [],
      markers: sanitiseMarkers(q.markers),
      _markersOpen: false,
    });
    setEditingQId(q.id);
    setShowQModal(true);
  };

  const handleSaveQuestion = () => {
    const cleanQuestion = normaliseQuestion(qForm);
    if (!cleanQuestion.textAr || !cleanQuestion.correctAnswer || (!cleanQuestion.lessonId && !isTestSubject)) return;
    const { _markersOpen, ...saveForm } = cleanQuestion;

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
      addExam({ ...examForm, id: newId, subjectId: subjectId || undefined });
      if (subjectId) syncExam(newId, subjectId).catch(() => {});
    }
    setShowExamModal(false);
  };

  const handleDeleteExam = (examId) => {
    deleteExam(examId);
    if (subjectId) atlasDeleteExam(examId);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-5 rounded-2xl border border-ink-800 bg-ink-900/60 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-xs text-sand-500 font-arabic">المحرر / بنك الأسئلة</p>
            <h1 className="text-2xl font-semibold text-sand-100 font-arabic">مساحة بناء الأسئلة</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-500 font-arabic">
              شاشة مركزة للبحث، المراجعة، وإضافة سؤال واضح مرتبط بالدرس.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatPill label="الأسئلة" value={visibleQuestions.length} />
            <StatPill label="مرتبطة" value={linkedCount} />
            <StatPill label="مسودات" value={draftCount} />
            {reviewCount > 0 && <StatPill label="مراجعة" value={reviewCount} tone="review" />}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-ink-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-xl border border-ink-800 bg-ink-950 p-1">
            {[
              ['questions', 'الأسئلة', visibleQuestions.length],
              ['exams', 'الامتحانات', visibleExams.length],
            ].map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-4 py-2 text-sm transition-colors font-arabic ${
                  tab === id
                    ? 'bg-sand-700 text-ink-950'
                    : 'text-ink-500 hover:text-ink-300'
                }`}
              >
                {label}
                <span className="mr-2 font-mono text-xs opacity-70">{count}</span>
              </button>
            ))}
          </div>

          {tab === 'questions' ? (
            <button
              type="button"
              onClick={openAddQuestion}
              className="rounded-lg bg-sand-600 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-sand-500 font-arabic"
            >
              + سؤال جديد
            </button>
          ) : (
            <button
              type="button"
              onClick={openAddExam}
              className="rounded-lg bg-sand-600 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-sand-500 font-arabic"
            >
              + امتحان جديد
            </button>
          )}
        </div>
      </header>

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
          exams={visibleExams}
          questions={visibleQuestions}
          onEdit={openEditExam}
          onDelete={handleDeleteExam}
          onAddQuestion={addQuestionToExam}
          onRemoveQuestion={removeQuestionFromExam}
        />
      )}

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

function StatPill({ label, value, tone = 'default' }) {
  const toneClass = tone === 'review'
    ? 'border-amber-800/50 bg-amber-900/20 text-amber-400'
    : 'border-ink-800 bg-ink-950 text-ink-400';

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <span className="block text-base leading-none font-semibold font-mono">{value}</span>
      <span className="mt-1 block text-[10px] font-arabic">{label}</span>
    </div>
  );
}
