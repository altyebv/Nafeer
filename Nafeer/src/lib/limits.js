// ─── Input limits ─────────────────────────────────────────────────────────────
// What one request and one document may hold. Vercel refuses bodies and
// responses over 4.5MB, so an oversized entry can break every screen that lists
// it. Checked on the way in only: what is already stored is left as it is until
// someone saves it again.

export const MAX_BODY_BYTES = 2_000_000;
export const MAX_BATCH = 500;
export const MAX_TEXT = 50_000;        // any single string, e.g. a text block
export const MAX_ITEM_BYTES = 200_000; // one document
export const MAX_ANSWER = 5_000;       // an interview answer
export const MAX_ANSWERS = 50;

const FIELD_MAX = {
  title: 200, titleAr: 200, titleEn: 200, nameAr: 200, nameEn: 200,
  groupTitle: 200, variationNote: 200, caption: 500, summary: 2_000,
};
const NUMBERS = ['order', 'estimatedMinutes'];

const reply = (error, status = 400) => Response.json({ ok: false, error }, { status });

/** The request's JSON object. Throws a 400 or 413 Response. */
export async function readBody(request, maxBytes = MAX_BODY_BYTES) {
  const text = await request.text();
  if (Buffer.byteLength(text) > maxBytes) throw reply('حجم الطلب أكبر من المسموح', 413);
  let value = null;
  try { value = JSON.parse(text); } catch { /* refused below */ }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw reply('بيانات الطلب غير صالحة');
  return value;
}

function longString(value, depth = 0) {
  if (typeof value === 'string') return value.length > MAX_TEXT;
  if (!value || typeof value !== 'object' || depth > 8) return false;
  return Object.values(value).some((v) => longString(v, depth + 1));
}

/**
 * What is wrong with one document being written, or null. `required` names the
 * text fields that may not be emptied when sent.
 */
export function inputProblem(item, required = []) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return 'بيانات غير صالحة';
  for (const [field, max] of Object.entries(FIELD_MAX)) {
    const v = item[field];
    if (v === undefined) continue;
    if (required.includes(field) && (typeof v !== 'string' || !v.trim())) return `الحقل ${field} مطلوب`;
    if (v === null || v === '') continue;
    if (typeof v !== 'string') return `الحقل ${field} يجب أن يكون نصاً`;
    if (v.length > max) return `الحقل ${field} أطول من المسموح (${max} حرف)`;
  }
  for (const field of NUMBERS) {
    const v = item[field];
    if (v !== undefined && v !== null && !Number.isFinite(Number(v))) return `الحقل ${field} يجب أن يكون رقماً`;
  }
  if (item.content !== undefined && item.content !== null && typeof item.content !== 'string') return 'محتوى العنصر يجب أن يكون نصاً';
  if (longString(item)) return `نص أطول من المسموح (${MAX_TEXT} حرف) — قسّمه إلى أكثر من عنصر`;
  if (Buffer.byteLength(JSON.stringify(item)) > MAX_ITEM_BYTES) return 'العنصر أكبر من المسموح';
  return null;
}

/** Throws a 400 Response unless the document passes. */
export function assertInput(item, required) {
  const problem = inputProblem(item, required);
  if (problem) throw reply(problem);
}

/** A batch from the editor: a bounded list of valid items. */
export function assertBatch(items) {
  if (!Array.isArray(items)) throw reply('بيانات غير صالحة');
  if (items.length > MAX_BATCH) throw reply(`الحد ${MAX_BATCH} عنصراً في الحفظ الواحد`, 413);
  items.forEach((item) => assertInput(item));
}

/** The database refusing what was sent is the caller's mistake, not ours. */
export const invalidData = (e) =>
  (e?.name === 'ValidationError' || e?.name === 'CastError' || e?.name === 'StrictModeError'
    ? reply('بيانات غير صالحة')
    : null);
