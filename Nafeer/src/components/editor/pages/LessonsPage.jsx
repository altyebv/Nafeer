'use client';
import { useDataStore }                    from '@/store/dataStore';
import { SUBJECTS_BY_ID, TRACK_CONFIG }    from '@/shared/curriculum';
import { computeProgress }                 from '@/lib/LessonStatus';
import { useCoverageData }                 from '@/hooks/useCoverageData';
import UnitCard                            from '@/components/editor/units/UnitCard';

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

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-5 h-5 rounded-full border-2 border-sand-700 border-t-sand-400 animate-spin" />
        <p className="font-arabic" style={{ color: 'var(--text-muted)', fontSize: 13 }}>جاري التحميل…</p>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* ── Subject masthead ──────────────────────────────────────────────── */}
      <header className="mb-8">

        {/* Top row: title + dial */}
        <div className="flex items-start justify-between gap-6 mb-5">
          <div className="min-w-0 flex-1">
            {trackCfg && (
              <span className={`inline-flex items-center text-[10px] font-arabic px-2.5 py-0.5 rounded border mb-3 ${trackCfg.badge}`}>
                {trackCfg.label}
                {catalogEntry?.isMajor && <span className="mr-1.5 opacity-60">· تخصص</span>}
              </span>
            )}

            <h1
              className="font-bold font-arabic leading-tight mb-1"
              style={{ fontSize: 28, color: 'var(--text-primary)' }}
            >
              {subject.nameAr}
            </h1>

            {subject.nameEn && (
              <p className="font-mono" dir="ltr" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {subject.nameEn}
              </p>
            )}
          </div>

          <div className="shrink-0 flex flex-col items-center gap-1.5 pt-1">
            <ProgressDial pct={pct} size={60} />
            <p className="font-arabic whitespace-nowrap" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {done}/{total} مكتمل
            </p>
          </div>
        </div>

        {/* Coverage strip — one dot per lesson, grouped by unit */}
        <div className="flex items-center gap-0.5 flex-wrap mb-4">
          {sortedUnits.map((unit, ui) => {
            const unitLessons = lessons
              .filter((l) => l.unitId === unit.id)
              .sort((a, b) => a.order - b.order);
            return (
              <div key={unit.id} className="flex items-center gap-0.5">
                {ui > 0 && <div className="w-px h-3 mx-1" style={{ background: 'var(--border-subtle)' }} />}
                {unitLessons.map((lesson) => {
                  const ls = sections.filter((s) => s.lessonId === lesson.id);
                  const lb = blocks.filter((b) => ls.some((s) => s.id === b.sectionId));
                  const hasSummary = !!lesson.summary?.trim();
                  const color = ls.length > 0 && lb.length > 0 && hasSummary
                    ? '#10b981'
                    : ls.length > 0 && lb.length > 0
                      ? '#3b82f6'
                      : ls.length > 0
                        ? '#f59e0b'
                        : 'rgba(128,128,128,0.2)';
                  return (
                    <div
                      key={lesson.id}
                      title={lesson.title}
                      className="w-2 h-2 rounded-sm transition-colors cursor-default"
                      style={{ background: color }}
                    />
                  );
                })}
              </div>
            );
          })}
          <div className="flex items-center gap-3 mr-4">
            <LegendDot color="#10b981" label="مكتمل" />
            <LegendDot color="#3b82f6" label="قيد العمل" />
            <LegendDot color="#f59e0b" label="بدأ" />
            <LegendDot color="rgba(128,128,128,0.3)" label="فارغ" />
          </div>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center gap-6 pt-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <Stat n={units.length}   label="وحدات"  />
          <Stat n={lessons.length} label="دروس"   />
          <Stat
            n={sections.filter(s => lessons.some(l => l.id === s.lessonId)).length}
            label="أقسام"
          />
          <Stat
            n={blocks.filter(b => sections.some(s => s.id === b.sectionId)).length}
            label="عناصر"
          />
        </div>
      </header>

      {/* ── Units ─────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
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
function ProgressDial({ pct, size = 56 }) {
  const r   = (size / 2) - 5;
  const c   = size / 2;
  const len = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor"
        strokeWidth="2.5" style={{ color: 'var(--border-subtle)' }} />
      <circle cx={c} cy={c} r={r} fill="none" stroke="#10b981"
        strokeWidth="2.5" className="transition-all duration-700"
        strokeDasharray={`${(pct / 100) * len} ${len}`}
        strokeLinecap="round" />
      <text
        x={c} y={c + 1}
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.21}
        fontFamily="monospace"
        style={{ fill: 'var(--text-secondary)', transform: `rotate(90deg)`, transformOrigin: `${c}px ${c}px` }}
      >
        {pct}%
      </text>
    </svg>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-sm" style={{ background: color }} />
      <span className="font-arabic" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</span>
    </span>
  );
}

function Stat({ n, label }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono font-semibold" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{n}</span>
      <span className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
    </span>
  );
}