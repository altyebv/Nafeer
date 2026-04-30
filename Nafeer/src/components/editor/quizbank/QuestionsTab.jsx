'use client';
import { useMemo, useState } from 'react';
import QuestionCard from './QuestionCard';
import {
  QUESTION_TYPES,
  QUESTION_TYPE_CONFIG,
  QUESTION_SOURCES,
  QUESTION_SOURCE_CONFIG,
} from '@/shared/constants';

export default function QuestionsTab({
  questions,
  subjectId,
  onEdit,
  onDelete,
  onSubmitForReview,
  onAddQuestion,
}) {
  const [filterType, setFilterType] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [search, setSearch] = useState('');

  const countsByType = useMemo(() => {
    return questions.reduce((acc, question) => {
      acc[question.type] = (acc[question.type] || 0) + 1;
      return acc;
    }, {});
  }, [questions]);

  const filtered = questions.filter((question) => {
    const q = search.trim().toLowerCase();
    const text = `${question.textAr || ''} ${question.textEn || ''} ${question.correctAnswer || ''}`.toLowerCase();
    return (!filterType || question.type === filterType)
      && (!filterSource || question.source === filterSource)
      && (!q || text.includes(q));
  });

  const hasFilters = !!filterType || !!filterSource || !!search.trim();

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-ink-800 bg-ink-900/50 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-600">⌕</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-ink-800 bg-ink-950 py-3 pl-3 pr-9 text-sm text-sand-100 outline-none transition-colors placeholder:text-ink-600 focus:border-sand-700 focus:ring-1 focus:ring-sand-800 font-arabic"
              placeholder="ابحث في نص السؤال أو الإجابة..."
            />
          </div>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="min-h-[46px] rounded-xl border border-ink-800 bg-ink-950 px-3 text-sm text-ink-400 outline-none transition-colors focus:border-sand-700 focus:ring-1 focus:ring-sand-800 font-arabic"
          >
            <option value="">كل المصادر</option>
            {Object.entries(QUESTION_SOURCES).map(([key]) => (
              <option key={key} value={key}>{QUESTION_SOURCE_CONFIG[key].label}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setFilterType('');
                setFilterSource('');
                setSearch('');
              }}
              className="min-h-[46px] rounded-xl border border-ink-800 px-3 text-xs text-ink-500 transition-colors hover:border-ink-700 hover:text-ink-300 font-arabic"
            >
              مسح التصفية
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <FilterChip
            active={!filterType}
            label="الكل"
            count={questions.length}
            onClick={() => setFilterType('')}
          />
          {Object.entries(QUESTION_TYPES).map(([key]) => {
            const count = countsByType[key] || 0;
            if (count === 0) return null;
            const cfg = QUESTION_TYPE_CONFIG[key];
            return (
              <FilterChip
                key={key}
                active={filterType === key}
                icon={cfg.icon}
                label={cfg.label}
                count={count}
                onClick={() => setFilterType(filterType === key ? '' : key)}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-ink-500 font-arabic">
          {filtered.length === questions.length
            ? `${questions.length} سؤال في هذا النطاق`
            : `${filtered.length} نتيجة من ${questions.length}`}
        </p>
        {filtered.length > 0 && (
          <button
            type="button"
            onClick={onAddQuestion}
            className="text-xs text-sand-500 transition-colors hover:text-sand-300 font-arabic"
          >
            إضافة سؤال
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-800 bg-ink-900/40 px-4 py-16 text-center">
          <p className="text-3xl text-ink-700">؟</p>
          <p className="mt-3 text-sm text-ink-400 font-arabic">
            {questions.length === 0 ? 'لا توجد أسئلة بعد' : 'لا توجد نتائج مطابقة'}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-ink-600 font-arabic">
            {questions.length === 0
              ? 'ابدأ بسؤال واحد مرتبط بدرس محدد، ثم وسع البنك بالتدريج.'
              : 'جرّب تقليل التصفية أو البحث بكلمة من نص السؤال.'}
          </p>
          {questions.length === 0 && (
            <button
              type="button"
              onClick={onAddQuestion}
              className="mt-5 rounded-lg bg-sand-600 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-sand-500 font-arabic"
            >
              أضف أول سؤال
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              subjectId={subjectId}
              onEdit={onEdit}
              onDelete={onDelete}
              onSubmitForReview={onSubmitForReview}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterChip({ active, icon, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors font-arabic ${
        active
          ? 'border-sand-700 bg-sand-900/40 text-sand-300'
          : 'border-ink-800 bg-ink-950 text-ink-500 hover:border-ink-700 hover:text-ink-300'
      }`}
    >
      {icon && <span className="font-mono text-[11px]">{icon}</span>}
      <span>{label}</span>
      <span className="font-mono text-[10px] opacity-60">{count}</span>
    </button>
  );
}
