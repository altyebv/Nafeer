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
 * Drops any item missing id/x/y; clamps x/y and defaults label/description.
 * Any other field on a marker is kept as it is — the editor runs this on every
 * edit, so a field it doesn't know (a question's answer, say) must survive.
 *
 * Anchor: (x, y) is where the pin's dot is centred, as a fraction of the
 * image's width and height from its top-left. Every renderer draws it so
 * (components/media/MarkerPin.jsx).
 *
 * @param {any[]} raw
 * @returns {Array<{ id: string, x: number, y: number, label: string, description: string, [k: string]: any }>}
 */
export function sanitiseMarkers(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && typeof m.id === 'string' && Number.isFinite(m.x) && Number.isFinite(m.y))
    .map((m) => ({
      ...m,
      x:           clampNorm(m.x),
      y:           clampNorm(m.y),
      label:       typeof m.label       === 'string' ? m.label       : '',
      description: typeof m.description === 'string' ? m.description : '',
    }));
}