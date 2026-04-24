'use client';
import { useMemo } from 'react';
import { useDataStore }                        from '@/store/dataStore';
import { SUBJECTS_BY_ID, TRACK_CONFIG }        from '@/shared/curriculum';
import { getLessonStatus, computeProgress, STATUS_CONFIG } from '@/lib/lessonStatus';

export default function SubjectOverview({ onSelectUnit, onOpenLesson }) {
  const { subject, units, lessons, sections, blocks } = useDataStore();

  const catalog  = subject ? SUBJECTS_BY_ID[subject.id] : null;
  const trackCfg = catalog ? TRACK_CONFIG[catalog.track] : null;

  const lessonsMap = useMemo(
    () => Object.fromEntries(lessons.map((l) => [l.id, l])),
    [lessons]
  );

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.order - b.order),
    [units]
  );

  // Overall subject progress
  const overall = useMemo(() => {
    const allIds = lessons.map((l) => l.id);
    return computeProgress(allIds, sections, blocks, lessonsMap);
  }, [lessons, sections, blocks, lessonsMap]);

  // Find first non-done lesson to suggest as "resume" target
  const resumeLesson = useMemo(() => {
    for (const unit of sortedUnits) {
      const unitLessons = lessons
        .filter((l) => l.unitId === unit.id)
        .sort((a, b) => a.order - b.order);
      for (const lesson of unitLessons) {
        const status = getLessonStatus(lesson.id, sections, blocks, lesson);
        if (status !== 'done') return { lesson, unit };
      }
    }
    return null;
  }, [sortedUnits, lessons, sections, blocks]);

  if (!subject || sortedUnits.length === 0) {
    return (
      <div className="text-center py-32">
        <div className="text-5xl mb-5">🌀</div>
        <h2 className="text-lg font-medium text-ink-300 font-arabic mb-2">جاري تحميل المادة…</h2>
        <p className="text-ink-600 text-sm font-arabic">إذا استمرت المشكلة، تواصل مع المدير</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Subject Header ────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {trackCfg && (
                <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${TRACK_CONFIG[catalog.track].badge ?? 'border-ink-700 text-ink-500'}`}>
                  {trackCfg.label}
                </span>
              )}
              {catalog?.isMajor && (
                <span className="text-xs font-mono px-2.5 py-1 rounded-full border border-ink-700 text-ink-500">
                  تخصص
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-sand-100 font-arabic">{subject.nameAr}</h1>
            <p className="text-ink-500 text-sm mt-1 font-mono">
              {overall.done}/{overall.total} درس مكتمل
            </p>
          </div>

          {/* Resume CTA */}
          {resumeLesson && (
            <button
              onClick={() => onOpenLesson(resumeLesson.lesson.id, resumeLesson.unit.id)}
              className="shrink-0 flex items-center gap-3 px-5 py-3 bg-sand-600 hover:bg-sand-500 text-ink-950 font-bold rounded-xl transition-all hover:shadow-[0_0_24px_rgba(212,137,30,0.2)] hover:-translate-y-0.5 font-arabic text-sm"
            >
              <span>متابعة</span>
              <span className="opacity-70 text-xs font-mono truncate max-w-[120px]">
                {resumeLesson.lesson.title}
              </span>
              <span>←</span>
            </button>
          )}
        </div>

        {/* Overall progress bar */}
        <div className="relative">
          <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-sand-400 to-sand-600 rounded-full transition-all duration-700"
              style={{ width: `${overall.pct}%` }}
            />
          </div>
          <span className="absolute left-0 -top-5 text-xs font-mono text-sand-500">{overall.pct}%</span>
        </div>
      </div>

      {/* ── Units Grid ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {sortedUnits.map((unit) => (
          <UnitRow
            key={unit.id}
            unit={unit}
            lessons={lessons}
            sections={sections}
            blocks={blocks}
            lessonsMap={lessonsMap}
            onSelect={() => onSelectUnit(unit.id)}
            onOpenLesson={(lessonId) => onOpenLesson(lessonId, unit.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Unit Row ────────────────────────────────────────────────────────────────
function UnitRow({ unit, lessons, sections, blocks, lessonsMap, onSelect, onOpenLesson }) {
  const unitLessons = useMemo(
    () => lessons.filter((l) => l.unitId === unit.id).sort((a, b) => a.order - b.order),
    [lessons, unit.id]
  );

  const progress = useMemo(
    () => computeProgress(unitLessons.map((l) => l.id), sections, blocks, lessonsMap),
    [unitLessons, sections, blocks, lessonsMap]
  );

  const statuses = useMemo(
    () => unitLessons.map((l) => getLessonStatus(l.id, sections, blocks, l)),
    [unitLessons, sections, blocks]
  );

  return (
    <div
      onClick={onSelect}
      className="group flex items-center gap-5 px-5 py-4 bg-ink-900 rounded-xl border border-ink-800 hover:border-ink-700 hover:bg-ink-800/60 transition-all cursor-pointer"
    >
      {/* Order number */}
      <div className="shrink-0 w-8 h-8 rounded-lg bg-ink-800 group-hover:bg-ink-700 flex items-center justify-center transition-colors">
        <span className="text-xs font-mono text-ink-400">{unit.order}</span>
      </div>

      {/* Unit title */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-ink-100 font-arabic truncate">{unit.title}</h3>
        <p className="text-xs text-ink-600 mt-0.5 font-arabic">
          {progress.done} من {progress.total} درس
        </p>
      </div>

      {/* Lesson status dots */}
      <div className="flex items-center gap-1.5 shrink-0">
        {statuses.map((status, i) => (
          <div
            key={i}
            title={lessonsMap[unitLessons[i]?.id]?.title}
            className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot} transition-all`}
          />
        ))}
      </div>

      {/* Progress pct + arrow */}
      <div className="shrink-0 flex items-center gap-3">
        <span className="text-xs font-mono text-ink-500">{progress.pct}%</span>
        <span className="text-ink-700 group-hover:text-sand-500 transition-colors text-sm">←</span>
      </div>
    </div>
  );
}