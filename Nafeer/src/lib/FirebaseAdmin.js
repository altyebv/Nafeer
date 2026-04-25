import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Firebase Admin singleton ─────────────────────────────────────────────────
// Safe to call multiple times — getApps() guards against double-init in
// Next.js hot-reload and serverless environments.

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[firebaseAdmin] Missing env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function getAdminFirestore() {
  initAdmin();
  return getFirestore();
}

// ─── Manifest helpers ─────────────────────────────────────────────────────────

const COLLECTION = 'content_config';
const DOC        = 'manifest';

const DEFAULT_FLAGS = {
  feedEnabled:        true,
  examModeEnabled:    true,
  hotspotEnabled:     false,
  announcementBanner: null,
  visibleSubjectIds:  [],
};

/** Fetch manifest doc. Returns null if it doesn't exist yet. */
export async function getManifest() {
  const db   = getAdminFirestore();
  const snap = await db.collection(COLLECTION).doc(DOC).get();
  if (!snap.exists) return null;
  return snap.data();
}

/**
 * Upsert one subject entry in the manifest (v3 schema).
 *
 * Accepts both legacy v2 entries (with `version` + `downloadUrl`) and
 * v3 delta entries (with `contentVersion` + `entityIndex` + `patches`).
 * The schemaVersion is bumped to "3.0" once any v3 field is written.
 *
 * All other subjects and featureFlags are preserved via read-modify-write.
 *
 * @param {object} entry - SubjectManifestEntry shape (see ContentManifest.kt)
 */
export async function upsertSubjectEntry(entry) {
  const db       = getAdminFirestore();
  const ref      = db.collection(COLLECTION).doc(DOC);
  const snap     = await ref.get();
  const existing = snap.exists ? snap.data() : { subjects: [], featureFlags: DEFAULT_FLAGS };

  // Detect schema version: if the new entry carries v3 fields, upgrade the doc.
  const hasV3Fields = entry.contentVersion != null || entry.entityIndex != null;
  const schemaVersion = hasV3Fields ? '3.0' : (existing.schemaVersion || '2.0');

  const subjects = [
    ...(existing.subjects || []).filter((s) => s.id !== entry.id),
    entry,
  ];

  await ref.set(
    {
      schemaVersion,
      updatedAt:    new Date().toISOString(),
      subjects,
      featureFlags: existing.featureFlags || DEFAULT_FLAGS,
    },
    { merge: true }
  );
}

/**
 * Upsert a full v3 subject entry atomically.
 *
 * Use this from the delta publish route — it writes the entityIndex, patches
 * array, and contentVersion in a single Firestore write, preserving all other
 * subjects and featureFlags.
 *
 * @param {object} params
 * @param {string}  params.subjectId
 * @param {string}  params.contentVersion   - New coarse version token
 * @param {string}  params.updatedAt        - ISO-8601 publish timestamp
 * @param {boolean} params.enabled
 * @param {string}  params.minAppVersion
 * @param {object}  params.entityIndex      - { entityType: { id: versionToken } }
 * @param {Array}   params.patches          - PatchBundleEntry[]
 * @param {number}  params.approvedLessonsCount
 * @param {number}  params.approvedSectionsCount
 * @param {number}  params.approvedBlocksCount
 * @param {string|null} params.legacyDownloadUrl  - Kept for legacy subjects
 * @param {string|null} params.legacySha256
 * @param {number|null} params.legacySize
 */
export async function upsertDeltaSubjectEntry({
  subjectId,
  contentVersion,
  updatedAt,
  enabled,
  minAppVersion,
  entityIndex,
  patches,
  approvedLessonsCount,
  approvedSectionsCount,
  approvedBlocksCount,
  legacyDownloadUrl = null,
  legacySha256      = null,
  legacySize        = null,
}) {
  const entry = {
    id:                   subjectId,
    contentVersion,
    updatedAt,
    enabled:              enabled ?? true,
    minAppVersion:        minAppVersion || '1.0',
    entityIndex,
    patches,
    approvedLessonsCount,
    approvedSectionsCount,
    approvedBlocksCount,
    // Legacy fields — kept so subjects mid-migration still work on old app builds
    ...(legacyDownloadUrl ? { legacyDownloadUrl, legacySha256, legacySize } : {}),
  };

  return upsertSubjectEntry(entry);
}

/** Remove one subject entry from the manifest while preserving all other fields. */
export async function removeSubjectEntry(subjectId) {
  const db       = getAdminFirestore();
  const ref      = db.collection(COLLECTION).doc(DOC);
  const snap     = await ref.get();
  const existing = snap.exists ? snap.data() : { subjects: [], featureFlags: DEFAULT_FLAGS };

  const subjects = (existing.subjects || []).filter((entry) => entry.id !== subjectId);

  await ref.set(
    {
      schemaVersion: existing.schemaVersion || '3.0',
      updatedAt:     new Date().toISOString(),
      subjects,
      featureFlags:  existing.featureFlags || DEFAULT_FLAGS,
    },
    { merge: true }
  );
}

/** Merge-update only the featureFlags field. */
export async function updateFeatureFlags(flags) {
  const db  = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc(DOC);
  await ref.set(
    { featureFlags: flags, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}
