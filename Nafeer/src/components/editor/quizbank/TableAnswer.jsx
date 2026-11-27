'use client';
import { useState } from 'react';
import { tableFromQuestion, tableIssues, tableToQuestion } from '@/lib/answerGrids';

// ─── TableAnswer ──────────────────────────────────────────────────────────────
// A table question: the table as written, the cells the student fills marked
// with their right answer, and wrong suggestions to mix in (lib/answerGrids.js).
// The app shows marked cells as ؟ and the answers as a pool to place. The model
// lives here while typed; the form keeps the finished `tableData` and
// `correctAnswer`.

const cell =
  'min-w-0 w-full rounded-md border px-2 py-1.5 text-xs outline-none transition-colors placeholder:text-fg-subtle ' +
  'font-arabic';

const MAX_COLS = 5;

export default function TableAnswer({ question, onChange }) {
  const [model, setModel] = useState(() => tableFromQuestion(question));
  const change = (next) => { setModel(next); onChange(tableToQuestion(next)); };
  const width = model.headers.length;

  const setHeader = (c, value) => change({ ...model, headers: model.headers.map((h, j) => (j === c ? value : h)) });
  const setCell = (r, c, patch) => change({
    ...model,
    rows: model.rows.map((row, i) => (i !== r ? row : row.map((x, j) => (j === c ? { ...x, ...patch } : x)))),
  });
  const addRow = () => change({ ...model, rows: [...model.rows, Array.from({ length: width }, () => ({ value: '', blank: false }))] });
  const removeRow = (r) => change({ ...model, rows: model.rows.filter((_, i) => i !== r) });
  const addCol = () => change({ ...model, headers: [...model.headers, ''], rows: model.rows.map((row) => [...row, { value: '', blank: false }]) });
  const removeCol = (c) => change({
    ...model, headers: model.headers.filter((_, j) => j !== c), rows: model.rows.map((row) => row.filter((_, j) => j !== c)),
  });
  const setExtra = (i, value) => change({ ...model, extra: model.extra.map((w, j) => (j === i ? value : w)) });

  const issues = tableIssues(model);
  const cols = { gridTemplateColumns: `repeat(${width}, minmax(0, 1fr)) auto` };

  return (
    <div className="space-y-3">
      {model.legacy && (
        <p className="rounded-lg bg-sunken px-3 py-2 t-caption text-fg-muted font-arabic">
          الإجابة كانت مكتوبة نصاً: «{model.legacy}». انقلها إلى الجدول ليصحّحه التطبيق.
        </p>
      )}

      <p className="t-caption text-fg-muted font-arabic">
        اكتب الجدول كاملاً، ثم اضغط ؟ على كل خانة يملؤها الطالب. يظهر له مكانها فارغاً.
      </p>

      <div className="overflow-x-auto rounded-lg border border-line bg-sunken p-2">
        <div className="grid gap-1.5" style={cols}>
          {model.headers.map((h, c) => (
            <div key={`h${c}`} className="flex items-center gap-1">
              <input type="text" value={h} onChange={(e) => setHeader(c, e.target.value)}
                className={`${cell} border-line-strong bg-sunken font-semibold text-fg-strong`} placeholder={`عنوان العمود ${c + 1}`}
                aria-label={`عنوان العمود ${c + 1}`} />
              {width > 1 && (
                <button type="button" onClick={() => removeCol(c)} title="حذف العمود" aria-label={`حذف العمود ${c + 1}`}
                  className="text-fg-subtle hover:text-red-400 text-xs px-1">×</button>
              )}
            </div>
          ))}
          <span />

          {model.rows.map((row, r) => (
            <div key={`r${r}`} className="contents">
              {row.map((x, c) => (
                <div key={c} className="flex items-center gap-1">
                  <input type="text" value={x.value} onChange={(e) => setCell(r, c, { value: e.target.value })}
                    className={`${cell} ${x.blank ? 'border-emerald-700 bg-emerald-900/15 text-emerald-200' : 'border-line bg-sunken text-fg'}`}
                    placeholder={x.blank ? 'إجابة الخانة' : ''} aria-label={`الصف ${r + 1}، العمود ${c + 1}`} />
                  <button type="button" onClick={() => setCell(r, c, { blank: !x.blank })} aria-pressed={x.blank}
                    title={x.blank ? 'يملؤها الطالب — اضغط لإظهارها' : 'اجعلها خانة يملؤها الطالب'}
                    aria-label={`الصف ${r + 1}، العمود ${c + 1}: يملؤها الطالب`}
                    className={`shrink-0 w-6 h-6 rounded-md border text-xs font-arabic ${x.blank ? 'border-emerald-700 text-emerald-300 bg-emerald-900/30' : 'border-line text-fg-subtle hover:text-fg-muted'}`}>
                    ؟
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => removeRow(r)} disabled={model.rows.length === 1}
                title="حذف الصف" aria-label={`حذف الصف ${r + 1}`}
                className="text-fg-subtle hover:text-red-400 disabled:opacity-30 text-sm px-1">×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={addRow}
          className="rounded-lg border border-dashed border-line-strong px-3 py-2 text-xs text-fg-muted hover:border-line-accent hover:text-fg-accent font-arabic">+ صف</button>
        {width < MAX_COLS && (
          <button type="button" onClick={addCol}
            className="rounded-lg border border-dashed border-line-strong px-3 py-2 text-xs text-fg-muted hover:border-line-accent hover:text-fg-accent font-arabic">+ عمود</button>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="t-caption text-fg-muted font-arabic">إجابات خاطئة تُخلط مع الصحيحة (اختياري)</p>
        {model.extra.map((w, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-2">
            <input type="text" value={w} onChange={(e) => setExtra(i, e.target.value)}
              className={`${cell} border-line bg-sunken text-fg`} placeholder="إجابة قريبة لكنها خاطئة" />
            <button type="button" onClick={() => change({ ...model, extra: model.extra.filter((_, j) => j !== i) })}
              title="حذف" aria-label="حذف الإجابة الخاطئة" className="text-fg-subtle hover:text-red-400 text-sm px-1">×</button>
          </div>
        ))}
        <button type="button" onClick={() => change({ ...model, extra: [...model.extra, ''] })}
          className="rounded-lg border border-dashed border-line-strong px-3 py-2 text-xs text-fg-muted hover:border-line-accent hover:text-fg-accent font-arabic">
          + إجابة خاطئة
        </button>
      </div>

      {issues.map((m) => <p key={m} className="t-caption text-amber-500 font-arabic">{m}</p>)}
    </div>
  );
}
