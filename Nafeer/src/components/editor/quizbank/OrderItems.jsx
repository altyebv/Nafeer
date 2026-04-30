'use client';

// ─── OrderItems ───────────────────────────────────────────────────────────────
// Renders the item list for an ORDER question.
// Items are entered in the correct order; the app shuffles them at render time.

export default function OrderItems({ items, onChange }) {
  const updateItem  = (i, val) => { const next = [...items]; next[i] = val; onChange(next); };
  const addItem     = () => onChange([...items, '']);
  const removeItem  = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-600 font-arabic">أدخل العناصر بالترتيب الصحيح:</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-ink-600 font-mono w-5 text-center">{i + 1}</span>
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            className="flex-1 px-2 py-2 bg-ink-950 border border-ink-700 rounded text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
            placeholder={`العنصر ${i + 1}`}
          />
          <button onClick={() => removeItem(i)} className="text-ink-600 hover:text-red-500 p-1">✕</button>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-ink-600 hover:text-sand-500 font-arabic">
        + إضافة عنصر
      </button>
    </div>
  );
}