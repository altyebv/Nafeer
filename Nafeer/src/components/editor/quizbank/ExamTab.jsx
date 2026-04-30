'use client';
import { useState }   from 'react';
import DeleteButton   from '@/components/editor/shared/DeleteButton';
import {
  EXAM_SOURCE_CONFIG,
  EXAM_TYPE_CONFIG,
  QUESTION_TYPE_CONFIG,
} from '@/shared/constants';

// ─── ExamsTab ─────────────────────────────────────────────────────────────────
// Two-panel layout: exam list on the left, exam detail on the right.
// Props:
//   exams                 — array of exam objects
//   questions             — full question array (for adding to exams)
//   subjectId             — string | null
//   onEdit                — (exam) => void  (opens ExamModal)
//   onDelete              — (examId) => void
//   onAddQuestion         — (examId, questionId) => void
//   onRemoveQuestion      — (examId, questionId) => void
//   onDeleteExam          — (examId) => void  (alias kept for clarity)

export default function ExamsTab({
  exams, questions,
  onEdit, onDelete,
  onAddQuestion, onRemoveQuestion,
}) {
  const [selectedExamId, setSelectedExamId] = useState(null);

  const selectedExam    = selectedExamId ? exams.find((e) => e.id === selectedExamId) : null;
  const examQuestions   = selectedExam
    ? (selectedExam.questionIds || []).map((id) => questions.find((q) => q.id === id)).filter(Boolean)
    : [];
  const availableToAdd  = selectedExam
    ? questions.filter((q) => !(selectedExam.questionIds || []).includes(q.id))
    : [];

  return (
    <div className="flex gap-6">

      {/* ── Exam list ───────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 space-y-2">
        {exams.length === 0 ? (
          <div className="text-center py-12 bg-ink-900 rounded-xl border border-ink-800">
            <div className="text-3xl mb-3">📄</div>
            <p className="text-ink-500 text-sm font-arabic">لا توجد امتحانات</p>
          </div>
        ) : (
          exams.map((exam) => {
            const srcCfg  = EXAM_SOURCE_CONFIG[exam.source];
            const typeCfg = exam.examType ? EXAM_TYPE_CONFIG[exam.examType] : null;
            return (
              <div
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id === selectedExamId ? null : exam.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors
                  ${selectedExamId === exam.id
                    ? 'bg-sand-900/30 border-sand-700'
                    : 'bg-ink-900 border-ink-800 hover:border-ink-700'
                  }`}
              >
                <p className="font-medium text-ink-100 text-sm font-arabic mb-1">{exam.titleAr}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-ink-600 font-arabic">
                    {srcCfg?.icon} {srcCfg?.label}
                  </span>
                  {exam.year && <span className="text-xs text-ink-700 font-mono">{exam.year}</span>}
                  {typeCfg && <span className={`text-xs font-arabic ${typeCfg.color}`}>{typeCfg.label}</span>}
                  <span className="text-xs text-ink-600 font-arabic">
                    {(exam.questionIds || []).length} سؤال
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(exam); }}
                    className="text-xs text-ink-600 hover:text-sand-400 transition-colors font-arabic"
                  >
                    ✏ تعديل
                  </button>
                  <DeleteButton
                    onDelete={() => {
                      onDelete(exam.id);
                      if (selectedExamId === exam.id) setSelectedExamId(null);
                    }}
                    label="✕ حذف"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Exam detail ─────────────────────────────────────────────────── */}
      <div className="flex-1">
        {!selectedExam ? (
          <div className="text-center py-16 bg-ink-900 rounded-xl border border-ink-800">
            <p className="text-ink-600 font-arabic text-sm">اختر امتحاناً لإدارة أسئلته</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sand-200 font-arabic">{selectedExam.titleAr}</h2>
              <span className="text-xs text-ink-500 font-arabic">
                {examQuestions.length} / {(selectedExam.questionIds || []).length} سؤال
              </span>
            </div>

            {/* Available questions to add */}
            <div className="mb-4">
              <p className="text-xs text-ink-600 mb-2 font-arabic">إضافة أسئلة من البنك:</p>
              <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-ink-950 border border-ink-800 rounded-lg">
                {availableToAdd.length === 0 ? (
                  <p className="text-xs text-ink-700 text-center py-2 font-arabic">كل الأسئلة مضافة</p>
                ) : (
                  availableToAdd.map((q) => {
                    const cfg = QUESTION_TYPE_CONFIG[q.type];
                    return (
                      <button
                        key={q.id}
                        onClick={() => onAddQuestion(selectedExam.id, q.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-ink-900 hover:bg-ink-800 text-right transition-colors group border border-transparent hover:border-ink-700"
                      >
                        <span className="font-mono text-xs text-ink-600">{cfg?.icon}</span>
                        <span className="flex-1 text-xs text-ink-400 line-clamp-1 font-arabic">{q.textAr}</span>
                        <span className="text-xs text-sand-700 group-hover:text-sand-500 font-arabic">+ إضافة</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Questions currently in this exam */}
            <p className="text-xs text-ink-600 mb-2 font-arabic">الأسئلة في هذا الامتحان:</p>
            <div className="space-y-1.5">
              {examQuestions.map((q, i) => {
                const cfg = QUESTION_TYPE_CONFIG[q.type];
                return (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 px-3 py-2.5 bg-ink-900 rounded-lg border border-ink-800 group"
                  >
                    <span className="text-xs text-ink-700 font-mono w-5">{i + 1}</span>
                    <span className="font-mono text-xs text-ink-600">{cfg?.icon}</span>
                    <span className="flex-1 text-sm text-ink-300 line-clamp-1 font-arabic">{q.textAr}</span>
                    <span className="text-xs text-ink-700 font-arabic">{q.points}نقطة</span>
                    <button
                      onClick={() => onRemoveQuestion(selectedExam.id, q.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink-600 hover:text-red-500 transition-all p-1 font-arabic"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {examQuestions.length === 0 && (
                <p className="text-xs text-ink-700 text-center py-4 font-arabic">
                  لا توجد أسئلة في هذا الامتحان — أضف من الأعلى
                </p>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}