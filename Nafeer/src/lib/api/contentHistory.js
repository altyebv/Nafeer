import { LessonHistory } from '@/lib/models/LessonHistory';

export async function writeHistory(lessonContentId, {
  version, action, versionLabel = '', byId, byName, note = '', diff = null,
  entityType = 'lesson', entityContentId = null, entityLabel = '',
}) {
  try {
    await LessonHistory.create({
      lessonContentId,
      version,
      action,
      versionLabel,
      byId: byId || null,
      byName: byName || '',
      note,
      diff,
      entityType,
      entityContentId,
      entityLabel,
      timestamp: new Date(),
    });
  } catch (e) {
    console.warn('[LessonHistory write failed]', e.message);
  }
}

const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    if (value.toObject) return canonical(value.toObject());
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value ?? null;
};

export function diffFields(before, after, fields) {
  const diff = {};
  for (const field of fields) {
    const from = before?.[field] ?? null;
    const to = after?.[field] ?? null;
    if (JSON.stringify(canonical(from)) !== JSON.stringify(canonical(to))) {
      diff[field] = { from, to };
    }
  }
  return Object.keys(diff).length ? diff : null;
}

export async function writeItemHistory({
  lessonContentId, entityType, entityContentId, entityLabel, version, action,
  byId, byName, before = null, after = null, fields, diff = undefined,
}) {
  const changes = diff === undefined
    ? diffFields(before, after, fields)
    : diff;
  if (action === 'edited' && !changes) return;

  await writeHistory(lessonContentId, {
    version,
    action,
    byId,
    byName,
    diff: changes,
    entityType,
    entityContentId,
    entityLabel,
  });
}
