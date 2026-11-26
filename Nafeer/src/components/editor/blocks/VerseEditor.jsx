'use client';
import { useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { Field, Input, Textarea, Select, Segmented, Button, Dialog, cx } from '@/components/ui';
import { usePieces } from '@/hooks/usePieces';
import {
  readVerseMeta, isQuran, verseLines, variantPatch, patchVerseMeta,
  pieceLinesFrom, setLineMeaning, lineWords, verseProblems, verseFromPiece,
} from '@/lib/verse';

// ─── VerseEditor ──────────────────────────────────────────────────────────────
// A VERSE block: a Quran passage or poetry (docs/contract.md §3). The text is
// typed as it stands in the book, one آية or بيت per line; word meanings and
// line meanings are kept beside it in metadata, never inside the text.

const VARIANTS = [
  { id: 'quran', label: 'قرآن' },
  { id: 'poetry', label: 'شعر' },
];

export default function VerseEditor({ block, update, subjectId }) {
  const meta = readVerseMeta(block.metadata);
  const quran = isQuran(meta);
  const lines = verseLines(block.content);
  const piecesApi = usePieces(subjectId);
  const problems = verseProblems(block.content, meta, piecesApi.pieces);
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

      <Piece block={block} meta={meta} update={update} setMeta={setMeta} problems={pieceProblems} api={piecesApi} />
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
// The piece this verse shows, picked from the subject's pieces, and the lines
// of it. "املأ النص" copies those lines into the block, so the text the student
// recites is the piece's own.
function Piece({ block, meta, update, setMeta, problems, api }) {
  const { pieces, loading, error } = api;
  const piece = pieces?.find((p) => p.id === meta.pieceId) || null;
  const [from, to] = Array.isArray(meta.pieceLines) ? meta.pieceLines : [];
  const [draft, setDraft] = useState({ from: from ?? '', to: to ?? '' });
  const [form, setForm] = useState(null); // null, or the piece being created or edited

  const onRange = (key, value) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setMeta({ pieceLines: pieceLinesFrom(next.from, next.to) });
  };
  const pick = (id) => {
    setDraft({ from: '', to: '' });
    setMeta({ pieceId: id || undefined, pieceLines: undefined });
  };
  const fill = () => {
    if (!piece) return;
    const { content, patch } = verseFromPiece(piece, from, to);
    if (block.content?.trim() && block.content.trim() !== content
      && !window.confirm('النص الحالي بيتبدّل بسطور القطعة. متابعة؟')) return;
    const change = { content, metadata: patchVerseMeta(block.metadata, patch) };
    if (piece.kind === 'POETRY' && !block.caption?.trim() && piece.poet) change.caption = piece.poet;
    update(change);
  };
  // A new piece starts from what the block holds.
  const fromBlock = () => ({
    kind: isQuran(meta) ? 'QURAN' : 'POETRY',
    title: '', lines: block.content || '',
    poet: isQuran(meta) ? '' : block.caption || '', surah: meta.surah || '',
    ayahFrom: String(meta.ayah ?? '').match(/\d+/)?.[0] ?? '', ayahTo: '',
  });

  return (
    <Section title="للحفظ" collapsed={!meta.pieceId}
      hint="لو الأبيات أو الآيات دي جزء من قطعة الطالب بيحفظها. التطبيق بيراجعها معاهو سطر سطر.">
      {error && <Warning>{error}</Warning>}
      <div className="flex gap-2 items-end flex-wrap">
        <Field label="القطعة" className="flex-1 min-w-48">
          <Select value={meta.pieceId ?? ''} onChange={(e) => pick(e.target.value)} disabled={loading}>
            <option value="">{loading ? 'جاري التحميل…' : 'ما جزء من قطعة'}</option>
            {(pieces || []).map((p) => (
              <option key={p.id} value={p.id}>{p.title} · {p.lines.length} سطر</option>
            ))}
            {meta.pieceId && pieces && !piece && <option value={meta.pieceId}>{meta.pieceId} (ما موجودة)</option>}
          </Select>
        </Field>
        {piece && <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setForm({ ...piece, lines: piece.lines.join('\n') })}>عدّل القطعة</Button>}
        <Button size="sm" icon={Plus} disabled={loading || Boolean(error)} onClick={() => setForm(fromBlock())}>قطعة جديدة</Button>
      </div>

      {meta.pieceId && (
        <div className="flex gap-3 items-end flex-wrap">
          <Field label="من سطر" hint="في القطعة">
            <Input type="number" min={1} max={piece?.lines.length} value={draft.from} onChange={(e) => onRange('from', e.target.value)} dir="ltr" className="w-24" />
          </Field>
          <Field label="إلى سطر" hint="فاضي = القطعة كلها">
            <Input type="number" min={1} max={piece?.lines.length} value={draft.to} onChange={(e) => onRange('to', e.target.value)} dir="ltr" className="w-24" />
          </Field>
          {piece && <Button size="sm" onClick={fill}>املأ النص من القطعة</Button>}
        </div>
      )}
      {problems.map((p) => <Warning key={p.kind + p.message}>{p.message}</Warning>)}

      {form && (
        <PieceForm initial={form} api={api} onClose={() => setForm(null)}
          onSaved={(saved) => { setForm(null); if (!form.id) pick(saved.id); }}
          onDeleted={() => { setForm(null); }} />
      )}
    </Section>
  );
}

const KINDS = [
  { id: 'QURAN', label: 'قرآن' },
  { id: 'POETRY', label: 'شعر' },
];

function PieceForm({ initial, api, onClose, onSaved, onDeleted }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);
  const set = (patch) => setV((cur) => ({ ...cur, ...patch }));
  const quran = v.kind === 'QURAN';
  const count = verseLines(v.lines).length;

  const run = async (fn) => {
    setBusy(true); setProblem(null);
    try { await fn(); } catch (e) { setProblem(e.message); } finally { setBusy(false); }
  };
  const save = () => run(async () => {
    const body = { ...v, lines: verseLines(v.lines) };
    onSaved(v.id ? await api.update(v.id, body) : await api.create(body));
  });
  const remove = () => {
    if (!window.confirm('حذف القطعة بيحذف حفظ الطلاب فيها من التطبيق بعد النشر الجاي. متابعة؟')) return;
    run(async () => { await api.remove(v.id); onDeleted(); });
  };

  return (
    <Dialog open onClose={onClose} size="lg" title={v.id ? 'تعديل القطعة' : 'قطعة جديدة'}
      description="قطعة الحفظ: قصيدة أو أبيات منها، أو آيات. النص زي ما في الكتاب بالضبط."
      footer={(
        <>
          {v.id && <Button variant="danger" disabled={busy} onClick={remove}>احذف القطعة</Button>}
          <div className="flex-1" />
          <Button variant="ghost" disabled={busy} onClick={onClose}>إلغاء</Button>
          <Button variant="primary" loading={busy} onClick={save}>حفظ</Button>
        </>
      )}>
      <div className="space-y-4">
        <Segmented label="نوع القطعة" items={KINDS} value={v.kind} onChange={(kind) => set({ kind })} size="sm" />
        <Field label="العنوان" hint={quran ? 'مثلاً: سورة النور، 1–10' : 'مثلاً: النيل'} required>
          <Input value={v.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        {quran ? (
          <div className="grid grid-cols-3 gap-3">
            <Field label="السورة">
              <Input value={v.surah ?? ''} onChange={(e) => set({ surah: e.target.value })} placeholder="النور" />
            </Field>
            <Field label="من آية">
              <Input type="number" min={1} value={v.ayahFrom ?? ''} onChange={(e) => set({ ayahFrom: e.target.value })} dir="ltr" />
            </Field>
            <Field label="إلى آية" hint="فاضي = حسب عدد السطور">
              <Input type="number" min={1} value={v.ayahTo ?? ''} onChange={(e) => set({ ayahTo: e.target.value })} dir="ltr" />
            </Field>
          </div>
        ) : (
          <Field label="الشاعر">
            <Input value={v.poet ?? ''} onChange={(e) => set({ poet: e.target.value })} />
          </Field>
        )}
        <Field label={`السطور (${count})`} required
          hint={quran ? 'كل آية في سطر، منقولة من صفحة الكتاب.' : 'كل بيت في سطر، والصدر والعجز بينهم | '}>
          <Textarea rows={Math.min(14, Math.max(4, count + 1))} value={v.lines} onChange={(e) => set({ lines: e.target.value })}
            dir="rtl" className="font-arabic text-base leading-loose" />
        </Field>
        {problem && <p role="alert" className="t-label text-danger">{problem}</p>}
      </div>
    </Dialog>
  );
}

// ── Parts ────────────────────────────────────────────────────────────────────
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
