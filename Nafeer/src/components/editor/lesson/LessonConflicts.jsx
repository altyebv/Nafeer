'use client';
import { GitCompareArrows } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { ConflictCard, arCount } from '@/components/editor/lesson/SyncMarks';

// ─── LessonConflicts ──────────────────────────────────────────────────────────
// Header summary for a save that could not write some items because another
// contributor changed or deleted them first. Section and block conflicts are
// shown inline where the item lives (SectionEditor); this bar counts them and
// jumps to the next one. A conflict on the lesson's own details has no inline
// home on the content tab, so its card is shown here.

export default function LessonConflicts({ lessonId, onReveal }) {
  const conflicts = useEditorStore((s) => s.conflicts);
  const items = conflicts.lessonId === lessonId ? conflicts.items : [];
  if (items.length === 0) return null;

  const meta   = items.find((c) => c.kind === 'lessons');
  const inline = items.filter((c) => c.kind !== 'lessons');

  return (
    <div className="border-t border-amber-900/40 bg-amber-950/30 px-4 sm:px-5 py-2.5 font-arabic space-y-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <GitCompareArrows size={15} strokeWidth={1.9} className="shrink-0 text-amber-300" />
        <p className="text-sm font-semibold text-amber-300">
          {arCount(items.length, {
            one:  'عنصر واحد لم يُحفظ — غيّره',
            two:  'عنصران لم يُحفظا — غيّرهما',
            few:  'عناصر لم تُحفظ — غيّرها',
            many: 'عنصراً لم يُحفظ — غيّرها',
          })} شخص آخر بعد أن فتحتَ الدرس
        </p>
        <span className="text-xs text-amber-200/70">اختر النسخة التي تبقى، ثم احفظ.</span>
        {inline.length > 0 && (
          <button
            onClick={() => onReveal?.(inline[0].contentId)}
            className="touch-target mr-auto px-3 h-7 rounded-lg border border-amber-800/60 text-amber-300 hover:bg-amber-900/30 text-xs font-semibold transition-colors"
          >
            اذهب إلى التعارض
          </button>
        )}
      </div>

      {meta && <ConflictCard conflict={meta} />}
    </div>
  );
}
