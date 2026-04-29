'use client';
import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useAtlasSync } from '@/hooks/useAtlasSync';
import {
  QUESTION_TYPES, QUESTION_TYPE_CONFIG,
  COGNITIVE_LEVEL_CONFIG,
} from '@/shared/constants';

// Quick-add supports the 5 most common question types.
// Full editing for all 11 types lives in the global QuizBankPage.
// NOTE: checkpoint questions (isCheckpoint=true) are NOT created here —
// they belong in the section body as QUESTION blocks.
const QUICK_TYPES = ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'FILL_BLANK', 'EXPLAIN'];

const inputClass =
  'w-full px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm ' +
  'focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600';

// ─── Compact MCQ builder ─────────────────────────────────────────────────────
function MCQQuickForm({ options, correctIndex, onOptionsChange, onCorrectChange }) {
  const opts = options.length ? options : ['', '', '', ''];

  const update = (i, val) => {
    const next = [...opts]; next[i] = val; onOptionsChange(next);
  };

  return (
    <div className="space-y-1.5">
      {opts.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            onClick={() => onCorrectChange(i)}
            className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors
              ${correctIndex === i
                ? 'border-emerald-500 bg-emerald-500/20'
                : 'border-ink-600 hover:border-ink-400'
              }`}
            title="تحديد كإجابة صحيحة"
          />
          <input
            type="text"
            value={opt}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 px-2.5 py-1.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
            placeholder={`الخيار ${i + 1}`}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LessonQuestionsPanel({ lessonId, unitId, onOpenGlobal, subjectId }) {
  const { questions, sections, concepts, addQuestion, deleteQuestion } = useDataStore();
  const { deleteQuestion: atlasDeleteQuestion, syncQuestion } = useAtlasSync();

  const lessonQuestions = questions.filter((q) => q.lessonId === lessonId);

  // Separate: practice questions (quizbank) vs checkpoint questions (in-body gates)
  const practiceQuestions   = lessonQuestions.filter((q) => !q.isCheckpoint);
  const checkpointQuestions = lessonQuestions.filter((q) =>  q.isCheckpoint);

  const [isOpen,        setIsOpen]        = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [type,          setType]          = useState('MCQ');
  const [textAr,        setTextAr]        = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [mcqOptions,    setMcqOptions]    = useState(['', '', '', '']);
  const [correctIndex,  setCorrectIndex]  = useState(-1);

  const resetForm = () => {
    setTextAr(''); setCorrectAnswer('');
    setMcqOptions(['', '', '', '']); setCorrectIndex(-1);
  };

  const handleTypeChange = (t) => {
    setType(t); resetForm();
  };

  const handleAdd = () => {
    if (!textAr.trim()) return;

    let finalAnswer  = correctAnswer;
    let finalOptions = null;

    if (type === 'MCQ') {
      const filtered = mcqOptions.filter((o) => o.trim());
      finalOptions   = JSON.stringify(filtered);
      finalAnswer    = correctIndex >= 0 ? mcqOptions[correctIndex] : '';
    }

    // Generate a stable id upfront so we can reference it for the Atlas sync below
    const newId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    addQuestion({
      id:   newId,
      type,
      textAr,
      correctAnswer: finalAnswer,
      options:       finalOptions,
      lessonId,
      unitId,
      isCheckpoint:     false,   // ← always false here; checkpoints live in section blocks
      difficulty:       1,
      points:           1,
      estimatedSeconds: 60,
      cognitiveLevel:   'RECALL',
      source:           'ORIGINAL',
      feedEligible:     type === 'MCQ' || type === 'TRUE_FALSE',
      conceptIds:       [],
    });

    // Push to Atlas immediately (same pattern as QuizBankPage)
    if (subjectId) syncQuestion(newId, subjectId).catch(() => {});

    resetForm();
    setShowForm(false);
  };

  const handleDelete = (questionId) => {
    deleteQuestion(questionId);
    if (subjectId) atlasDeleteQuestion(questionId);
  };

  const canSubmit = textAr.trim().length > 0 &&
    (type !== 'MCQ' || correctIndex >= 0);

  return (
    <div className="bg-ink-900 rounded-xl border border-ink-800 overflow-hidden">

      {/* ── Panel header ──────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-ink-800/40 hover:bg-ink-800/70 transition-colors text-right"
      >
        <span className="text-base">🎯</span>
        <span className="flex-1 text-sm font-semibold text-ink-200 font-arabic">أسئلة الدرس</span>
        {lessonQuestions.length > 0 && (
          <span className="text-xs font-mono px-2 py-0.5 rounded border bg-sand-900/40 text-sand-400 border-sand-700/40">
            {lessonQuestions.length}
          </span>
        )}
        <span className={`text-ink-600 text-xs transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4">

          {/* ── Checkpoint questions (read-only reference) ─────────── */}
          {checkpointQuestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-amber-600/80 font-arabic font-semibold mb-1.5">
                ◎ نقاط تحقق ({checkpointQuestions.length}) — تُعدَّل من داخل القسم
              </p>
              {checkpointQuestions.map((q) => {
                const cfg    = QUESTION_TYPE_CONFIG[q.type];
                const sec    = sections.find((s) => s.id === q.sectionId);
                return (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 px-3 py-2 bg-amber-950/20 rounded-lg border border-amber-900/30"
                  >
                    <span className="text-xs font-mono text-amber-600/70 w-5 text-center shrink-0">
                      {cfg?.icon}
                    </span>
                    <span className="flex-1 text-sm text-ink-300 line-clamp-1 font-arabic">
                      {q.textAr}
                    </span>
                    {sec && (
                      <span className="text-xs text-ink-500 font-arabic shrink-0 hidden sm:block truncate max-w-[100px]">
                        {sec.title}
                      </span>
                    )}
                    <span className="text-[10px] text-amber-700/60 font-arabic shrink-0">تحقق</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Practice / quizbank questions ─────────────────────── */}
          {practiceQuestions.length > 0 && (
            <div className="space-y-1">
              {checkpointQuestions.length > 0 && (
                <p className="text-xs text-ink-500 font-arabic font-semibold mb-1.5">
                  أسئلة التدريب ({practiceQuestions.length})
                </p>
              )}
              {practiceQuestions.map((q) => {
                const cfg    = QUESTION_TYPE_CONFIG[q.type];
                const cogCfg = COGNITIVE_LEVEL_CONFIG[q.cognitiveLevel];
                return (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 px-3 py-2 bg-ink-800/60 rounded-lg group border border-transparent hover:border-ink-700 transition-colors"
                  >
                    <span className="text-xs font-mono text-ink-500 w-5 text-center shrink-0">
                      {cfg?.icon}
                    </span>
                    <span className="flex-1 text-sm text-ink-300 line-clamp-1 font-arabic">
                      {q.textAr}
                    </span>
                    {cogCfg && (
                      <span className={`text-[10px] font-arabic shrink-0 ${cogCfg.color}`}>
                        {cogCfg.label}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink-600 hover:text-red-500 transition-all p-0.5 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {lessonQuestions.length === 0 && (
            <div className="py-6 text-center border border-dashed border-ink-800/50 rounded-xl">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-sm text-ink-500 font-arabic">لا توجد أسئلة تدريب لهذا الدرس</p>
              <p className="text-xs text-ink-600 font-arabic mt-1">
                نقاط التحقق تُضاف من داخل أقسام المحتوى
              </p>
            </div>
          )}

          {/* ── Quick-add form ────────────────────────────────────── */}
          {showForm ? (
            <div className="bg-ink-950 border border-ink-800 rounded-xl p-4 space-y-3">

              {/* Type selector */}
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_TYPES.map((t) => {
                  const cfg = QUESTION_TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => handleTypeChange(t)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border font-arabic transition-colors
                        ${type === t
                          ? 'bg-sand-900/50 text-sand-300 border-sand-700'
                          : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'
                        }`}
                    >
                      <span className="font-mono">{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Question text */}
              <textarea
                value={textAr}
                onChange={(e) => setTextAr(e.target.value)}
                className={`${inputClass} resize-none min-h-[72px]`}
                placeholder="نص السؤال..."
                autoFocus
              />

              {/* Answer input — varies by type */}
              {type === 'TRUE_FALSE' && (
                <div className="flex gap-2">
                  {[['true', '✓ صح'], ['false', '✕ خطأ']].map(([val, lbl]) => (
                    <button
                      key={val}
                      onClick={() => setCorrectAnswer(val)}
                      className={`flex-1 py-2 rounded-lg text-sm border font-arabic transition-colors
                        ${correctAnswer === val
                          ? (val === 'true'
                              ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700'
                              : 'bg-red-900/40 text-red-400 border-red-700')
                          : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'
                        }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              )}

              {type === 'MCQ' && (
                <MCQQuickForm
                  options={mcqOptions}
                  correctIndex={correctIndex}
                  onOptionsChange={setMcqOptions}
                  onCorrectChange={setCorrectIndex}
                />
              )}

              {['SHORT_ANSWER', 'FILL_BLANK', 'EXPLAIN'].includes(type) && (
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className={inputClass}
                  placeholder={type === 'FILL_BLANK' ? 'الكلمة الصحيحة...' : 'الإجابة النموذجية...'}
                />
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={!canSubmit}
                  className="flex-1 py-2 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold text-sm font-arabic"
                >
                  إضافة
                </button>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-3 py-2 text-ink-500 hover:bg-ink-800 rounded-lg transition-colors text-sm font-arabic"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="flex-1 py-2.5 border border-dashed border-ink-700 rounded-lg text-ink-500 hover:border-sand-700 hover:text-sand-400 hover:bg-sand-900/10 transition-colors text-sm font-arabic"
              >
                + إضافة سؤال تدريب
              </button>
              {onOpenGlobal && (
                <button
                  onClick={() => onOpenGlobal('quizbank')}
                  className="px-3 py-2.5 text-xs text-ink-600 hover:text-sand-400 border border-ink-800 hover:border-ink-700 rounded-lg transition-colors font-arabic"
                  title="فتح بنك الأسئلة"
                >
                  عرض الكل ↗
                </button>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}