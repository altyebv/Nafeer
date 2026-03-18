'use client';
import { useDataStore }           from '@/store/dataStore';
import { SUBJECTS_BY_ID, TRACK_CONFIG } from '@/shared/curriculum';
import { computeProgress }        from '@/lib/LessonStatus';
import { useCoverageData }        from '@/hooks/useCoverageData';
import UnitCard                   from '@/components/editor/units/UnitCard';

export default function LessonsPage({ onEditLesson }) {
  const { subject, units, lessons, sections, blocks } = useDataStore();
  const { coverageMap, unitMap } = useCoverageData(subject?.id);

  const sortedUnits  = [...units].sort((a, b) => a.order - b.order);
  const catalogEntry = subject ? SUBJECTS_BY_ID[subject.id] : null;
  const trackCfg     = catalogEntry ? TRACK_CONFIG[catalogEntry.track] : null;

  const lessonsMap          = Object.fromEntries(lessons.map((l) => [l.id, l]));
  const { done, total, pct } = computeProgress(
    lessons.map((l) => l.id), sections, blocks, lessonsMap,
  );

  // Per-lesson status for the coverage strip
  const allLessons = sortedUnits.flatMap((u) =>
    lessons.filter((l) => l.unitId === u.id).sort((a, b) => a.order - b.order)
  );

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-6 h-6 rounded-full border-2 border-sand-700 border-t-sand-400 animate-spin" />
        <p className="text-ink-600 text-xs font-arabic">جاري التحميل…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-8 max-w-3xl">

      {/* ── Subject masthead ──────────────────────────────────────────────────── */}
      <header className="mb-10">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            {/* Track chip */}
            {trackCfg && (
              <span className={`inline-flex items-center text-[10px] font-arabic px-2 py-0.5 rounded border mb-3 ${trackCfg.badge}`}>
                {trackCfg.label}
                {catalogEntry?.isMajor && <span className="mr-1.5 opacity-60">· تخصص</span>}
              </span>
            )}

            <h1 className="text-3xl font-bold text-sand-100 font-arabic leading-tight mb-1">
              {subject.nameAr}
            </h1>

            {subject.nameEn && (
              <p className="text-sm text-ink-600 font-mono" dir="ltr">{subject.nameEn}</p>
            )}
          </div>

          {/* Progress dial */}
          <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
            <ProgressDial pct={pct} size={56} />
            <p className="text-[10px] text-ink-700 font-arabic whitespace-nowrap">
              {done}/{total} مكتمل
            </p>
          </div>
        </div>

        {/* Coverage strip — one dot per lesson, grouped by unit */}
        <div className="mt-6 flex items-center gap-0.5 flex-wrap">
          {sortedUnits.map((unit, ui) => {
            const unitLessons = lessons
              .filter((l) => l.unitId === unit.id)
              .sort((a, b) => a.order - b.order);
            return (
              <div key={unit.id} className="flex items-center gap-0.5">
                {ui > 0 && <div className="w-px h-3 bg-ink-800 mx-1" />}
                {unitLessons.map((lesson) => {
                  const ls = sections.filter((s) => s.lessonId === lesson.id);
                  const lb = blocks.filter((b) => ls.some((s) => s.id === b.sectionId));
                  const hasSummary = !!lesson.summary?.trim();
                  const color = ls.length > 0 && lb.length > 0 && hasSummary
                    ? 'bg-emerald-500'
                    : ls.length > 0 && lb.length > 0
                      ? 'bg-blue-500'
                      : ls.length > 0
                        ? 'bg-amber-500'
                        : 'bg-ink-700';
                  return (
                    <div
                      key={lesson.id}
                      title={lesson.title}
                      className={`w-2 h-2 rounded-sm ${color} transition-colors cursor-default`}
                    />
                  );
                })}
              </div>
            );
          })}
          <div className="flex items-center gap-3 mr-4">
            <LegendDot color="bg-emerald-500" label="مكتمل" />
            <LegendDot color="bg-blue-500"    label="قيد العمل" />
            <LegendDot color="bg-amber-500"   label="بدأ" />
            <LegendDot color="bg-ink-700"     label="فارغ" />
          </div>
        </div>

        {/* Subject stats row */}
        <div className="mt-5 flex items-center gap-5 text-xs text-ink-600 font-mono border-t border-ink-800/60 pt-4">
          <Stat n={units.length}   label="وحدات"  />
          <Stat n={lessons.length} label="دروس"   />
          <Stat n={sections.filter(s => lessons.some(l => l.id === s.lessonId)).length} label="أقسام" />
          <Stat n={blocks.filter(b => sections.some(s => s.id === b.sectionId)).length} label="عناصر" />
        </div>
      </header>

      {/* ── Units ─────────────────────────────────────────────────────────────── */}
      <div className="space-y-8">
        {sortedUnits.map((unit, index) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            index={index}
            onEditLesson={onEditLesson}
            coverageMap={coverageMap}
            unitCoverage={unitMap[unit.contentId]}
          />
        ))}
      </div>

    </div>
  );
}

// ─── ProgressDial ─────────────────────────────────────────────────────────────
function ProgressDial({ pct, size = 48 }) {
  const r   = (size / 2) - 5;
  const c   = size / 2;
  const len = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor"
        strokeWidth="3" className="text-ink-800" />
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor"
        strokeWidth="3" className="text-emerald-500 transition-all duration-700"
        strokeDasharray={`${(pct / 100) * len} ${len}`}
        strokeLinecap="round" />
      <text x={c} y={c + 1} dominantBaseline="middle" textAnchor="middle"
        className="fill-sand-300 font-mono" fontSize={size * 0.22}
        style={{ transform: `rotate(90deg)`, transformOrigin: `${c}px ${c}px` }}>
        {pct}%
      </text>
    </svg>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1 text-ink-700">
      <span className={`w-1.5 h-1.5 rounded-sm ${color}`} />
      <span className="text-[10px] font-arabic">{label}</span>
    </span>
  );
}

function Stat({ n, label }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-ink-400">{n}</span>
      <span className="text-ink-700 font-arabic text-[10px]">{label}</span>
    </span>
  );
}