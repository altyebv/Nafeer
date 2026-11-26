'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Field, Input, Textarea, Select, Segmented, Button, cx } from '@/components/ui';
import {
  readVerseMeta, isQuran, verseLines, variantPatch, patchVerseMeta,
  pieceLinesFrom, setLineMeaning, lineWords, verseProblems,
} from '@/lib/verse';

// ─── VerseEditor ──────────────────────────────────────────────────────────────
// A VERSE block: a Quran passage or poetry (docs/contract.md §3). The text is
// typed as it stands in the book, one آية or بيت per line; word meanings and
// line meanings are kept beside it in metadata, never inside the text.

const VARIANTS = [
  { id: 'quran', label: 'قرآن' },
  { id: 'poetry', label: 'شعر' },
];

export default function VerseEditor({ block, update }) {
  const meta = readVerseMeta(block.metadata);
  const quran = isQuran(meta);
  const lines = verseLines(block.content);
  const problems = verseProblems(block.content, meta);
  const words = Array.isArray(meta.words) ? meta.words : [];
  const meanings = Array.isArray(meta.meanings) ? meta.meanings : [];

  const setMeta = (patch) => update({ metadata: patchVerseMeta(block.metadata, patch) });
  const setWords = (next) => setMeta({ words: next.length ? next : undefined });
  const setMeanings = (next) => setMeta({ meanings: next.length ? next : undefined });

  const textProblems = problems.filter((p) => p.kind === 'marks' || p.kind === 'markup');
  const pieceProblems = problems.filter((p) => p.kind === 'pieceLines' || p.kind === 'pieceId');
  const wordProblem = (i) => problems.find((p) => p.kind === 'word' && p.index === i)?.message;
  const orphanMeanings = problems.filter((p) => p.kind === 'meaning');

  return (
    <div className="space-y-4">
      <Segmented label="نوع النص" items={VARIANTS} value={quran ? 'quran' : 'poetry'}
        onChange={(v) => setMeta(variantPatch(v))} size="sm" />

      {quran ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="السورة" hint="الاسم بس، من غير «سورة»">
            <Input value={meta.surah ?? ''} onChange={(e) => setMeta({ surah: e.target.value })} placeholder="النور" />
          </Field>
          <Field label="الآية" hint="رقم أول آية، أو المدى">
            <Input value={meta.ayah == null ? '' : String(meta.ayah)} onChange={(e) => setMeta({ ayah: e.target.value })}
              placeholder="39–40" dir="ltr" />
          </Field>
        </div>
      ) : (
        <Field label="القائل والمناسبة" hint="بيظهر تحت الأبيات">
          <Input value={block.caption ?? ''} onChange={(e) => update({ caption: e.target.value })} placeholder="من قصيدة النيل لجمّاع" />
        </Field>
      )}

      <Field label={quran ? 'نص الآيات' : 'الأبيات'}
        hint={quran
          ? 'كل آية في سطر، زي ما في الكتاب بالضبط. التطبيق بيضيف ﴿ ﴾ وأرقام الآيات.'
          : 'كل بيت في سطر، والصدر والعجز بينهم | '}>
        <Textarea autoFocus rows={Math.max(3, lines.length + 1)} value={block.content ?? ''}
          onChange={(e) => update({ content: e.target.value })} dir="rtl"
          className="font-arabic text-base leading-loose"
          placeholder={quran ? 'أَوْ كَظُلُمَاتٍ فِي بَحْرٍ لُّجِّيٍّ…' : 'الصدر | العجز'} />
      </Field>
      {textProblems.map((p) => <Warning key={p.kind}>{p.message}</Warning>)}

      {quran && (
        <Field label="سطر تحت الآيات (اختياري)" hint="لو فاضي، بيظهر اسم السورة ورقم الآية">
          <Input value={block.caption ?? ''} onChange={(e) => update({ caption: e.target.value })} />
        </Field>
      )}

      <Words lines={lines} words={words} setWords={setWords} wordProblem={wordProblem} />

      <Meanings lines={lines} meanings={meanings} setMeanings={setMeanings} orphans={orphanMeanings} />

      <Piece meta={meta} setMeta={setMeta} problems={pieceProblems} />
    </div>
  );
}

// ── Word meanings ─────────────────────────────────────────────────────────────
function Words({ lines, words, setWords, wordProblem }) {
  const [picking, setPicking] = useState(false);
  const setWord = (i, patch) => setWords(words.map((w, j) => (j === i ? { ...w, ...patch } : w)));
  const add = (line, word = '') => setWords([...words, { line, word, meaning: '' }]);

  return (
    <Section title="معاني المفردات" count={words.length}
      hint="الكلمة تتكتب زي ما هي في سطرها بالتشكيل؛ التطبيق بيلقاها ويعلّم عليها.">
      {words.map((w, i) => (
        <div key={i} className="space-y-1">
          <div className="flex gap-2 items-start">
            <div className="w-20 shrink-0">
              <Select aria-label="السطر" value={w.line ?? ''} onChange={(e) => setWord(i, { line: Number(e.target.value) })}>
                {!lines.length && <option value="">—</option>}
                {lines.map((_, n) => <option key={n} value={n + 1}>سطر {n + 1}</option>)}
                {Number.isInteger(w.line) && w.line > lines.length && <option value={w.line}>سطر {w.line}</option>}
              </Select>
            </div>
            <Input aria-label="الكلمة" value={w.word ?? ''} onChange={(e) => setWord(i, { word: e.target.value })}
              placeholder="الكلمة" className="w-36 shrink-0 font-arabic" />
            <Input aria-label="معناها" value={w.meaning ?? ''} onChange={(e) => setWord(i, { meaning: e.target.value })}
              placeholder="معناها" className="flex-1" />
            <Button variant="ghost" size="sm" icon={X} aria-label="احذف الكلمة" title="احذف الكلمة"
              onClick={() => setWords(words.filter((_, j) => j !== i))} />
          </div>
          {wordProblem(i) && <Warning>{wordProblem(i)}</Warning>}
        </div>
      ))}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" icon={Plus} disabled={!lines.length} onClick={() => setPicking((v) => !v)}>
          {picking ? 'خلاص' : 'اختار كلمة من النص'}
        </Button>
        <Button size="sm" variant="ghost" disabled={!lines.length} onClick={() => add(1)}>كلمة فاضية</Button>
      </div>

      {picking && (
        <ol className="space-y-2 rounded-control border border-line bg-sunken p-3">
          {lines.map((line, n) => (
            <li key={n} className="flex gap-2 items-baseline">
              <span className="t-caption text-fg-subtle w-6 shrink-0">{n + 1}</span>
              <span className="flex flex-wrap gap-1">
                {lineWords(line).map((word, k) => {
                  const taken = words.some((w) => w.line === n + 1 && w.word === word);
                  return (
                    <button key={k} type="button" disabled={taken} onClick={() => add(n + 1, word)}
                      className={cx('px-1.5 rounded-control font-arabic text-base leading-loose border transition-colors',
                        taken ? 'border-line-accent text-fg-accent bg-selected cursor-default' : 'border-transparent text-fg hover:bg-hover hover:border-line')}>
                      {word}
                    </button>
                  );
                })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

// ── Line meanings ─────────────────────────────────────────────────────────────
function Meanings({ lines, meanings, setMeanings, orphans }) {
  const textOf = (n) => meanings.find((m) => m?.line === n)?.text ?? '';
  const filled = meanings.filter((m) => String(m?.text ?? '').trim()).length;

  return (
    <Section title="معنى كل سطر" count={filled} hint="اختياري. الطالب بيضغط على السطر عشان يشوف معناه.">
      {!lines.length && <p className="t-caption text-fg-subtle">اكتب النص أول.</p>}
      {lines.map((line, n) => (
        <div key={n} className="space-y-1">
          <p className="font-arabic text-sm leading-loose text-fg-muted truncate" dir="rtl">
            <span className="t-caption text-fg-subtle ms-0 me-2">{n + 1}</span>{line}
          </p>
          <Input aria-label={`معنى السطر ${n + 1}`} value={textOf(n + 1)}
            onChange={(e) => setMeanings(setLineMeaning(meanings, n + 1, e.target.value))} placeholder="معنى السطر" />
        </div>
      ))}
      {orphans.map((p) => (
        <div key={p.index} className="flex items-center gap-2">
          <Warning className="flex-1">{p.message}</Warning>
          <Button size="sm" variant="ghost" onClick={() => setMeanings(meanings.filter((_, j) => j !== p.index))}>احذفو</Button>
        </div>
      ))}
    </Section>
  );
}

// ── Memorization piece ────────────────────────────────────────────────────────
function Piece({ meta, setMeta, problems }) {
  const [from, to] = Array.isArray(meta.pieceLines) ? meta.pieceLines : [];
  const setRange = (a, b) => setMeta({ pieceLines: pieceLinesFrom(a, b) });
  const [draft, setDraft] = useState({ from: from ?? '', to: to ?? '' });
  const onRange = (key, value) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setRange(next.from, next.to);
  };

  return (
    <Section title="للحفظ" hint="لو الأبيات أو الآيات دي جزء من قطعة الطالب بيحفظها. قطع الحفظ لسه ما عندها مكتبة في نفير؛ اكتب معرّفها زي ما متفق عليهو."
      collapsed={!meta.pieceId && meta.pieceLines == null}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="معرّف القطعة" className="col-span-3 sm:col-span-1">
          <Input value={meta.pieceId ?? ''} onChange={(e) => setMeta({ pieceId: e.target.value.trim() })} placeholder="qr_nur" dir="ltr" />
        </Field>
        <Field label="من سطر" hint="في القطعة">
          <Input type="number" min={1} value={draft.from} onChange={(e) => onRange('from', e.target.value)} dir="ltr" />
        </Field>
        <Field label="إلى سطر" hint="فاضي = القطعة كلها">
          <Input type="number" min={1} value={draft.to} onChange={(e) => onRange('to', e.target.value)} dir="ltr" />
        </Field>
      </div>
      {problems.map((p) => <Warning key={p.kind}>{p.message}</Warning>)}
    </Section>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────
function Section({ title, count, hint, collapsed = false, children }) {
  return (
    <details open={!collapsed} className="group rounded-control border border-line">
      <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none list-none t-label text-fg">
        <span className="text-fg-subtle transition-transform group-open:-rotate-90" aria-hidden="true">‹</span>
        {title}
        {count > 0 && <span className="t-caption text-fg-accent">{count}</span>}
      </summary>
      <div className="px-3 pb-3 space-y-3">
        {hint && <p className="t-caption text-fg-subtle">{hint}</p>}
        {children}
      </div>
    </details>
  );
}

function Warning({ children, className }) {
  return <p role="status" className={cx('t-caption text-warn', className)}>{children}</p>;
}
