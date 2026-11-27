'use client';
import { useState } from 'react';
import { gapCount, wordBank, wrongWords } from '@/lib/fillBlank';

// ─── FillBlankWords ───────────────────────────────────────────────────────────
// The right word and the wrong ones a fill-in-the-blank question offers
// (lib/fillBlank.js). The app shows the bank in its stored order, so the right
// word is placed for the author, and the bank is shown as the student sees it.
// Wrong words live here while typed, blank rows included; the form keeps the
// finished bank in `options`.

const input =
  'min-w-0 w-full rounded-lg border border-line bg-sunken px-3 py-2 text-sm text-fg outline-none ' +
  'transition-colors placeholder:text-fg-subtle focus:border-accent-hover font-arabic';

const MAX_WRONG = 5;

export default function FillBlankWords({ textAr, answer, options, onChange, onInsertGap }) {
  const [wrong, setWrong] = useState(() => {
    const stored = wrongWords(options, answer);
    return stored.length ? stored : ['', '', ''];
  });

  const emit = (nextAnswer, nextWrong) => onChange({ correctAnswer: nextAnswer, options: wordBank(nextAnswer, nextWrong) });
  const setAnswer = (value) => emit(value, wrong);
  const setWrongAt = (i, value) => {
    const next = wrong.map((w, j) => (j === i ? value : w));
    setWrong(next);
    emit(answer, next);
  };
  const addWrong = () => setWrong([...wrong, '']);
  const removeWrong = (i) => {
    const next = wrong.filter((_, j) => j !== i);
    setWrong(next);
    emit(answer, next);
  };

  const bank = wordBank(answer, wrong);
  const gaps = gapCount(textAr);
  const noAnswer = !String(answer ?? '').trim() && wrong.some((w) => w.trim());

  return (
    <div className="space-y-3">
      {gaps !== 1 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-900/20 px-3 py-2">
          <p className="flex-1 t-caption leading-5 text-amber-500 font-arabic">
            {gaps === 0 ? 'الجملة بلا فراغ: اكتب ____ مكان الكلمة الناقصة.' : 'في الجملة أكثر من فراغ، والتطبيق يملأ الأول فقط.'}
          </p>
          {gaps === 0 && onInsertGap && (
            <button type="button" onClick={onInsertGap}
              className="shrink-0 rounded-md border border-amber-800/60 px-2 py-1 t-caption text-amber-400 hover:bg-amber-900/30 font-arabic">
              أضف فراغاً في آخرها
            </button>
          )}
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs text-emerald-400 font-arabic">الكلمة الصحيحة</p>
        <input type="text" value={answer || ''} onChange={(e) => setAnswer(e.target.value)}
          className={`${input} border-emerald-800`} placeholder="الكلمة التي تملأ الفراغ" />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-fg-muted font-arabic">كلمات خاطئة يختار الطالب من بينها</p>
        {wrong.map((w, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-2">
            <input type="text" value={w} onChange={(e) => setWrongAt(i, e.target.value)}
              className={input} placeholder="كلمة قريبة لكنها خاطئة" />
            <button type="button" onClick={() => removeWrong(i)} title="حذف الكلمة" aria-label="حذف الكلمة"
              className="rounded-lg p-2 text-fg-subtle transition-colors hover:bg-red-900/20 hover:text-red-400">×</button>
          </div>
        ))}
        {wrong.length < MAX_WRONG && (
          <button type="button" onClick={addWrong}
            className="rounded-lg border border-dashed border-line-strong px-3 py-2 text-xs text-fg-muted transition-colors hover:border-line-accent hover:text-fg-accent font-arabic">
            + كلمة خاطئة أخرى
          </button>
        )}
      </div>

      {bank.length > 0 ? (
        <div className="rounded-lg border border-line bg-sunken p-2.5">
          <p className="mb-2 t-caption text-fg-muted font-arabic">هكذا يراها الطالب، بهذا الترتيب:</p>
          <div className="flex flex-wrap gap-1.5">
            {bank.map((w) => (
              <span key={w} className={`rounded-md border px-2 py-1 text-xs font-arabic ${w === answer?.trim()
                ? 'border-emerald-700 bg-emerald-900/20 text-emerald-300' : 'border-line-strong text-fg-muted'}`}>{w}</span>
            ))}
          </div>
        </div>
      ) : (
        <p className="t-caption leading-5 text-fg-subtle font-arabic">
          بلا كلمات خاطئة يكتب الطالب الإجابة بنفسه ثم يقارنها بالنموذجية، فلا يصحّحها التطبيق.
        </p>
      )}

      {noAnswer && <p className="t-caption text-amber-500 font-arabic">اكتب الكلمة الصحيحة، وإلا فلا كلمات يختار منها الطالب.</p>}
    </div>
  );
}
