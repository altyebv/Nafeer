'use client';
import { useCallback, useEffect, useState } from 'react';

// GET /api/admin/overview, shared by the overview and the subjects index.
// Kept for the page's life: switching between the two does not refetch.
let cache = null;

export function useOverview() {
  const [data, setData] = useState(cache);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر التحميل');
      cache = json.data;
      setData(json.data);
      setError(null);
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { if (!cache) load(); }, [load]);
  return { data, error, reload: load };
}

// What a subject needs next, in words — the subjects list's last column.
export function nextStep(s) {
  if (!s.seeded) return { label: 'ابذرها من المنهج', tone: 'danger' };
  if (s.lessons.review) return { label: `راجع ${s.lessons.review} دروس`, tone: 'info' };
  if (!s.people) return { label: 'ادعُ مساهماً', tone: 'warn' };
  if (!s.withContent) return { label: 'لم يبدأ المساهم', tone: 'accent' };
  return { label: `تابع: ${s.withContent} بدأ`, tone: 'success' };
}
