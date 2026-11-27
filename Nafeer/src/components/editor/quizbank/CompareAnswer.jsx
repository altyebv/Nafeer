'use client';
import { useState } from 'react';
import { compareFromQuestion, compareIssues, compareToQuestion } from '@/lib/answerGrids';

// ─── CompareAnswer ────────────────────────────────────────────────────────────
// A compare question's two items and the aspects they are compared on, with
// the right answer under each (lib/answerGrids.js). The app mixes the answers
// into a pool and the student places each one; it marks it only when every
// aspect has both answers. The model lives here while typed; the form keeps
// the finished `options` and `correctAnswer`.

const input =
  'min-w-0 w-full rounded-lg border border-line bg-sunken px-3 py-2 text-sm text-fg outline-none ' +
  'transition-colors placeholder:text-fg-subtle focus:border-accent-hover font-arabic';

export default function CompareAnswer({ question, onChange }) {
  const [model, setModel] = useState(() => compareFromQuestion(question));
  const change = (next) => { setModel(next); onChange(compareToQuestion(next)); };
  const setRow = (i, patch) => change({ ...model, rows: model.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const issues = compareIssues(model);

  return (
    <div className="space-y-3">
      {model.legacy && (
        <p className="rounded-lg bg-sunken px-3 py-2 t-caption text-fg-muted font-arabic">
          الإجابة كانت مكتوبة نصاً: «{model.legacy}». انقلها إلى الخانات ليصحّحها التطبيق.
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
        <span className="t-caption text-fg-muted font-arabic">وجه المقارنة</span>
        <input type="text" value={model.item1Label} onChange={(e) => change({ ...model, item1Label: e.target.value })}
          className={`${input} font-semibold`} placeholder="الأول، مثل: الكتلة" aria-label="اسم الأول" />
        <input type="text" value={model.item2Label} onChange={(e) => change({ ...model, item2Label: e.target.value })}
          className={`${input} font-semibold`} placeholder="الثاني، مثل: الوزن" aria-label="اسم الثاني" />
        <span className="w-8" />

        {model.rows.map((row, i) => (
          <div key={i} className="contents">
            <input type="text" value={row.aspect} onChange={(e) => setRow(i, { aspect: e.target.value })}
              className={input} placeholder="مثل: وحدة القياس" aria-label={`وجه المقارنة ${i + 1}`} />
            <input type="text" value={row.first} onChange={(e) => setRow(i, { first: e.target.value })}
              className={input} placeholder={model.item1Label || 'الأول'} aria-label={`إجابة الأول في الوجه ${i + 1}`} />
            <input type="text" value={row.second} onChange={(e) => setRow(i, { second: e.target.value })}
              className={input} placeholder={model.item2Label || 'الثاني'} aria-label={`إجابة الثاني في الوجه ${i + 1}`} />
            <button type="button" onClick={() => change({ ...model, rows: model.rows.filter((_, j) => j !== i) })}
              disabled={model.rows.length === 1} title="حذف الوجه" aria-label="حذف الوجه"
              className="rounded-lg p-2 text-fg-subtle transition-colors hover:bg-red-900/20 hover:text-red-400 disabled:opacity-30">×</button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => change({ ...model, rows: [...model.rows, { aspect: '', first: '', second: '' }] })}
        className="rounded-lg border border-dashed border-line-strong px-3 py-2 text-xs text-fg-muted transition-colors hover:border-line-accent hover:text-fg-accent font-arabic">
        + وجه آخر
      </button>

      <p className="t-caption text-fg-subtle font-arabic">يخلط التطبيق الإجابات، ويضع الطالب كل واحدة تحت صاحبها.</p>
      {issues.map((m) => <p key={m} className="t-caption text-amber-500 font-arabic">{m}</p>)}
    </div>
  );
}
