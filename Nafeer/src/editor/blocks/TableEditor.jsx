'use client';
import { useState, useCallback } from 'react';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function emptyTable(cols = 2, rows = 2) {
  return {
    headers: Array(cols).fill(''),
    rows: Array(rows).fill(null).map(() => Array(cols).fill(''))
  };
}

function parseLesson(raw) {
  if (!raw) return emptyTable();
  try {
    const p = JSON.parse(raw);
    if (p.headers && p.rows) {
      // normalise: rows might be [{cells:[...]}] or [[...]]
      const rows = p.rows.map(r => Array.isArray(r) ? r : (r.cells || []));
      // pad rows to match headers length
      const cols = p.headers.length;
      return {
        headers: p.headers,
        rows: rows.map(r => {
          const padded = [...r];
          while (padded.length < cols) padded.push('');
          return padded;
        })
      };
    }
  } catch {}
  return emptyTable();
}

function parseQuiz(raw) {
  if (!raw) return { headers: ['', ''], rows: [['', '']], editableCells: [] };
  try {
    const p = JSON.parse(raw);
    const rows = (p.rows || []).map(r => Array.isArray(r) ? r : (r.cells || []));
    const editableCells = (p.editableCells || []).map(c =>
      Array.isArray(c) ? c : [c[0], c[1]]
    );
    return { headers: p.headers || [], rows, editableCells };
  } catch {}
  return { headers: ['', ''], rows: [['', '']], editableCells: [] };
}

function serializeLesson({ headers, rows }) {
  return JSON.stringify({ headers, rows });
}

function serializeQuiz({ headers, rows, editableCells }) {
  return JSON.stringify({
    headers,
    rows: rows.map(r => ({ cells: r })),
    editableCells,
  });
}

// ─── Cell ─────────────────────────────────────────────────────────────────────
function Cell({ value, onChange, isHeader, isEditable, onToggleEditable, quizMode, readOnly }) {
  const [focused, setFocused] = useState(false);

  const base = `
    relative group min-w-[90px] border-l border-ink-700 first:border-l-0
    ${isHeader ? 'bg-ink-800/80' : isEditable ? 'bg-sand-900/20' : 'bg-ink-950/40'}
  `;

  return (
    <td className={base}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        readOnly={readOnly}
        dir="rtl"
        className={`
          w-full px-3 py-2.5 bg-transparent text-sm font-arabic text-center outline-none
          placeholder-ink-700 transition-colors
          ${isHeader ? 'font-semibold text-sand-300' : 'text-ink-200'}
          ${focused ? 'bg-ink-800/50' : ''}
          ${readOnly ? 'cursor-default' : ''}
        `}
        placeholder={isHeader ? 'عنوان العمود' : '—'}
      />

      {/* Quiz mode: editable cell toggle */}
      {quizMode && !isHeader && (
        <button
          onClick={onToggleEditable}
          title={isEditable ? 'خلية فارغة (يملأها الطالب)' : 'خلية ثابتة'}
          className={`
            absolute top-1 left-1 w-4 h-4 rounded-sm text-xs flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-opacity border
            ${isEditable
              ? 'bg-sand-800 border-sand-600 text-sand-400'
              : 'bg-ink-700 border-ink-600 text-ink-500'
            }
          `}
        >
          {isEditable ? '○' : '●'}
        </button>
      )}
    </td>
  );
}

// ─── Lesson Table Editor ──────────────────────────────────────────────────────
export function LessonTableEditor({ value, onChange }) {
  const [table, setTable] = useState(() => parseLesson(value));

  const emit = useCallback((next) => {
    setTable(next);
    onChange(serializeLesson(next));
  }, [onChange]);

  const setHeader = (ci, v) => {
    const headers = [...table.headers];
    headers[ci] = v;
    emit({ ...table, headers });
  };

  const setCell = (ri, ci, v) => {
    const rows = table.rows.map(r => [...r]);
    rows[ri][ci] = v;
    emit({ ...table, rows });
  };

  const addCol = () => {
    emit({
      headers: [...table.headers, ''],
      rows: table.rows.map(r => [...r, '']),
    });
  };

  const addRow = () => {
    emit({
      ...table,
      rows: [...table.rows, Array(table.headers.length).fill('')],
    });
  };

  const removeCol = (ci) => {
    if (table.headers.length <= 1) return;
    emit({
      headers: table.headers.filter((_, i) => i !== ci),
      rows: table.rows.map(r => r.filter((_, i) => i !== ci)),
    });
  };

  const removeRow = (ri) => {
    if (table.rows.length <= 1) return;
    emit({ ...table, rows: table.rows.filter((_, i) => i !== ri) });
  };

  const cols = table.headers.length;

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-ink-700">
        <table className="w-full border-collapse">
          {/* Column controls */}
          <thead>
            <tr className="border-b border-ink-700/50">
              <td className="w-6 bg-ink-900/50" />
              {table.headers.map((_, ci) => (
                <td key={ci} className="bg-ink-900/50 text-center border-l border-ink-700 first:border-l-0 py-1">
                  <button
                    onClick={() => removeCol(ci)}
                    disabled={cols <= 1}
                    className="text-ink-700 hover:text-red-500 transition-colors disabled:opacity-20 text-xs px-1"
                    title="حذف العمود"
                  >
                    ✕
                  </button>
                </td>
              ))}
              <td className="w-6 bg-ink-900/50" />
            </tr>
          </thead>

          <tbody>
            {/* Header row */}
            <tr className="border-b border-ink-700">
              <td className="w-6 bg-ink-900/30 text-center text-xs text-ink-700 font-mono px-1">H</td>
              {table.headers.map((h, ci) => (
                <Cell key={ci} value={h} onChange={v => setHeader(ci, v)} isHeader />
              ))}
              <td className="w-6 bg-ink-900/30" />
            </tr>

            {/* Data rows */}
            {table.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-ink-700/50 last:border-b-0">
                <td className="w-6 bg-ink-900/30 text-center text-xs text-ink-700 font-mono px-1">
                  {ri + 1}
                </td>
                {row.map((cell, ci) => (
                  <Cell key={ci} value={cell} onChange={v => setCell(ri, ci, v)} />
                ))}
                <td className="w-6 bg-ink-900/30 text-center">
                  <button
                    onClick={() => removeRow(ri)}
                    disabled={table.rows.length <= 1}
                    className="text-ink-700 hover:text-red-500 transition-colors disabled:opacity-20 text-xs"
                    title="حذف الصف"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add controls */}
      <div className="flex gap-2">
        <button
          onClick={addRow}
          className="px-3 py-1.5 bg-ink-800 border border-ink-700 rounded-lg text-ink-400 text-xs hover:border-sand-700 hover:text-sand-500 transition-colors font-arabic"
        >
          + صف
        </button>
        <button
          onClick={addCol}
          className="px-3 py-1.5 bg-ink-800 border border-ink-700 rounded-lg text-ink-400 text-xs hover:border-sand-700 hover:text-sand-500 transition-colors font-arabic"
        >
          + عمود
        </button>
        <span className="text-xs text-ink-700 self-center font-arabic mr-auto">
          {cols} أعمدة · {table.rows.length} صفوف
        </span>
      </div>

      {/* Live preview */}
      <TablePreview headers={table.headers} rows={table.rows} />
    </div>
  );
}

// ─── Quiz Table Editor ────────────────────────────────────────────────────────
// Same grid but cells can be toggled as "editable" (blank for student to fill)
export function QuizTableEditor({ value, onChange }) {
  const [table, setTable] = useState(() => parseQuiz(value));

  const isEditable = (ri, ci) =>
    table.editableCells.some(([r, c]) => r === ri && c === ci);

  const emit = useCallback((next) => {
    setTable(next);
    onChange(serializeQuiz(next));
  }, [onChange]);

  const setHeader = (ci, v) => {
    const headers = [...table.headers];
    headers[ci] = v;
    emit({ ...table, headers });
  };

  const setCell = (ri, ci, v) => {
    const rows = table.rows.map(r => [...r]);
    rows[ri][ci] = v;
    emit({ ...table, rows });
  };

  const toggleEditable = (ri, ci) => {
    const already = isEditable(ri, ci);
    const editableCells = already
      ? table.editableCells.filter(([r, c]) => !(r === ri && c === ci))
      : [...table.editableCells, [ri, ci]];
    emit({ ...table, editableCells });
  };

  const addCol = () => {
    emit({
      headers: [...table.headers, ''],
      rows: table.rows.map(r => [...r, '']),
      editableCells: table.editableCells,
    });
  };

  const addRow = () => {
    emit({
      ...table,
      rows: [...table.rows, Array(table.headers.length).fill('')],
    });
  };

  const removeCol = (ci) => {
    if (table.headers.length <= 1) return;
    emit({
      headers: table.headers.filter((_, i) => i !== ci),
      rows: table.rows.map(r => r.filter((_, i) => i !== ci)),
      editableCells: table.editableCells
        .filter(([, c]) => c !== ci)
        .map(([r, c]) => [r, c > ci ? c - 1 : c]),
    });
  };

  const removeRow = (ri) => {
    if (table.rows.length <= 1) return;
    emit({
      ...table,
      rows: table.rows.filter((_, i) => i !== ri),
      editableCells: table.editableCells
        .filter(([r]) => r !== ri)
        .map(([r, c]) => [r > ri ? r - 1 : r, c]),
    });
  };

  const editableCount = table.editableCells.length;
  const cols = table.headers.length;

  return (
    <div className="space-y-3">
      {/* Hint */}
      <div className="flex items-center gap-2 p-2.5 bg-ink-900/60 border border-ink-800 rounded-lg">
        <div className="flex items-center gap-1.5 text-xs text-ink-500 font-arabic">
          <span className="w-4 h-4 bg-sand-900/40 border border-sand-700 rounded-sm text-sand-500 flex items-center justify-center text-xs">○</span>
          خلية فارغة — يملأها الطالب
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-500 font-arabic">
          <span className="w-4 h-4 bg-ink-700 border border-ink-600 rounded-sm text-ink-400 flex items-center justify-center text-xs">●</span>
          خلية ثابتة — تظهر للطالب
        </div>
        <span className="mr-auto text-xs font-mono text-ink-600">{editableCount} خلية فارغة</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-ink-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink-700/50">
              <td className="w-6 bg-ink-900/50" />
              {table.headers.map((_, ci) => (
                <td key={ci} className="bg-ink-900/50 text-center border-l border-ink-700 first:border-l-0 py-1">
                  <button
                    onClick={() => removeCol(ci)}
                    disabled={cols <= 1}
                    className="text-ink-700 hover:text-red-500 transition-colors disabled:opacity-20 text-xs px-1"
                  >
                    ✕
                  </button>
                </td>
              ))}
              <td className="w-6 bg-ink-900/50" />
            </tr>
          </thead>

          <tbody>
            {/* Header row */}
            <tr className="border-b border-ink-700">
              <td className="w-6 bg-ink-900/30 text-center text-xs text-ink-700 font-mono px-1">H</td>
              {table.headers.map((h, ci) => (
                <Cell key={ci} value={h} onChange={v => setHeader(ci, v)} isHeader quizMode />
              ))}
              <td className="w-6 bg-ink-900/30" />
            </tr>

            {table.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-ink-700/50 last:border-b-0">
                <td className="w-6 bg-ink-900/30 text-center text-xs text-ink-700 font-mono px-1">
                  {ri + 1}
                </td>
                {row.map((cell, ci) => (
                  <Cell
                    key={ci}
                    value={cell}
                    onChange={v => setCell(ri, ci, v)}
                    isEditable={isEditable(ri, ci)}
                    onToggleEditable={() => toggleEditable(ri, ci)}
                    quizMode
                  />
                ))}
                <td className="w-6 bg-ink-900/30 text-center">
                  <button
                    onClick={() => removeRow(ri)}
                    disabled={table.rows.length <= 1}
                    className="text-ink-700 hover:text-red-500 transition-colors disabled:opacity-20 text-xs"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add controls */}
      <div className="flex gap-2">
        <button
          onClick={addRow}
          className="px-3 py-1.5 bg-ink-800 border border-ink-700 rounded-lg text-ink-400 text-xs hover:border-sand-700 hover:text-sand-500 transition-colors font-arabic"
        >
          + صف
        </button>
        <button
          onClick={addCol}
          className="px-3 py-1.5 bg-ink-800 border border-ink-700 rounded-lg text-ink-400 text-xs hover:border-sand-700 hover:text-sand-500 transition-colors font-arabic"
        >
          + عمود
        </button>
        <button
          onClick={() => emit({ ...table, editableCells: [] })}
          disabled={editableCount === 0}
          className="px-3 py-1.5 bg-ink-800 border border-ink-700 rounded-lg text-ink-400 text-xs hover:border-red-800 hover:text-red-500 transition-colors disabled:opacity-30 font-arabic"
        >
          مسح الفراغات
        </button>
      </div>

      {/* Preview — shows what the student sees */}
      <div>
        <p className="text-xs text-ink-600 mb-2 font-arabic">معاينة — كما سيراها الطالب:</p>
        <TablePreview
          headers={table.headers}
          rows={table.rows}
          editableCells={table.editableCells}
        />
      </div>
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────
function TablePreview({ headers, rows, editableCells = [] }) {
  const isEditable = (ri, ci) =>
    editableCells.some(([r, c]) => r === ri && c === ci);

  const hasContent = headers.some(h => h.trim()) || rows.some(r => r.some(c => c.trim()));
  if (!hasContent) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-ink-700/50">
      <table className="w-full border-collapse text-sm">
        {headers.some(h => h.trim()) && (
          <thead>
            <tr className="border-b border-ink-700">
              {headers.map((h, ci) => (
                <th
                  key={ci}
                  className="px-4 py-2.5 bg-ink-800/60 text-sand-300 font-semibold font-arabic text-center border-l border-ink-700/50 first:border-l-0"
                >
                  {h || '—'}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-ink-700/30 last:border-b-0">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`
                    px-4 py-2.5 text-center font-arabic border-l border-ink-700/30 first:border-l-0
                    ${isEditable(ri, ci)
                      ? 'bg-sand-900/10 border-b-2 border-b-sand-700 text-ink-600 italic'
                      : 'text-ink-300'
                    }
                  `}
                >
                  {isEditable(ri, ci) ? '____________' : (cell || '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}