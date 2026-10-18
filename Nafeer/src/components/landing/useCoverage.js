'use client';
import { useEffect, useState } from 'react';
import { SUBJECTS_CATALOG, getTotalLessons } from '@/shared/curriculum';

// ─── One set of subject numbers for the landing ──────────────────────────────
// The progress board and the Nafeer section both show how many subjects exist
// and how many are still open. They read the same numbers from here — the
// catalog for the total, one shared /api/coverage request for progress — so
// the page can't say 13 in one place and 12 in another again.

let request = null; // one fetch per page load, shared by every caller
const load = () => {
  request ??= fetch('/api/coverage')
    .then((r) => r.json())
    .then((json) => {
      const map = {};
      if (json.ok) (json.data || []).forEach((s) => { map[s.subjectId] = s.approvedLessons || 0; });
      return map;
    })
    .catch(() => ({}));
  return request;
};

export function useCoverage() {
  const [approved, setApproved] = useState(null);
  useEffect(() => {
    let live = true;
    load().then((m) => { if (live) setApproved(m); });
    return () => { live = false; };
  }, []);

  const subjects = SUBJECTS_CATALOG.map((s) => {
    const totalLessons = getTotalLessons(s.id);
    const done = approved?.[s.id] || 0;
    return { ...s, totalLessons, progress: totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0 };
  });
  const started = subjects.filter((s) => s.progress > 0).length;
  return {
    loaded: approved !== null,
    subjects,
    total: subjects.length,
    started,
    open: subjects.length - started,
  };
}
