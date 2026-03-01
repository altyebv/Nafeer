'use client';
import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import {
  QUESTION_TYPES, QUESTION_TYPE_CONFIG,
  COGNITIVE_LEVEL_CONFIG,
} from '@/shared/constants';

// Quick-add supports the 5 most common question types.
// Full editing for all 11 types lives in the global QuizBankPage.
const QUICK_TYPES = ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'FILL_BLANK', 'EXPLAIN'];

const inputClass =
  'w-full px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm ' +
  'focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600';

// ─── Compact MCQ builder ─────────────────────────────────────────────────────
// Uses index-based correct answer selection to avoid the text-equality bug.
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
export default function LessonQuestionsPanel({ lessonId, unitId, onOpenGlobal }) {
  const { questions, concepts, addQuestion, deleteQuestion } = useDataStore();

  const lessonQuestions = questions.filter((q) => q.lessonId === lessonId);

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

    addQuestion({
      type,
      textAr,
      correctAnswer: finalAnswer,
      options:       finalOptions,
      lessonId,
      unitId,
      // Sensible defaults — contributor can refine in QuizBankPage
      difficulty:       1,
      points:           1,
      estimatedSeconds: 60,
      cognitiveLevel:   'RECALL',
      source:           'ORIGINAL',
      feedEligible:     type === 'MCQ' || type === 'TRUE_FALSE',
      conceptIds:       [],
    });

    resetForm();
    setShowForm(false);
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
        <div className="p-4 space-y-3">

          {/* ── Existing questions ────────────────────────────────── */}
          {lessonQuestions.length > 0 && (
            <div className="space-y-1.5">
              {lessonQuestions.map((q) => {
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
                      onClick={() => deleteQuestion(q.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink-600 hover:text-red-500 transition-all p-0.5 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
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
                + إضافة سؤال
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