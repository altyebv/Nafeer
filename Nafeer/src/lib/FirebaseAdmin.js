import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Firebase Admin singleton ─────────────────────────────────────────────────
// Safe to call multiple times — getApps() guards against double-init in
// Next.js hot-reload and serverless environments.
//
// Required env vars:
//   FIREBASE_PROJECT_ID       — e.g. "basheer-xxxxx"
//   FIREBASE_CLIENT_EMAIL     — service account client_email
//   FIREBASE_PRIVATE_KEY      — service account private_key
//                               Vercel stores newlines as literal \n — the
//                               replace() below handles both raw and escaped forms.
//
// Service account: Firebase Console → Project Settings → Service Accounts →
//   Generate new private key → copy the three fields above.

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

/** Default flags — used when manifest doesn't exist yet. */
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
 * Upsert one subject entry in the manifest.
 * All other fields (other subjects, featureFlags) are preserved via merge.
 */
export async function upsertSubjectEntry(entry) {
  const db       = getAdminFirestore();
  const ref      = db.collection(COLLECTION).doc(DOC);
  const snap     = await ref.get();
  const existing = snap.exists ? snap.data() : { subjects: [], featureFlags: DEFAULT_FLAGS };

  const subjects = [
    ...(existing.subjects || []).filter((s) => s.id !== entry.id),
    entry,
  ];

  // merge: true preserves featureFlags (and any future top-level fields) if
  // updateFeatureFlags() runs concurrently. merge: false would silently
  // overwrite the entire document, losing a flag change made milliseconds prior.
  await ref.set(
    {
      schemaVersion: '2.0',
      updatedAt:     new Date().toISOString(),
      subjects,
      // Only write featureFlags when the document doesn't exist yet (bootstrap).
      // After that, updateFeatureFlags() owns this field via its own merge:true write.
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