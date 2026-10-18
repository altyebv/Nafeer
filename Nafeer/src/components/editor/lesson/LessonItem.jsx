'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Pencil, Plus, StickyNote, TriangleAlert } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import { useShallow } from 'zustand/react/shallow';
import { VARIATION_CONFIG } from '@/components/editor/lesson/LinkVariationModal';
import { lessonHref } from '@/components/editor/layout/nav';
import { lessonReadiness, countsInWords, isAutoTitle } from '@/lib/lessonReadiness';
import { Badge, cx } from '@/components/ui';

// ─── LessonItem ───────────────────────────────────────────────────────────────
// One full-width row per lesson (DS2 step 6, EdLessonsList): the title links to
// the editor, six readiness marks say what is done, what it holds is said in
// words, and a returned or auto-titled lesson says so.

const STATUS = {
  draft:    null,
  review:   { label: 'بانتظار المراجعة', tone: 'info' },
  approved: { label: 'معتمد', tone: 'success' },
  archived: { label: 'مؤرشف', tone: 'neutral' },
};

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
  const status = STATUS[lesson.atlasStatus];
  const returned = !!lesson.reviewState?.returned;
  const autoTitle = isAutoTitle(lesson.title);

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
          {returned && <Badge size="sm" tone="warn">أُعيد إليك</Badge>}
          {status && <Badge size="sm" tone={status.tone}>{status.label}</Badge>}
        </span>
        <span className="t-caption text-fg-subtle truncate">
          {unitLabel ? `${unitLabel} · ` : ''}{countsInWords(r.counts)} · {lesson.estimatedMinutes || 15} دقيقة
          {r.done < 6 && r.counts.sections > 0 ? ` · ينقصه: ${r.missing.join('، ')}` : ''}
        </span>
      </div>

      <span className="hidden sm:flex items-center gap-0.5 shrink-0" role="img"
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
        <button type="button" onClick={() => { setTitleDraft(lesson.title); setEditingTitle(true); }}
          aria-label={`أعد تسمية ${lesson.title}`} title="أعد التسمية"
          className="w-8 h-8 inline-flex items-center justify-center rounded-control text-fg-muted hover:text-fg hover:bg-hover touch-target">
          <Pencil size={14} />
        </button>
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
