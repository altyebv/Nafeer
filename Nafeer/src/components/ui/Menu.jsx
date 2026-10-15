'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { IconButton } from './Button';
import { formatNumber } from '@/lib/format';
import { cx } from './cx';

// ─── Menu ─────────────────────────────────────────────────────────────────────
// An overflow menu behind one icon button — where secondary actions go so a
// header keeps one primary action and a couple of visible ones.
//
// items: [{ id, label, icon?, count?, onSelect, disabled? }]
//
// Keyboard follows the ARIA menu-button pattern: the trigger opens on
// Enter/Space/ArrowDown, arrows move between items, Home/End jump, Escape
// closes and returns focus to the trigger, Tab closes and moves on.

export function Menu({ items, label = 'المزيد', icon = MoreHorizontal, align = 'end', size = 'md', variant = 'secondary' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    itemRefs.current[enabled[0]]?.focus();
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) close(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
    // enabled is derived from items; re-running on open is what matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onMenuKey = (e) => {
    const cur = enabled.indexOf(itemRefs.current.indexOf(document.activeElement));
    let next = null;
    if (e.key === 'ArrowDown') next = enabled[(cur + 1) % enabled.length];
    else if (e.key === 'ArrowUp') next = enabled[(cur - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    else if (e.key === 'Tab') { close(false); return; }
    if (next == null) return;
    e.preventDefault();
    itemRefs.current[next]?.focus();
  };

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <IconButton
        ref={triggerRef}
        icon={icon}
        label={label}
        size={size}
        variant={variant}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); } }}
      />
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className={cx(
            'absolute top-full mt-2 z-popover min-w-[12rem] py-1.5',
            'bg-overlay border border-line-strong rounded-card shadow-overlay',
            align === 'end' ? 'end-0' : 'start-0',
          )}
        >
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                ref={(el) => { itemRefs.current[i] = el; }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={it.disabled}
                onClick={() => { close(); it.onSelect?.(); }}
                className="w-full flex items-center gap-2.5 h-10 px-3 t-ui text-fg text-start hover:bg-hover focus:bg-hover focus:outline-none disabled:opacity-50"
              >
                {Icon && <Icon size={16} strokeWidth={1.75} className="text-fg-muted shrink-0" aria-hidden="true" />}
                <span className="flex-1">{it.label}</span>
                {it.count > 0 && (
                  <span className="t-num t-caption min-w-5 px-1.5 rounded-full bg-accent-wash text-fg-accent text-center">
                    {formatNumber(it.count)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
