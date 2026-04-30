'use client';

const optionLabels = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

export default function MCQOptions({ options, correctIndex, onChange, onCorrectChange }) {
  const opts = options.length ? options : ['', '', '', ''];

  const updateOption = (index, value) => {
    const next = [...opts];
    next[index] = value;
    onChange(next);
  };

  const addOption = () => onChange([...opts, '']);

  const removeOption = (index) => {
    const next = opts.filter((_, idx) => idx !== index);
    onChange(next);
    if (correctIndex === index) onCorrectChange(-1);
    else if (correctIndex > index) onCorrectChange(correctIndex - 1);
  };

  return (
    <div className="space-y-2">
      {opts.map((option, index) => {
        const isCorrect = correctIndex === index;
        return (
          <div
            key={index}
            className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border p-2 transition-colors ${
              isCorrect ? 'border-emerald-700 bg-emerald-900/15' : 'border-ink-800 bg-ink-950'
            }`}
          >
            <button
              type="button"
              onClick={() => onCorrectChange(index)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-colors font-arabic ${
                isCorrect
                  ? 'border-emerald-600 bg-emerald-500/20 text-emerald-300'
                  : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-300'
              }`}
              title="تحديد كإجابة صحيحة"
            >
              {optionLabels[index] || index + 1}
            </button>
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              className="min-w-0 rounded-lg border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-sand-200 outline-none transition-colors placeholder:text-ink-600 focus:border-sand-700 focus:ring-1 focus:ring-sand-800 font-arabic"
              placeholder={`الخيار ${optionLabels[index] || index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="rounded-lg p-2 text-ink-600 transition-colors hover:bg-red-900/20 hover:text-red-400"
              title="حذف الخيار"
            >
              ×
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addOption}
        className="rounded-lg border border-dashed border-ink-700 px-3 py-2 text-xs text-ink-500 transition-colors hover:border-sand-800 hover:text-sand-400 font-arabic"
      >
        + إضافة خيار
      </button>
    </div>
  );
}
