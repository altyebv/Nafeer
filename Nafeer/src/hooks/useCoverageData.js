import { useState, useEffect, useCallback } from 'react';

// ─── Shared color/label tokens ────────────────────────────────────────────────
// Used by CoveragePanel, LessonItem (dot), UnitCard (badge), Admin matrix.
// Single source of truth — import from here.

export const COVERAGE_LEVEL_CONFIG = {
  high:   { label: 'عالية',    labelEn: 'High',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   dot: 'bg-green-500',  bar: '#22c55e' },
  medium: { label: 'متوسطة',   labelEn: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  dot: 'bg-amber-400',  bar: '#f59e0b' },
  low:    { label: 'منخفضة',   labelEn: 'Low',    color: '#f97316', bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.3)',  dot: 'bg-orange-500', bar: '#f97316' },
  none:   { label: 'فارغة',    labelEn: 'Empty',  color: '#4b5563', bg: 'rgba(75,85,99,0.08)',    border: 'rgba(75,85,99,0.2)',    dot: 'bg-ink-700',    bar: '#374151' },
};

// ─── Module-level cache — one fetch per session per subject ───────────────────
// Keyed by subjectId. Value: { coverageMap, units } once resolved.

const CACHE = {};

// ─── useCoverageData ──────────────────────────────────────────────────────────
//
// Fetches GET /api/coverage/[subjectId] (auth-gated — returns full per-lesson data).
//
// Returns:
//   coverageMap  — { [lessonContentId]: { coverageScore, coverageLevel, sections,
//                                         blocks, concepts, feedItems, questions } }
//   unitMap      — { [unitContentId]: { avgCoverage, totalLessons, approvedLessons } }
//   loading      — boolean
//   error        — string | null
//   refresh()    — clears cache + re-fetches
//
export function useCoverageData(subjectId) {
  const [coverageMap, setCoverageMap] = useState({});
  const [unitMap,     setUnitMap]     = useState({});
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const buildMaps = useCallback((units) => {
    const cMap = {};
    const uMap = {};
    for (const unit of units) {
      uMap[unit.unitId] = {
        avgCoverage:     unit.avgCoverage     ?? 0,
        totalLessons:    unit.totalLessons    ?? 0,
        approvedLessons: unit.approvedLessons ?? 0,
      };
      for (const lesson of unit.lessons || []) {
        cMap[lesson.lessonId] = {
          coverageScore: lesson.coverageScore,
          coverageLevel: lesson.coverageLevel,
          sections:      lesson.sections,
          blocks:        lesson.blocks,
          concepts:      lesson.concepts,
          feedItems:     lesson.feedItems,
          questions:     lesson.questions,
          status:        lesson.status,
        };
      }
    }
    return { cMap, uMap };
  }, []);

  const fetchCoverage = useCallback(async (skipCache = false) => {
    if (!subjectId) return;
    if (!skipCache && CACHE[subjectId]) {
      const { cMap, uMap } = CACHE[subjectId];
      setCoverageMap(cMap);
      setUnitMap(uMap);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/coverage/${subjectId}`);
      const json = await res.json();
      if (!json.ok) { setError(json.error || 'خطأ في التحميل'); return; }
      const { cMap, uMap } = buildMaps(json.data?.units || []);
      CACHE[subjectId] = { cMap, uMap };
      setCoverageMap(cMap);
      setUnitMap(uMap);
    } catch (e) {
      console.warn('[useCoverageData]', e);
      setError('تعذّر تحميل بيانات التغطية');
    } finally {
      setLoading(false);
    }
  }, [subjectId, buildMaps]);

  useEffect(() => {
    fetchCoverage();
  }, [fetchCoverage]);

  const refresh = useCallback(() => {
    delete CACHE[subjectId];
    fetchCoverage(true);
  }, [subjectId, fetchCoverage]);

  return { coverageMap, unitMap, loading, error, refresh };
}