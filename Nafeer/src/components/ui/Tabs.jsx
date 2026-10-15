'use client';
import { useRef } from 'react';
import { formatNumber } from '@/lib/format';
import { cx } from './cx';

// ─── Tabs / Segmented ─────────────────────────────────────────────────────────
// Both are controlled (`value` + `onChange`) and keyboard-complete: arrow keys
// move between options — mirrored under RTL, so the physical left arrow means
// "next" in Arabic — and Home / End jump to the ends. Only the current option
// is a tab stop (roving tabindex), as the ARIA patterns specify.

function useRoving(items, value, onChange) {
  const refs = useRef({});
  const onKeyDown = (e) => {
    const ids = items.filter((it) => !it.disabled).map((it) => it.id);
    const i   = ids.indexOf(value);
    if (i < 0) return;
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next = null;
    if (e.key === fwd)        next = ids[(i + 1) % ids.length];
    else if (e.key === back)  next = ids[(i - 1 + ids.length) % ids.length];
    else if (e.key === 'Home') next = ids[0];
    else if (e.key === 'End')  next = ids[ids.length - 1];
    if (next == null) return;
    e.preventDefault();
    onChange(next);
    refs.current[next]?.focus();
  };
  return { refs, onKeyDown };
}

/**
 * items: [{ id, label, count?, disabled? }]
 * idBase ties each tab to its panel: tab `${idBase}-tab-${id}` controls
 * `${idBase}-panel-${id}` — render panels with <TabPanel idBase id active>.
 */
export function Tabs({ items, value, onChange, idBase, label, className }) {
  const { refs, onKeyDown } = useRoving(items, value, onChange);
  return (
    <div role="tablist" aria-label={label} className={cx('flex gap-1 overflow-x-auto scrollbar-none', className)}>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            ref={(el) => { refs.current[it.id] = el; }}
            type="button"
            role="tab"
            id={idBase ? `${idBase}-tab-${it.id}` : undefined}
            aria-controls={idBase ? `${idBase}-panel-${it.id}` : undefined}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={it.disabled}
            onClick={() => onChange(it.id)}
            onKeyDown={onKeyDown}
            className={cx(
              'relative h-10 px-3.5 inline-flex items-center gap-1.5 whitespace-nowrap t-ui border-b-2 -mb-px',
              'transition-colors duration-fast ease-out-soft disabled:opacity-50',
              active
                ? 'border-accent-hover text-fg-strong font-semibold'
                : 'border-transparent text-fg-muted hover:text-fg',
            )}
          >
            {it.label}
            {it.count != null && (
              <span className="t-num t-caption px-1.5 rounded-full bg-hover text-fg-muted">{formatNumber(it.count)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idBase, id, active, children, className }) {
  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${id}`}
      aria-labelledby={`${idBase}-tab-${id}`}
      hidden={!active}
      className={className}
    >
      {active && children}
    </div>
  );
}

/**
 * A small set of mutually exclusive options shown side by side — replaces the
 * section header's unlabelled 🧠 / 💾 / ⚡ toggles. `label` names the group.
 * items: [{ id, label, hint? }] — hint becomes the option's tooltip.
 */
export function Segmented({ items, value, onChange, label, size = 'md', className }) {
  const { refs, onKeyDown } = useRoving(items, value, onChange);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('inline-flex w-fit max-w-full p-0.5 rounded-control bg-sunken border border-line', className)}
    >
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            ref={(el) => { refs.current[it.id] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={it.hint}
            onClick={() => onChange(it.id)}
            onKeyDown={onKeyDown}
            className={cx(
              'rounded-[8px] whitespace-nowrap font-ui transition-colors duration-fast ease-out-soft touch-target',
              size === 'sm' ? 'h-7 px-2.5 t-caption' : 'h-8 px-3.5 t-label',
              active ? 'bg-selected text-fg-accent font-semibold' : 'text-fg-muted hover:text-fg',
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
