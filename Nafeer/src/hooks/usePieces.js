'use client';
import { useEffect, useState } from 'react';

// ─── usePieces ────────────────────────────────────────────────────────────────
// A subject's memorization pieces (/api/content/pieces), fetched once per page
// and shared by every verse editor on it (free-tier budget: one read, not one
// per block). Writes update the shared list in place.

const cache = new Map(); // subjectId → { pieces, error, promise, listeners }

const entry = (subjectId) => {
  if (!cache.has(subjectId)) cache.set(subjectId, { pieces: null, error: null, promise: null, listeners: new Set() });
  return cache.get(subjectId);
};
const notify = (e) => e.listeners.forEach((fn) => fn());

async function call(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(json.error || 'خطأ غير معروف');
  return json.data;
}

function load(subjectId) {
  const e = entry(subjectId);
  if (!e.promise) {
    e.promise = call(`/api/content/pieces?subjectId=${encodeURIComponent(subjectId)}`)
      .then((list) => { e.pieces = list; e.error = null; })
      .catch((err) => { e.error = err.message; e.promise = null; })
      .finally(() => notify(e));
  }
  return e.promise;
}

export function usePieces(subjectId) {
  const [, rerender] = useState(0);
  useEffect(() => {
    if (!subjectId) return undefined;
    const e = entry(subjectId);
    const fn = () => rerender((n) => n + 1);
    e.listeners.add(fn);
    load(subjectId);
    return () => { e.listeners.delete(fn); };
  }, [subjectId]);

  const e = subjectId ? entry(subjectId) : null;
  const set = (pieces) => { e.pieces = pieces; notify(e); };

  return {
    pieces: e?.pieces ?? null,
    error: e?.error ?? null,
    loading: Boolean(subjectId) && !e?.pieces && !e?.error,
    async create(piece) {
      const saved = await call('/api/content/pieces', { method: 'POST', body: JSON.stringify({ ...piece, subjectId }) });
      set([...(e.pieces || []), saved]);
      return saved;
    },
    async update(id, piece) {
      const saved = await call(`/api/content/pieces/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(piece) });
      set((e.pieces || []).map((p) => (p.id === id ? saved : p)));
      return saved;
    },
    async remove(id) {
      await call(`/api/content/pieces/${encodeURIComponent(id)}`, { method: 'DELETE' });
      set((e.pieces || []).filter((p) => p.id !== id));
    },
  };
}
