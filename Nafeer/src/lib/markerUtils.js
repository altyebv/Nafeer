// ─── markerUtils ──────────────────────────────────────────────────────────────
// Shared helpers for the interactive media / marker system.

/**
 * Generate a short prefixed ID for a marker.
 * @param {string} prefix — e.g. 'mk'
 */
export function randomId(prefix = 'mk') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Clamp a normalised coordinate to [0, 1].
 */
export function clampNorm(v) {
  return Math.min(1, Math.max(0, v));
}

/**
 * Convert a normalised (0–1) coordinate pair to a percentage string for CSS.
 * @returns {{ left: string, top: string }}
 */
export function normToPercent(x, y) {
  return {
    left: `${(x * 100).toFixed(2)}%`,
    top:  `${(y * 100).toFixed(2)}%`,
  };
}

/**
 * Validate that a markers array is well-formed.
 * Strips any item missing id/x/y.
 * @param {any[]} raw
 * @returns {Array<{ id: string, x: number, y: number, label: string, description: string }>}
 */
export function sanitiseMarkers(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && typeof m.id === 'string' && typeof m.x === 'number' && typeof m.y === 'number')
    .map((m) => ({
      id:          m.id,
      x:           clampNorm(m.x),
      y:           clampNorm(m.y),
      label:       typeof m.label       === 'string' ? m.label       : '',
      description: typeof m.description === 'string' ? m.description : '',
    }));
}