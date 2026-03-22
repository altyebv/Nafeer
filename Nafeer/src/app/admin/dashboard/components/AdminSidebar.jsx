'use client';
import { NAV } from '../_constants';

export function AdminSidebar({ section, badges, onSelect, onCreateContributor, onSignOut }) {
  return (
    <aside className="fixed right-0 top-0 h-screen w-56 bg-ink-900 border-l border-ink-800/60 flex flex-col z-30">

      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-ink-800/60">
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-arabic font-bold text-sand-400">نافير</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-sand-900/50 border border-sand-800/60 text-sand-600 tracking-widest">
            ADMIN
          </span>
        </div>
        <p className="text-[11px] text-ink-600 font-mono mt-1">لوحة التحكم</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const count  = item.badgeKey ? (badges[item.badgeKey] ?? null) : null;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-right ${
                active
                  ? 'bg-sand-900/50 text-sand-300 border border-sand-800/50'
                  : 'text-ink-500 hover:text-ink-200 hover:bg-ink-800/60 border border-transparent'
              }`}
            >
              <span className={`text-base shrink-0 ${active ? 'text-sand-400' : 'text-ink-600'}`}>
                {item.icon}
              </span>
              <span className="flex-1 font-arabic">{item.label}</span>
              {count != null && count > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-900/50 border border-amber-700/40 text-amber-400">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Add contributor */}
      <div className="px-3 pb-3 border-t border-ink-800/60 pt-3">
        <button
          onClick={onCreateContributor}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-sand-700/20 hover:bg-sand-700/40 border border-sand-800/50 text-sand-400 hover:text-sand-300 transition-all"
        >
          <span className="text-base shrink-0 leading-none">+</span>
          <span className="font-arabic">مساهم جديد</span>
        </button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-5 pt-1">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono text-ink-700 hover:text-red-400 hover:bg-red-950/30 transition-all border border-transparent hover:border-red-900/40"
        >
          <span>↩</span>
          <span>LOGOUT</span>
        </button>
      </div>
    </aside>
  );
}