'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignLeft, BookOpen, CircleHelp, Heading2, Image, List, Minus, PenLine, Quote, Search, Sigma, Sparkles, Table2, Zap,
} from 'lucide-react';
import { BLOCK_TYPE_CONFIG } from '@/shared/constants';
import { cx } from '@/components/ui';

// ─── AddBlockMenu ─────────────────────────────────────────────────────────────
// One menu for adding a block (DS2 step 4, canvas board EdBlockMenu): grouped
// and named, searchable, driven from the keyboard. Opened from "+ إضافة
// عنصر" under a section's last block, or by typing "/" in an empty text
// block (SectionEditor), in which case the choice replaces that empty block.
//
//   ↑ ↓ move · Enter adds · Esc closes · typing filters

const GROUPS = [
  { name: 'نص', items: [
    { type: 'TEXT', hint: 'فقرة شرح', words: 'نص فقرة كتابة' },
    { type: 'HEADING', hint: 'عنوان فرعي داخل القسم', words: 'عنوان' },
    { type: 'LIST', hint: 'نقاط أو خطوات مرقّمة', words: 'قائمة نقاط' },
    { type: 'QUOTE', hint: 'نص منقول بمصدره', words: 'اقتباس' },
  ] },
  { name: 'توضيح', items: [
    { type: 'EXAMPLE', hint: 'مثال محلول، خطوة بخطوة', words: 'مثال حل' },
    { type: 'HIGHLIGHT_BOX', hint: 'تعريف، تنبيه أو ملاحظة', words: 'مربع مهم تعريف تنبيه' },
    { type: 'TIP', hint: 'نصيحة قصيرة للطالب', words: 'نصيحة' },
    { type: 'FORMULA', hint: 'معادلة أو قانون', words: 'معادلة قانون رياضيات' },
    { type: 'TABLE', hint: 'مقارنة في صفوف وأعمدة', words: 'جدول مقارنة' },
  ] },
  { name: 'وسائط', items: [
    { type: 'IMAGE', hint: 'صورة أو شكل توضيحي', words: 'صورة رسم شكل' },
    { type: 'GIF', hint: 'حركة قصيرة تشرح خطوة', words: 'متحركة gif' },
  ] },
  { name: 'تفاعلي', items: [
    { type: 'QUESTION', hint: 'سؤال سريع قبل المتابعة', words: 'سؤال تحقق اختبار' },
  ] },
  { name: 'تنظيم', items: [
    { type: 'DIVIDER', hint: 'فاصل بين فكرتين', words: 'فاصل خط' },
  ] },
];

const ICONS = {
  TEXT: AlignLeft, HEADING: Heading2, LIST: List, QUOTE: Quote, EXAMPLE: PenLine, HIGHLIGHT_BOX: BookOpen,
  TIP: Sparkles, FORMULA: Sigma, TABLE: Table2, IMAGE: Image, GIF: Zap, QUESTION: CircleHelp, DIVIDER: Minus,
};

const label = (type) => BLOCK_TYPE_CONFIG[type]?.label || type;

export default function AddBlockMenu({ onSelect, onClose, title = 'إضافة عنصر' }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const groups = useMemo(() => {
    const q = query.trim();
    return GROUPS
      .map((g) => ({ ...g, items: g.items.filter((it) => !q || `${label(it.type)} ${it.hint} ${it.words}`.includes(q)) }))
      .filter((g) => g.items.length);
  }, [query]);
  const flat = groups.flatMap((g) => g.items);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(flat.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (flat[active]) onSelect(flat[active].type); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); }
  };

  let index = -1;
  return (
    <div role="dialog" aria-label={title} onKeyDown={onKeyDown}
      className="rounded-card border border-line-strong bg-overlay shadow-overlay overflow-hidden">
      <label className="flex items-center gap-2 px-3 h-11 border-b border-line">
        <Search size={15} className="text-fg-subtle shrink-0" aria-hidden="true" />
        <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
          aria-label="ابحث عن نوع العنصر" placeholder="ابحث: صورة، معادلة، مثال…"
          role="combobox" aria-expanded="true" aria-controls="add-block-list"
          aria-activedescendant={flat[active] ? `add-block-${flat[active].type}` : undefined}
          className="flex-1 bg-transparent t-ui text-fg placeholder:text-fg-subtle focus:outline-none" />
      </label>

      <div id="add-block-list" ref={listRef} role="listbox" aria-label="أنواع العناصر" className="max-h-80 overflow-y-auto py-1">
        {groups.map((g) => (
          <div key={g.name} role="group" aria-label={g.name}>
            <div className="px-3 pt-2 pb-1 t-caption font-semibold text-fg-subtle">{g.name}</div>
            {g.items.map((it) => {
              index += 1;
              const i = index;
              const Icon = ICONS[it.type] || AlignLeft;
              const on = i === active;
              return (
                <button key={it.type} id={`add-block-${it.type}`} type="button" role="option" aria-selected={on}
                  data-index={i} tabIndex={-1} onMouseEnter={() => setActive(i)} onClick={() => onSelect(it.type)}
                  className={cx('w-full flex items-center gap-3 px-3 py-2 text-start transition-colors', on ? 'bg-selected' : 'hover:bg-hover')}>
                  <span className={cx('w-8 h-8 shrink-0 rounded-control inline-flex items-center justify-center border', on ? 'border-line-accent text-fg-accent' : 'border-line text-fg-muted')}>
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className={cx('t-ui', on ? 'text-fg-accent' : 'text-fg')}>{label(it.type)}</span>
                    <span className="t-caption text-fg-subtle truncate">{it.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        {!flat.length && <p className="px-3 py-4 t-label text-fg-subtle">لا نوع بهذا الاسم.</p>}
      </div>

      <div className="flex gap-4 px-3 py-2 border-t border-line t-caption text-fg-subtle" aria-hidden="true">
        <span>↑↓ للتنقل</span><span>Enter للإضافة</span><span>Esc للإغلاق</span>
      </div>
    </div>
  );
}
