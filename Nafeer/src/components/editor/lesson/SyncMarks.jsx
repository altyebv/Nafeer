'use client';
import { useEditorStore } from '@/store/editorStore';
import { useSubjectStore } from '@/store/subjectStore';
import { useContentStore } from '@/store/contentStore';
import { BLOCK_TYPE_CONFIG } from '@/shared/constants';
import { wordDiff } from '@/lib/wordDiff';
import { formatDate, arCount, changesLabel } from '@/lib/format';

// ─── Sync marks ───────────────────────────────────────────────────────────────
// Small pieces of the save/conflict UI, shared by the lesson header, sections
// and blocks. All of it is drawn from local state — none of it costs a request.

// Arabic counting now lives in src/lib/format.js (ui/SaveStatus needs it too);
// re-exported so existing imports keep working.
export { arCount, changesLabel };

export function minutesAgo(date) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  return `قبل ${arCount(mins, { one: 'دقيقة', two: 'دقيقتين', few: 'دقائق', many: 'دقيقة' })}`;
}

const when = (date) => {
  if (!date) return '';
  try {
    return formatDate(date, 'shortDateTime');
  } catch {
    return '';
  }
};

// ── Unsaved mark ──────────────────────────────────────────────────────────────
// A thin bar at the leading edge of an item with edits the server hasn't seen.
export function UnsavedBar({ show }) {
  if (!show) return null;
  return (
    <span
      aria-hidden="true"
      title="تعديل غير محفوظ"
      className="pointer-events-none absolute inset-y-1 -right-2.5 w-[3px] rounded-full bg-sand-500/80"
    />
  );
}

export function UnsavedDot({ show, className = '' }) {
  if (!show) return null;
  return (
    <span
      role="img"
      aria-label="تعديل غير محفوظ"
      title="تعديل غير محفوظ"
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sand-500 ${className}`}
    />
  );
}

// ── Conflicts ─────────────────────────────────────────────────────────────────

export function useConflict(lessonId, contentId) {
  return useEditorStore((s) =>
    s.conflicts.lessonId === lessonId
      ? s.conflicts.items.find((c) => c.contentId === contentId) ?? null
      : null
  );
}

export function settleConflict(c, keepMine) {
  if (c.kind === 'lessons') {
    const store = useSubjectStore.getState();
    keepMine ? store.keepMineLesson(c.contentId, c.current) : store.takeTheirsLesson(c.contentId, c.current);
  } else {
    const store = useContentStore.getState();
    keepMine ? store.keepMine(c.kind, c.contentId, c.current) : store.takeTheirs(c.kind, c.contentId, c.current);
  }
  useEditorStore.getState().resolveConflict(c.contentId);
}

const KIND_LABEL = { lessons: 'بيانات الدرس', sections: 'عنوان القسم', blocks: 'فقرة' };

const plain = (kind, item) => {
  if (!item) return '';
  const text = kind === 'blocks' ? item.content : item.title;
  return String(text ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

// Renders diff tokens, stopping after `budget` characters.
function Tokens({ tokens, mark, budget = 320 }) {
  let used = 0;
  const out = [];
  for (const [i, t] of tokens.entries()) {
    if (used >= budget) { out.push(<span key="more">…</span>); break; }
    used += t.text.length;
    out.push(t.changed
      ? <mark key={i} className={`rounded px-0.5 ${mark}`}>{t.text}</mark>
      : <span key={i}>{t.text}</span>);
  }
  return out;
}

export function ConflictCard({ conflict: c }) {
  const deleted = c.reason === 'deleted';
  const mineText   = plain(c.kind, c.mine);
  const theirsText = plain(c.kind, c.current);
  const diff = deleted ? null : wordDiff(mineText, theirsText);
  const sameText = !deleted && mineText === theirsText;
  const label = c.kind === 'blocks'
    ? (BLOCK_TYPE_CONFIG[c.mine?.type]?.label ?? KIND_LABEL.blocks)
    : KIND_LABEL[c.kind];
  // Passive voice keeps the line neutral whoever the editor is.
  const who = c.byName ? `عُدّل بواسطة ${c.byName}` : 'عُدّل';

  return (
    <div className="rounded-xl border border-amber-700/50 bg-amber-950/25 p-3 font-arabic" data-conflict-card>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="font-semibold text-amber-300">تعارض · {label}</span>
        <span className="text-ink-400">
          {deleted ? 'حُذف بعد أن فتحتَ الدرس' : `${who} ${when(c.current?.updatedAt)}`}
        </span>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs leading-relaxed">
        <div className="rounded-lg bg-ink-950/70 px-3 py-2">
          <p className="text-ink-500 mb-1">نسختك</p>
          <p className="text-sand-200 break-words">
            {diff ? <Tokens tokens={diff.a} mark="bg-sand-700/40 text-sand-100" /> : (mineText || '—')}
          </p>
        </div>
        <div className="rounded-lg bg-ink-950/70 px-3 py-2">
          <p className="text-ink-500 mb-1">النسخة المحفوظة</p>
          {deleted ? (
            <p className="text-ink-500 italic">لم تعد موجودة</p>
          ) : (
            <p className="text-sand-200 break-words">
              {diff ? <Tokens tokens={diff.b} mark="bg-sky-700/40 text-sky-100" /> : (theirsText || '—')}
            </p>
          )}
        </div>
      </div>

      {sameText && (
        <p className="mt-1.5 text-[11px] text-ink-500">النص متطابق — الاختلاف في الإعدادات أو الترتيب.</p>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => settleConflict(c, true)}
          className="touch-target px-3 h-7 rounded-lg bg-sand-700 hover:bg-sand-600 text-ink-950 text-xs font-bold transition-colors"
        >
          {deleted ? 'أعِد إنشاءها بنسختي' : 'احتفظ بنسختي'}
        </button>
        <button
          onClick={() => settleConflict(c, false)}
          className="touch-target px-3 h-7 rounded-lg border border-ink-700 bg-ink-800/60 hover:bg-ink-700/60 text-ink-300 text-xs font-semibold transition-colors"
        >
          {deleted ? 'احذفها عندي أيضاً' : 'خذ النسخة المحفوظة'}
        </button>
      </div>
    </div>
  );
}
