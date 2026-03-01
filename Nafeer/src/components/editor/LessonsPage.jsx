import { useDataStore }    from '@/store/dataStore';
import { SUBJECTS_BY_ID, TRACK_CONFIG } from '@/shared/curriculum';
import { computeProgress }  from '@/lib/LessonStatus';
import UnitCard              from '@/components/editor/UnitCard';

export default function LessonsPage({ onEditLesson }) {
  const { subject, units, lessons, sections, blocks } = useDataStore();

  const sortedUnits  = [...units].sort((a, b) => a.order - b.order);
  const catalogEntry = subject ? SUBJECTS_BY_ID[subject.id] : null;
  const trackCfg     = catalogEntry ? TRACK_CONFIG[catalogEntry.track] : null;

  // Overall subject progress
  const lessonsMap = Object.fromEntries(lessons.map((l) => [l.id, l]));
  const { done, total, pct } = computeProgress(
    lessons.map((l) => l.id),
    sections,
    blocks,
    lessonsMap,
  );

  // ── Waiting for bootstrap ────────────────────────────────────────────────────
  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-sand-700 border-t-sand-400 animate-spin" />
        <p className="text-ink-500 text-sm font-arabic">جاري تحميل هيكل المادة…</p>
      </div>
    );
  }

  return (
    <div>

      {/* ── Subject header ──────────────────────────────────────────────────── */}
      <div className="bg-ink-900 border border-ink-800 rounded-xl p-5 mb-8">
        <div className="flex items-start justify-between gap-4">

          {/* Name + track */}
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-bold text-sand-100 font-arabic">
                {subject.nameAr}
              </h1>
              {catalogEntry?.isMajor && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border font-arabic
                  bg-ember-900/30 border-ember-700/40 text-ember-400">
                  تخصص
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {subject.nameEn && (
                <span className="text-xs text-ink-500 font-mono" dir="ltr">
                  {subject.nameEn}
                </span>
              )}
              {trackCfg && (
                <span className={`text-xs px-2 py-0.5 rounded border font-arabic ${trackCfg.badge}`}>
                  {trackCfg.label}
                </span>
              )}
            </div>
          </div>

          {/* Progress counters */}
          <div className="text-left shrink-0">
            <p className="text-2xl font-mono font-bold text-sand-300 leading-none mb-1">
              {pct}<span className="text-base text-ink-500">%</span>
            </p>
            <p className="text-xs text-ink-600 font-arabic">
              {done} / {total} درس مكتمل
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-ink-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Unit breakdown */}
        <div className="mt-3 flex gap-1.5 flex-wrap">
          {sortedUnits.map((unit) => {
            const unitLessonIds = lessons
              .filter((l) => l.unitId === unit.id)
              .map((l) => l.id);
            const u = computeProgress(unitLessonIds, sections, blocks, lessonsMap);
            return (
              <div
                key={unit.id}
                title={`${unit.title} — ${u.done}/${u.total}`}
                className="flex gap-0.5"
              >
                {unitLessonIds.map((lid) => {
                  const s = sections.filter((s) => s.lessonId === lid);
                  const b = blocks.filter((b) => s.some((sec) => sec.id === b.sectionId));
                  const lesson = lessonsMap[lid];
                  const isDone = s.length > 0 && b.length > 0 && lesson?.summary?.trim().length > 0;
                  const isStarted = s.length > 0;
                  return (
                    <div
                      key={lid}
                      className={`w-2 h-2 rounded-sm transition-colors
                        ${isDone ? 'bg-emerald-500' : isStarted ? 'bg-amber-500' : 'bg-ink-700'}`}
                    />
                  );
                })}
                <div className="w-px bg-ink-700 mx-0.5" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Units ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {sortedUnits.map((unit) => (
          <UnitCard key={unit.id} unit={unit} onEditLesson={onEditLesson} />
        ))}
      </div>

    </div>
  );
}