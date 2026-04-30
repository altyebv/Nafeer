'use client';
import { useState }    from 'react';
import QuestionCard    from './QuestionCard';
import {
  QUESTION_TYPES, QUESTION_TYPE_CONFIG,
  QUESTION_SOURCES, QUESTION_SOURCE_CONFIG,
} from '@/shared/constants';

// ─── QuestionsTab ─────────────────────────────────────────────────────────────
// Owns filter/search state and renders the question list.
// Props:
//   questions           — full array from store (unfiltered)
//   subjectId           — string | null
//   onEdit              — (question) => void
//   onDelete            — (questionId) => void
//   onSubmitForReview   — (questionId) => void
//   onAddQuestion       — () => void   (opens the add modal)

export default function QuestionsTab({
  questions, subjectId,
  onEdit, onDelete, onSubmitForReview, onAddQuestion,
}) {
  const [filterType,   setFilterType]   = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [search,       setSearch]       = useState('');

  const filtered = questions.filter((q) =>
    (!filterType   || q.type   === filterType)   &&
    (!filterSource || q.source === filterSource) &&
    (!search       || q.textAr.includes(search))
  );

  return (
    <>
      {/* ── Type filter chips ──────────────────────────────────────────── */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        <button
          onClick={() => setFilterType('')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-arabic transition-colors border
            ${!filterType
              ? 'bg-sand-900/50 text-sand-400 border-sand-700'
              : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'}`}
        >
          الكل ({questions.length})
        </button>
        {Object.entries(QUESTION_TYPES).map(([key]) => {
          const cfg   = QUESTION_TYPE_CONFIG[key];
          const count = questions.filter((q) => q.type === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setFilterType(filterType === key ? '' : key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-arabic transition-colors border flex items-center gap-1
                ${filterType === key
                  ? 'bg-sand-900/50 text-sand-400 border-sand-700'
                  : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'}`}
            >
              <span className="font-mono">{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className="font-mono text-ink-600">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Source filter + search ─────────────────────────────────────── */}
      <div className="flex gap-3 mb-5">
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-3 py-2 bg-ink-900 border border-ink-800 rounded-lg text-ink-400 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic"
        >
          <option value="">كل المصادر</option>
          {Object.entries(QUESTION_SOURCES).map(([key]) => (
            <option key={key} value={key}>{QUESTION_SOURCE_CONFIG[key].label}</option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-ink-900 border border-ink-800 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-600"
          placeholder="بحث في نص السؤال..."
        />
      </div>

      {/* ── Question list ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-ink-900 rounded-xl border border-ink-800">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-ink-400 font-arabic mb-4">
            {questions.length === 0 ? 'لا توجد أسئلة بعد' : 'لا توجد نتائج'}
          </p>
          {questions.length === 0 && (
            <button
              onClick={onAddQuestion}
              className="px-5 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-arabic"
            >
              أضف أول سؤال
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              subjectId={subjectId}
              onEdit={onEdit}
              onDelete={onDelete}
              onSubmitForReview={onSubmitForReview}
            />
          ))}
        </div>
      )}
    </>
  );
}