'use client';
import { useEffect } from 'react';
import { Menu, X, Plus, LogOut } from 'lucide-react';
import { NAV, NAV_GROUPS } from '../constants';

// Sidebar on large screens; under `lg` it becomes a drawer opened from a top
// bar, so the dashboard stays usable on a laptop split-screen or a tablet.

function NavItem({ item, active, count, onSelect }) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onSelect(item.id)}
      aria-current={active ? 'page' : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-right ${
        active
          ? 'bg-sand-900/50 text-sand-200'
          : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/60'
      }`}
    >
      <Icon size={17} strokeWidth={1.75} className={`shrink-0 ${active ? 'text-sand-400' : 'text-ink-500'}`} />
      <span className="flex-1 font-arabic truncate">{item.label}</span>
      {count > 0 && (
        <span className="text-xs font-mono tabular-nums px-1.5 min-w-[1.5rem] text-center rounded-full bg-warn-surface border border-warn-border text-warn">
          {count}
        </span>
      )}
    </button>
  );
}

export function AdminSidebar({ section, badges, open, onOpenChange, onSelect, onCreateContributor, onSignOut }) {
  const current = NAV.find((item) => item.id === section);

  // Close the drawer with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const select = (id) => { onSelect(id); onOpenChange(false); };

  return (
    <>
      {/* Top bar — small screens only */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-4 bg-ink-900/95 backdrop-blur-sm border-b border-ink-800/60">
        <button
          onClick={() => onOpenChange(true)}
          aria-label="فتح القائمة"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-300 hover:bg-ink-800/60 transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="text-lg font-arabic font-bold text-sand-400">نفير</span>
        {current && <span className="text-sm font-arabic text-ink-400 truncate">/ {current.label}</span>}
      </header>

      {/* Drawer backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed right-0 top-0 h-screen w-64 bg-ink-900 border-l border-ink-800/60 flex flex-col z-50 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 shrink-0 px-5 flex items-center justify-between border-b border-ink-800/60">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-arabic font-bold text-sand-400">نفير</span>
            <span className="text-xs font-arabic text-ink-500">لوحة التحكم</span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="إغلاق القائمة"
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:bg-ink-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group, i) => (
            <div key={group.label || i}>
              {group.label && (
                <p className="px-3 mb-1.5 text-xs font-arabic font-semibold text-ink-600">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    active={section === item.id}
                    count={item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0}
                    onSelect={select}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="shrink-0 px-3 py-3 border-t border-ink-800/60 space-y-1">
          <button
            onClick={() => { onCreateContributor(); onOpenChange(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-arabic font-semibold bg-sand-600 hover:bg-sand-500 text-ink-950 transition-colors"
          >
            <Plus size={16} strokeWidth={2.25} />
            <span>مساهم جديد</span>
          </button>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-arabic text-ink-500 hover:text-danger hover:bg-danger-surface transition-colors"
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
