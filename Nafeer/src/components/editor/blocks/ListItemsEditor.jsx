'use client';
import { useEffect, useRef, useState } from 'react';
import { CornerDownLeft, IndentDecrease, IndentIncrease, Lightbulb, X } from 'lucide-react';
import { cx } from '@/components/ui';
import { listContent, listRows } from '@/lib/listItems';

// ─── ListItemsEditor ──────────────────────────────────────────────────────────
// A list block's items, one row each (lib/listItems.js). An item may open a
// concept in the app, and may sit under the item above it as a sub-item.
//   Enter            a new item below
//   Backspace        on an empty item, removes it
//   Tab / Shift+Tab  makes it a sub-item / an item again
//   pasting lines    one item per line
// Rows live here while typed, empty ones included; the block keeps what
// listContent writes.

const FIELD =
  'min-w-0 flex-1 h-9 px-3 rounded-control bg-sunken border border-line-strong text-fg text-sm font-arabic ' +
  'hover:border-line-accent focus:border-accent-hover focus:outline-none placeholder:text-fg-subtle';

const blankRow = (level = 0) => ({ text: '', conceptRef: null, level });

export default function ListItemsEditor({ block, update, concepts = [] }) {
  const [rows, setRows] = useState(() => {
    const loaded = listRows(block.content, block.metadata);
    return loaded.length ? loaded : [blankRow()];
  });
  const [focus, setFocus] = useState(null);
  const inputs = useRef([]);

  useEffect(() => {
    if (focus == null) return;
    inputs.current[focus]?.focus();
    setFocus(null);
  }, [focus]);

  const save = (next) => {
    setRows(next);
    const { content, hasConceptLinks } = listContent(next);
    update({ content, metadata: { ...(block.metadata || {}), hasConceptLinks } });
  };
  const setRow = (i, patch) => save(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const insertAt = (i, row) => { save([...rows.slice(0, i), row, ...rows.slice(i)]); setFocus(i); };
  const remove = (i) => {
    const next = rows.filter((_, j) => j !== i);
    save(next.length ? next : [blankRow()]);
    setFocus(Math.max(0, i - 1));
  };
  // The first row has nothing above it to sit under.
  const setLevel = (i, level) => { if (i > 0 || level === 0) setRow(i, { level }); };

  const onKeyDown = (i, e) => {
    if (e.key === 'Enter') { e.preventDefault(); insertAt(i + 1, blankRow(rows[i].level)); }
    else if (e.key === 'Backspace' && rows[i].text === '' && rows.length > 1) { e.preventDefault(); remove(i); }
    else if (e.key === 'Tab') { e.preventDefault(); setLevel(i, e.shiftKey ? 0 : 1); }
  };
  const onPaste = (i, e) => {
    const lines = e.clipboardData.getData('text').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    e.preventDefault();
    const level = rows[i].level;
    const pasted = lines.map((text) => ({ text, conceptRef: null, level }));
    const keepCurrent = rows[i].text.trim() !== '';
    save([...rows.slice(0, keepCurrent ? i + 1 : i), ...pasted, ...rows.slice(i + 1)]);
    setFocus((keepCurrent ? i + 1 : i) + pasted.length - 1);
  };

  const linked = rows.some((r) => r.conceptRef || r.level === 1);

  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => (
        <div key={i} className={cx('flex items-center gap-1.5', row.level === 1 && 'ps-7')}>
          <input
            ref={(el) => { inputs.current[i] = el; }}
            type="text" value={row.text} autoFocus={i === 0 && !row.text}
            onChange={(e) => setRow(i, { text: e.target.value })}
            onKeyDown={(e) => onKeyDown(i, e)} onPaste={(e) => onPaste(i, e)}
            className={cx(FIELD, row.conceptRef && 'underline decoration-dotted underline-offset-4')}
            placeholder={row.level === 1 ? 'عنصر فرعي…' : `العنصر ${i + 1}…`}
            aria-label={`${row.level === 1 ? 'عنصر فرعي' : 'عنصر'} ${i + 1}`} />

          {concepts.length > 0 && (
            <label className="relative shrink-0" title={row.conceptRef ? 'يفتح هذا المفهوم في التطبيق' : 'اربط العنصر بمفهوم'}>
              <Lightbulb size={13} className={cx('pointer-events-none absolute top-1/2 -translate-y-1/2 start-2', row.conceptRef ? 'text-fg-accent' : 'text-fg-subtle')} />
              <select value={row.conceptRef || ''} onChange={(e) => setRow(i, { conceptRef: e.target.value || null })}
                aria-label={`مفهوم العنصر ${i + 1}`}
                className={cx('h-9 w-32 ps-7 pe-2 rounded-control border text-xs font-arabic bg-sunken focus:outline-none appearance-none cursor-pointer',
                  row.conceptRef ? 'border-line-accent text-fg-accent' : 'border-line text-fg-muted')}>
                <option value="">بلا مفهوم</option>
                {concepts.map((c) => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
              </select>
            </label>
          )}

          {row.level === 1 ? (
            <button type="button" onClick={() => setLevel(i, 0)} title="اجعله عنصراً (Shift+Tab)" aria-label="اجعله عنصراً"
              className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-control text-fg-muted hover:bg-hover touch-target"><IndentDecrease size={14} /></button>
          ) : (
            <button type="button" onClick={() => setLevel(i, 1)} disabled={i === 0} title="اجعله تحت العنصر السابق (Tab)" aria-label="اجعله عنصراً فرعياً"
              className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-control text-fg-muted hover:bg-hover disabled:opacity-30 touch-target"><IndentIncrease size={14} /></button>
          )}
          <button type="button" onClick={() => remove(i)} title="حذف العنصر" aria-label={`حذف العنصر ${i + 1}`}
            className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-control text-fg-muted hover:text-danger hover:bg-hover touch-target"><X size={14} /></button>
        </div>
      ))}

      <button type="button" onClick={() => insertAt(rows.length, blankRow())}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control border border-dashed border-line-strong t-caption text-fg-muted hover:text-fg-accent hover:border-line-accent touch-target">
        <CornerDownLeft size={13} /> عنصر جديد
      </button>
      <p className="t-caption text-fg-subtle">
        Enter لعنصر جديد · Tab ليصبح فرعياً · ألصق عدة أسطر لتصير عناصر.
        {linked ? ' العنصر المربوط بمفهوم يفتحه الطالب بلمسة.' : ''}
      </p>
    </div>
  );
}
