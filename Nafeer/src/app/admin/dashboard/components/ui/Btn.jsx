export function Btn({ children, variant = 'ghost', small = false, loading = false, onClick, disabled }) {
  const sz = small ? 'px-3 py-1.5 text-[11px]' : 'px-3 py-2 text-xs';
  const V = {
    green: 'bg-green-900/50 hover:bg-green-800/60 border border-green-700/50 text-green-400',
    red:   'bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 text-red-400',
    sand:  'bg-sand-900/40 hover:bg-sand-800/50 border border-sand-700/40 text-sand-400',
    ghost: 'bg-ink-800/60 hover:bg-ink-700/60 border border-ink-700/50 text-ink-300',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${sz} rounded-lg font-arabic font-semibold transition-all flex items-center justify-center gap-1 disabled:opacity-50 w-full ${V[variant] || V.ghost}`}
    >
      {loading ? <span className="animate-pulse font-mono text-[10px]">···</span> : children}
    </button>
  );
}