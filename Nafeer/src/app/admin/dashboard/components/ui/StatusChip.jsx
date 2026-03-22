export function StatusChip({ status }) {
  const CFG = {
    approved: 'bg-green-900/30 text-green-500 border-green-900/40',
    review:   'bg-amber-900/30 text-amber-400 border-amber-900/40',
    draft:    'bg-ink-800/60 text-ink-600 border-ink-700/30',
  };
  const LABELS = { approved: 'معتمد', review: 'للمراجعة', draft: 'مسودة' };
  const s = status || 'draft';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border font-arabic ${CFG[s] || CFG.draft}`}>
      {LABELS[s] || s}
    </span>
  );
}