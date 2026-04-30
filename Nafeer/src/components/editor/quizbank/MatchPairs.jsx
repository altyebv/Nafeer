'use client';

// ─── MatchPairs ───────────────────────────────────────────────────────────────
// Renders the pair list for a MATCH question.

export default function MatchPairs({ pairs, onChange }) {
  const updatePair = (i, side, val) => {
    const next = [...pairs];
    next[i] = { ...next[i], [side]: val };
    onChange(next);
  };

  const addPair    = () => onChange([...pairs, { right: '', left: '' }]);
  const removePair = (i) => onChange(pairs.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs text-ink-600 font-arabic px-1">
        <span>العمود الأيمن</span>
        <span>العمود الأيسر</span>
      </div>
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={pair.right}
            onChange={(e) => updatePair(i, 'right', e.target.value)}
            className="flex-1 px-2 py-2 bg-ink-950 border border-ink-700 rounded text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
            placeholder={`أ${i + 1}`}
          />
          <span className="text-ink-700">↔</span>
          <input
            type="text"
            value={pair.left}
            onChange={(e) => updatePair(i, 'left', e.target.value)}
            className="flex-1 px-2 py-2 bg-ink-950 border border-ink-700 rounded text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
            placeholder={`ب${i + 1}`}
          />
          <button onClick={() => removePair(i)} className="text-ink-600 hover:text-red-500 p-1">✕</button>
        </div>
      ))}
      <button onClick={addPair} className="text-xs text-ink-600 hover:text-sand-500 font-arabic">
        + إضافة زوج
      </button>
    </div>
  );
}