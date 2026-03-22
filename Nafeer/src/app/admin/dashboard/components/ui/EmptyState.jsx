export function EmptyState({ text, sub }) {
  return (
    <div className="text-center py-24">
      <div className="text-ink-800 text-4xl mb-4 select-none">◌</div>
      <p className="text-ink-600 font-arabic text-sm">{text}</p>
      {sub && <p className="text-ink-700 font-arabic text-xs mt-2">{sub}</p>}
    </div>
  );
}
 
