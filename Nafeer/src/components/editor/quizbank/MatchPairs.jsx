'use client';

export default function MatchPairs({ pairs, onChange }) {
  const rows = pairs.length ? pairs : [{ right: '', left: '' }, { right: '', left: '' }];

  const updatePair = (index, side, value) => {
    const next = [...rows];
    next[index] = { ...next[index], [side]: value };
    onChange(next);
  };

  const addPair = () => onChange([...rows, { right: '', left: '' }]);
  const removePair = (index) => onChange(rows.filter((_, idx) => idx !== index));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 px-2 text-xs text-ink-600 font-arabic">
        <span>العمود الأيمن</span>
        <span />
        <span>العمود الأيسر</span>
        <span />
      </div>
      {rows.map((pair, index) => (
        <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 rounded-xl border border-ink-800 bg-ink-950 p-2">
          <input
            type="text"
            value={pair.right}
            onChange={(e) => updatePair(index, 'right', e.target.value)}
            className="min-w-0 rounded-lg border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-sand-200 outline-none transition-colors placeholder:text-ink-600 focus:border-sand-700 focus:ring-1 focus:ring-sand-800 font-arabic"
            placeholder={`أ${index + 1}`}
          />
          <span className="text-ink-700">↔</span>
          <input
            type="text"
            value={pair.left}
            onChange={(e) => updatePair(index, 'left', e.target.value)}
            className="min-w-0 rounded-lg border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-sand-200 outline-none transition-colors placeholder:text-ink-600 focus:border-sand-700 focus:ring-1 focus:ring-sand-800 font-arabic"
            placeholder={`ب${index + 1}`}
          />
          <button
            type="button"
            onClick={() => removePair(index)}
            className="rounded-lg p-2 text-ink-600 transition-colors hover:bg-red-900/20 hover:text-red-400"
            title="حذف الزوج"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addPair}
        className="rounded-lg border border-dashed border-ink-700 px-3 py-2 text-xs text-ink-500 transition-colors hover:border-sand-800 hover:text-sand-400 font-arabic"
      >
        + إضافة زوج
      </button>
    </div>
  );
}
