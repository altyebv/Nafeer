import { NextResponse }    from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { getManifest, upsertSubjectEntry } from '@/lib/FirebaseAdmin';

const ENTRY_FIELDS = [
  'id',
  'enabled',
  'minAppVersion',
  'contentVersion',
  'version',
  'downloadUrl',
  'legacyDownloadUrl',
  'legacySha256',
  'legacySize',
  'updatedAt',
  'sha256',
  'size',
  'approvedLessonsCount',
  'approvedSectionsCount',
  'approvedBlocksCount',
];

const CONTENT_METADATA_FIELDS = [
  'contentVersion',
  'version',
  'downloadUrl',
  'legacyDownloadUrl',
  'legacySha256',
  'legacySize',
  'sha256',
  'size',
  'approvedLessonsCount',
  'approvedSectionsCount',
  'approvedBlocksCount',
];

// GET /api/content/manifest
// Returns the current Firestore manifest so the admin dashboard can inspect it.
export async function GET() {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    const manifest = await getManifest().catch(() => null);

    return NextResponse.json({
      ok: true,
      manifest: {
        schemaVersion: manifest?.schemaVersion || '1.0',
        updatedAt: manifest?.updatedAt || null,
        featureFlags: manifest?.featureFlags || null,
        subjects: manifest?.subjects || [],
      },
    });
  } catch (e) {
    console.error('[GET /api/content/manifest]', e);
    return NextResponse.json({ ok: false, error: e.message || 'Server error' }, { status: 500 });
  }
}

// PATCH /api/content/manifest
// Body: { entry: { ...partial SubjectManifestEntry } }
//
// Used by the CMS Remote Manifest panel to edit one Firebase manifest entry
// without disturbing other subjects or feature flags.
export async function PATCH(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawEntry = body?.entry;
  if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) {
    return NextResponse.json({ ok: false, error: 'entry object is required' }, { status: 400 });
  }

  const unknownKeys = Object.keys(rawEntry).filter((key) => !ENTRY_FIELDS.includes(key));
  if (unknownKeys.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Unknown manifest fields: ${unknownKeys.join(', ')}` },
      { status: 400 }
    );
  }

  const typeError = getTypeError(rawEntry);
  if (typeError) {
    return NextResponse.json({ ok: false, error: typeError }, { status: 400 });
  }

  try {
    const manifest = await getManifest().catch(() => null);
    const existingEntry = (manifest?.subjects || []).find((entry) => entry.id === rawEntry.id) || null;
    const nextEntry = buildManifestEntry(rawEntry, existingEntry);

    const validationError = validateManifestEntry(nextEntry);
    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    await upsertSubjectEntry(nextEntry);

    const updatedManifest = await getManifest().catch(() => null);
    const savedEntry = (updatedManifest?.subjects || []).find((entry) => entry.id === nextEntry.id) || nextEntry;

    return NextResponse.json({
      ok: true,
      entry: savedEntry,
      manifest: {
        schemaVersion: updatedManifest?.schemaVersion || '2.0',
        updatedAt: updatedManifest?.updatedAt || null,
        featureFlags: updatedManifest?.featureFlags || null,
        subjects: updatedManifest?.subjects || [],
      },
    });
  } catch (e) {
    console.error('[PATCH /api/content/manifest]', e);
    return NextResponse.json({ ok: false, error: e.message || 'Server error' }, { status: 500 });
  }
}

function buildManifestEntry(rawEntry, existingEntry) {
  const nextEntry = {
    ...(existingEntry || {}),
    id: normalizeString(rawEntry.id ?? existingEntry?.id),
    enabled: rawEntry.enabled ?? existingEntry?.enabled ?? true,
    minAppVersion: normalizeString(rawEntry.minAppVersion ?? existingEntry?.minAppVersion ?? '1.0'),
    contentVersion: normalizeString(rawEntry.contentVersion ?? existingEntry?.contentVersion ?? existingEntry?.version),
    version: normalizeString(rawEntry.version ?? existingEntry?.version),
    downloadUrl: normalizeNullableString(rawEntry.downloadUrl ?? existingEntry?.downloadUrl),
    legacyDownloadUrl: normalizeNullableString(rawEntry.legacyDownloadUrl ?? existingEntry?.legacyDownloadUrl ?? existingEntry?.downloadUrl),
    legacySha256: normalizeNullableString(rawEntry.legacySha256 ?? existingEntry?.legacySha256)?.toLowerCase() || null,
    legacySize: normalizeNullableNumber(rawEntry.legacySize ?? existingEntry?.legacySize),
    sha256: normalizeNullableString(rawEntry.sha256 ?? existingEntry?.sha256)?.toLowerCase() || null,
    size: normalizeNullableNumber(rawEntry.size ?? existingEntry?.size),
    approvedLessonsCount: normalizeCount(rawEntry.approvedLessonsCount ?? existingEntry?.approvedLessonsCount),
    approvedSectionsCount: normalizeCount(rawEntry.approvedSectionsCount ?? existingEntry?.approvedSectionsCount),
    approvedBlocksCount: normalizeCount(rawEntry.approvedBlocksCount ?? existingEntry?.approvedBlocksCount),
  };

  if ('updatedAt' in rawEntry) {
    nextEntry.updatedAt = normalizeNullableString(rawEntry.updatedAt) || '';
  } else if (CONTENT_METADATA_FIELDS.some((field) => field in rawEntry)) {
    nextEntry.updatedAt = new Date().toISOString();
  } else {
    nextEntry.updatedAt = normalizeNullableString(existingEntry?.updatedAt) || '';
  }

  return nextEntry;
}

function validateManifestEntry(entry) {
  if (!entry.id) return 'entry.id is required';
  if (!entry.minAppVersion) return 'minAppVersion is required';

  const hasDeltaPayload = entry.entityIndex != null;
  const hasLegacyPayload = !!(entry.legacyDownloadUrl || entry.downloadUrl);

  if (entry.enabled && !(entry.contentVersion || entry.version)) {
    return 'Enabled manifest entries must include a contentVersion';
  }

  if (entry.enabled && !hasDeltaPayload && !hasLegacyPayload) {
    return 'Enabled manifest entries must include either delta patches/entityIndex or a legacyDownloadUrl';
  }

  for (const field of ['downloadUrl', 'legacyDownloadUrl']) {
    if (!entry[field]) continue;
    try {
      const url = new URL(entry[field]);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return `${field} must use http or https`;
      }
    } catch {
      return `${field} must be a valid URL`;
    }
  }

  for (const field of ['sha256', 'legacySha256']) {
    if (entry[field] && !/^[a-f0-9]{64}$/i.test(entry[field])) {
      return `${field} must be a 64-character hex string`;
    }
  }

  for (const field of ['size', 'legacySize']) {
    if (entry[field] != null && (!Number.isInteger(entry[field]) || entry[field] < 0)) {
      return `${field} must be a non-negative integer`;
    }
  }

  for (const field of ['approvedLessonsCount', 'approvedSectionsCount', 'approvedBlocksCount']) {
    if (!Number.isInteger(entry[field]) || entry[field] < 0) {
      return `${field} must be a non-negative integer`;
    }
  }

  return null;
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNullableString(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeNullableNumber(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeCount(value) {
  if (value == null || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : NaN;
}

function getTypeError(rawEntry) {
  if ('enabled' in rawEntry && typeof rawEntry.enabled !== 'boolean') {
    return 'enabled must be a boolean';
  }

  for (const key of ['id', 'minAppVersion', 'contentVersion', 'version', 'downloadUrl', 'legacyDownloadUrl', 'updatedAt', 'sha256', 'legacySha256']) {
    if (key in rawEntry && rawEntry[key] != null && typeof rawEntry[key] !== 'string') {
      return `${key} must be a string or null`;
    }
  }

  return null;
}
