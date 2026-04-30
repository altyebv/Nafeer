'use client';
import DeleteButton from '@/components/editor/shared/DeleteButton';
import StatusBadge  from '@/components/editor/shared/StatusBadge';
import {
  QUESTION_TYPE_CONFIG,
  COGNITIVE_LEVEL_CONFIG,
  QUESTION_SOURCE_CONFIG,
} from '@/shared/constants';

// ─── QuestionCard ─────────────────────────────────────────────────────────────
// A single question row in the questions list.
// Hover-reveals edit, submit-for-review, and delete actions.

export default function QuestionCard({ question, subjectId, onEdit, onDelete, onSubmitForReview }) {
  const cfg    = QUESTION_TYPE_CONFIG[question.type];
  const cogCfg = COGNITIVE_LEVEL_CONFIG[question.cognitiveLevel];
  const srcCfg = QUESTION_SOURCE_CONFIG[question.source];

  return (
    <div className="flex items-start gap-4 p-4 bg-ink-900 rounded-xl border border-ink-800 hover:border-ink-700 transition-colors group">

      {/* Type icon */}
      <div className="w-9 h-9 flex items-center justify-center bg-ink-800 rounded-lg text-sm flex-shrink-0 font-mono text-ink-400">
        {cfg?.icon}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs px-1.5 py-0.5 bg-ink-800 text-ink-400 rounded border border-ink-700 font-arabic">
            {cfg?.label}
          </span>
          {srcCfg && (
            <span className="text-xs text-ink-600 font-arabic">
              {srcCfg.icon} {srcCfg.label}
              {question.sourceYear && ` (${question.sourceYear})`}
            </span>
          )}
          {cogCfg && (
            <span className={`text-xs font-arabic ${cogCfg.color}`}>
              {cogCfg.label}
            </span>
          )}
          <span className="text-xs text-ink-700 font-mono">
            ★{question.difficulty} · {question.points}pt
          </span>
          {question.feedEligible && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-900/30 text-blue-500 rounded border border-blue-800/50 font-arabic">
              تغذية
            </span>
          )}
          {question.isCheckpoint && (
            <span className="text-xs px-1.5 py-0.5 bg-amber-900/30 text-amber-500 rounded border border-amber-800/50 font-arabic">
              ◎ تحقق
            </span>
          )}
          {question.atlasStatus && <StatusBadge status={question.atlasStatus} />}
        </div>
        <p className="text-sm text-ink-200 line-clamp-2 font-arabic">{question.textAr}</p>
      </div>

      {/* Hover actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {(!question.atlasStatus || question.atlasStatus === 'draft') && subjectId && (
          <button
            onClick={() => onSubmitForReview(question.id)}
            className="p-1.5 text-amber-600 hover:text-amber-400 rounded transition-colors"
            title="إرسال للمراجعة"
          >
            ⇪
          </button>
        )}
        <button
          onClick={() => onEdit(question)}
          className="p-1.5 text-ink-600 hover:text-sand-400 rounded transition-colors"
        >
          ✏
        </button>
        <DeleteButton onDelete={() => onDelete(question.id)} />
      </div>

    </div>
  );
}