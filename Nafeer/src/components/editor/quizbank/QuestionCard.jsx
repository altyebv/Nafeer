'use client';
import DeleteButton from '@/components/editor/shared/DeleteButton';
import StatusBadge from '@/components/editor/shared/StatusBadge';
import { Pencil, Send } from 'lucide-react';
import {
  QUESTION_TYPE_CONFIG,
  COGNITIVE_LEVEL_CONFIG,
  QUESTION_SOURCE_CONFIG,
} from '@/shared/constants';

export default function QuestionCard({ question, subjectId, onEdit, onDelete, onSubmitForReview }) {
  const cfg = QUESTION_TYPE_CONFIG[question.type];
  const cogCfg = COGNITIVE_LEVEL_CONFIG[question.cognitiveLevel];
  const srcCfg = QUESTION_SOURCE_CONFIG[question.source];
  const answerPreview = question.correctAnswer === 'MATCH_PAIRS'
    ? 'الأزواج المحددة'
    : question.correctAnswer;

  return (
    <article className="group rounded-2xl border border-ink-800 bg-ink-900/70 p-3 transition-colors hover:border-ink-700 hover:bg-ink-900 sm:p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-800 bg-ink-950 text-sm text-ink-400 font-mono">
          {cfg?.icon || '?'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-sand-800/40 bg-sand-900/20 px-2 py-0.5 text-xs text-sand-400 font-arabic">
              {cfg?.label || question.type}
            </span>
            {srcCfg && (
              <span className="rounded-md border border-ink-800 bg-ink-950 px-2 py-0.5 text-xs text-ink-500 font-arabic">
                {srcCfg.label}
                {question.sourceYear ? ` · ${question.sourceYear}` : ''}
              </span>
            )}
            {cogCfg && (
              <span className={`rounded-md border border-ink-800 bg-ink-950 px-2 py-0.5 text-xs font-arabic ${cogCfg.color}`}>
                {cogCfg.label}
              </span>
            )}
            <span className="rounded-md border border-ink-800 bg-ink-950 px-2 py-0.5 text-[11px] text-ink-600 font-mono">
              D{question.difficulty || 1} · {question.points || 1}pt
            </span>
            {question.feedEligible && (
              <span className="rounded-md border border-blue-800/50 bg-blue-900/20 px-2 py-0.5 text-xs text-blue-400 font-arabic">
                تغذية
              </span>
            )}
            {question.isCheckpoint && (
              <span className="rounded-md border border-amber-800/50 bg-amber-900/20 px-2 py-0.5 text-xs text-amber-400 font-arabic">
                تحقق
              </span>
            )}
            {question.atlasStatus && <StatusBadge status={question.atlasStatus} />}
          </div>

          <button
            type="button"
            onClick={() => onEdit(question)}
            className="block w-full text-right"
          >
            <p className="line-clamp-2 text-base leading-7 text-ink-100 transition-colors group-hover:text-sand-100 font-arabic">
              {question.textAr}
            </p>
            {answerPreview && (
              <p className="mt-1 line-clamp-1 text-xs text-ink-600 font-arabic">
                الإجابة: {answerPreview}
              </p>
            )}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          {(!question.atlasStatus || question.atlasStatus === 'draft') && subjectId && (
            <button
              type="button"
              onClick={() => onSubmitForReview(question.id)}
              className="rounded-lg p-2 text-amber-600 transition-colors hover:bg-amber-900/20 hover:text-amber-400"
              title="إرسال للمراجعة"
            >
              <Send size={15} strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(question)}
            className="rounded-lg p-2 text-ink-600 transition-colors hover:bg-ink-800 hover:text-sand-400"
            title="تعديل"
          >
            <Pencil size={15} strokeWidth={2} />
          </button>
          <DeleteButton onDelete={() => onDelete(question.id)} className="rounded-lg hover:bg-red-900/10" />
        </div>
      </div>
    </article>
  );
}
