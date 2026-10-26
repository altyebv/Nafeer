// A unit's lesson target as sent by the subject page: a whole number from 0 to
// MAX_TARGET, or empty for "not set". Returns the number, null for not set, or
// undefined when the value is invalid. Shared by the unit routes and the page.
export const MAX_TARGET = 200;

export function parseTarget(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'string' ? Number(value.trim()) : value;
  return Number.isInteger(n) && n >= 0 && n <= MAX_TARGET ? n : undefined;
}
