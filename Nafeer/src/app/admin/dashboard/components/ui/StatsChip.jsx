export function StatChips({ stats }) {
  return (
    <div className="flex items-center gap-2.5 mt-4 flex-wrap">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-800/60 border border-ink-700/40">
          <span className={`font-bold leading-none ${s.mono ? 'font-mono text-sm' : 'text-base font-mono'} ${s.color}`}>
            {s.count}
          </span>
          <span className="text-2xs text-ink-600 font-arabic">{s.label}</span>
        </div>
      ))}
    </div>
  );
}