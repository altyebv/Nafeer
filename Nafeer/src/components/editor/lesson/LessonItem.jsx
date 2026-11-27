'use client';
import { createContext, useContext, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Pencil, Plus, StickyNote, TriangleAlert } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import { useShallow } from 'zustand/react/shallow';
import { VARIATION_CONFIG } from '@/components/editor/lesson/LinkVariationModal';
import { lessonHref } from '@/components/editor/layout/nav';
import { lessonReadiness, countsInWords, isAutoTitle } from '@/lib/lessonReadiness';
import { Badge, Button, ConfirmButton, cx } from '@/components/ui';
import { BOARD_BY_ID, canHandBack, lessonState } from '@/lib/board';

// Who is looking, so a row can offer «تولَّ» or hand-back. Set by LessonsPage.
export const ViewerContext = createContext({ me: null, name: '' });

// ─── LessonItem ───────────────────────────────────────────────────────────────
// One full-width row per lesson (DS2 step 6, EdLessonsList): the title links to
// the editor, six readiness marks say what is done, what it holds is said in
// words, and the board state with who holds it (lib/board.js).

export default function LessonItem({ lesson, index, onAddVariation, isVariation, unitLabel }) {
  const { sections, blocks, questions, feedItems, updateLesson } = useDataStore(
    useShallow((s) => ({ sections: s.sections, blocks: s.blocks, questions: s.questions, feedItems: s.feedItems, updateLesson: s.updateLesson })),
  );

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(lesson.title);
  const inputRef = useRef(null);
  useEffect(() => { if (editingTitle) inputRef.current?.focus(); }, [editingTitle]);

  const r = lessonReadiness(lesson, { sections, blocks, questions, feedItems });
  const varCfg = lesson.variationType ? VARIATION_CONFIG[lesson.variationType] : null;
  const { me, name } = useContext(ViewerContext);
  const state = BOARD_BY_ID[lessonState(lesson, r.counts.sections > 0)];
  const mine = !!me && lesson.owner === me && !lesson.unclaimed;
  const holder = lesson.unclaimed ? null : mine ? 'عندك' : lesson.ownerName || null;
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  // Claim, or give back: one request, then the row shows the new holder.
  const take = async (method, holding) => {
    setBusy(true); setProblem('');
    try {
      const res = await fetch(`/api/content/lessons/${lesson.id}/claim`, { method });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      updateLesson(lesson.id, holding
        ? { owner: me, ownerName: name, unclaimed: false }
        : { owner: null, ownerName: '', unclaimed: true });
    } catch (e) { setProblem(e.message || 'تعذّر الاتصال'); }
    setBusy(false);
  };
  const autoTitle = isAutoTitle(lesson.title);
  // Written, but not opened in this browser: what it holds is unknown here, so
  // say that rather than «فارغ».
  const unloaded = !!lesson.started && r.counts.sections === 0;

  const saveTitle = () => {
    if (titleDraft.trim()) updateLesson(lesson.id, { title: titleDraft.trim() });
    else setTitleDraft(lesson.title);
    setEditingTitle(false);
  };

  return (
    <div className={cx('group flex items-center gap-3 px-3 py-2.5 rounded-control hover:bg-hover transition-colors', isVariation && 'ms-6 border-s-2 border-line')}>
      <span className="w-6 shrink-0 t-caption tabular-nums text-fg-subtle text-center">{index + 1}</span>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="flex items-center gap-2 flex-wrap min-w-0">
          {editingTitle ? (
            <input ref={inputRef} value={titleDraft} aria-label="عنوان الدرس"
              onChange={(e) => setTitleDraft(e.target.value)} onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') { setTitleDraft(lesson.title); setEditingTitle(false); }
              }}
              className="flex-1 min-w-0 h-8 px-2 rounded-control bg-page border border-line-accent t-ui text-fg-strong focus:outline-none" />
          ) : (
            <Link href={lessonHref(lesson.id)} className="t-ui text-fg-strong hover:text-fg-accent truncate">
              {lesson.title}
            </Link>
          )}
          {autoTitle && !editingTitle && (
            <span className="inline-flex items-center gap-1 t-caption text-warn" title="عنوان تلقائي من المنهج">
              <TriangleAlert size={12} aria-hidden="true" /> عنوان تلقائي
            </span>
          )}
          {varCfg && <Badge size="sm" tone="special">{varCfg.label}</Badge>}
          <Badge size="sm" tone={state.tone}>{state.label}</Badge>
          {holder && <span className={cx('t-caption', mine ? 'text-fg-accent' : 'text-fg-muted')}>{holder}</span>}
        </span>
        <span className="t-caption text-fg-subtle truncate">
          {unitLabel ? `${unitLabel} · ` : ''}{unloaded ? 'فيه كتابة' : countsInWords(r.counts)} · {lesson.estimatedMinutes || 15} دقيقة
          {r.done < 6 && r.counts.sections > 0 ? ` · ينقصه: ${r.missing.join('، ')}` : ''}
        </span>
        {problem && <span role="alert" className="t-caption text-danger">{problem}</span>}
      </div>

      {me && lesson.unclaimed && lesson.atlasStatus !== 'archived' && (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => take('POST', true)}>تولَّ</Button>
      )}
      {canHandBack(lesson, me) && (
        <ConfirmButton size="sm" variant="ghost" tone="warn" disabled={busy} align="end"
          title="تعيد الدرس للمتاح؟" description="يبقى ما كتبته فيه، ويصير لمن يتولّاه من الفريق."
          confirmLabel="أعده" onConfirm={() => take('DELETE', false)}>
          أعده للمتاح
        </ConfirmButton>
      )}

      <span className={cx('hidden sm:flex items-center gap-0.5 shrink-0', unloaded && 'invisible')} role="img"
        aria-label={`الجاهزية ${r.done} من 6${r.missing.length ? ` — ينقص: ${r.missing.join('، ')}` : ''}`}
        title={r.checks.map((c) => `${c.done ? '✓' : '·'} ${c.label}`).join('\n')}>
        {r.checks.map((c) => (
          <span key={c.id} className={cx('w-2.5 h-1.5 rounded-chip', c.done ? 'bg-success' : 'bg-hover border border-line-strong')} />
        ))}
        <span className="ms-1.5 t-caption tabular-nums text-fg-muted" dir="ltr">{r.done}/6</span>
      </span>

      {lesson.notesCount > 0 && (
        <span className="hidden sm:inline-flex items-center gap-0.5 t-caption text-fg-subtle shrink-0" title={`${lesson.notesCount} ملاحظة`}>
          <StickyNote size={12} aria-hidden="true" />{lesson.notesCount}
        </span>
      )}

      <span className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
        {(!me || mine) && <button type="button" onClick={() => { setTitleDraft(lesson.title); setEditingTitle(true); }}
          aria-label={`أعد تسمية ${lesson.title}`} title="أعد التسمية"
          className="w-8 h-8 inline-flex items-center justify-center rounded-control text-fg-muted hover:text-fg hover:bg-hover touch-target">
          <Pencil size={14} />
        </button>}
        {!isVariation && onAddVariation && (
          <button type="button" onClick={onAddVariation} title="إضافة تنويع لهذا الدرس"
            className="h-8 px-2 inline-flex items-center gap-1 rounded-control t-caption text-fg-muted hover:text-fg hover:bg-hover touch-target">
            <Plus size={13} /> تنويع
          </button>
        )}
      </span>
    </div>
  );
}
