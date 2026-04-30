'use client';

// ─── MCQOptions ───────────────────────────────────────────────────────────────
// Renders the option list for an MCQ question.
// Correct answer is tracked by index to avoid text-equality bugs when the
// option text changes while the answer is already set.

export default function MCQOptions({ options, correctIndex, onChange, onCorrectChange }) {
  const opts = options.length ? options : ['', '', '', ''];

  const updateOption = (i, val) => {
    const next = [...opts];
    next[i] = val;
    onChange(next);
  };

  const addOption = () => onChange([...opts, '']);

  const removeOption = (i) => {
    const next = opts.filter((_, idx) => idx !== i);
    onChange(next);
    if (correctIndex === i) onCorrectChange(-1);
    else if (correctIndex > i) onCorrectChange(correctIndex - 1);
  };

  return (
    <div className="space-y-2">
      {opts.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            onClick={() => onCorrectChange(i)}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-colors
              ${correctIndex === i
                ? 'border-emerald-500 bg-emerald-500/20'
                : 'border-ink-600 hover:border-ink-400'
              }`}
            title="اضغط لتحديد كإجابة صحيحة"
          />
          <input
            type="text"
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            className="flex-1 px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
            placeholder={`الخيار ${String.fromCharCode(0x0623 + i)}`}
          />
          <button
            onClick={() => removeOption(i)}
            className="text-ink-600 hover:text-red-500 transition-colors p-1"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addOption}
        className="text-xs text-ink-600 hover:text-sand-500 transition-colors font-arabic"
      >
        + إضافة خيار
      </button>
    </div>
  );
}