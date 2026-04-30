'use client';

export default function OrderItems({ items, onChange }) {
  const rows = items.length ? items : ['', '', ''];

  const updateItem = (index, value) => {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  };

  const addItem = () => onChange([...rows, '']);
  const removeItem = (index) => onChange(rows.filter((_, idx) => idx !== index));

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-600 font-arabic">اكتب العناصر بالترتيب الصحيح. سيظهر ترتيبها مختلطا للطالب.</p>
      {rows.map((item, index) => (
        <div key={index} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-ink-800 bg-ink-950 p-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-800 bg-ink-900 text-xs text-ink-500 font-mono">
            {index + 1}
          </span>
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            className="min-w-0 rounded-lg border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-sand-200 outline-none transition-colors placeholder:text-ink-600 focus:border-sand-700 focus:ring-1 focus:ring-sand-800 font-arabic"
            placeholder={`العنصر ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="rounded-lg p-2 text-ink-600 transition-colors hover:bg-red-900/20 hover:text-red-400"
            title="حذف العنصر"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="rounded-lg border border-dashed border-ink-700 px-3 py-2 text-xs text-ink-500 transition-colors hover:border-sand-800 hover:text-sand-400 font-arabic"
      >
        + إضافة عنصر
      </button>
    </div>
  );
}
