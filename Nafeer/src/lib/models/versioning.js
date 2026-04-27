import mongoose from 'mongoose';

// ─── Versioning Mixin ─────────────────────────────────────────────────────────
// Spread into any content schema that needs authorship + status tracking.
// Full versioning: Lesson, Concept, FeedItem, Question
// Light versioning: Subject, Unit, Section, Block, Tag, Exam (same fields, same rules)

export const versioningFields = {
  version: {
    type: Number,
    default: 1,
  },

  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'archived'],
    default: 'draft',
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor',
    required: true,
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor',
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor',
  },

  // Timestamp of the last admin approval/rejection action
  reviewedAt: {
    type: Date,
    default: null,
  },

  // Embedded changelog — intentionally shallow (cap 5).
  // Full history lives in the LessonHistory collection.
  // This serves "what happened recently" in the header, not deep archaeology.
  changelog: [
    {
      version: Number,
      action: {
        type: String,
        enum: ['created', 'edited', 'reviewed', 'approved', 'archived'],
      },
      by:           { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },
      note:         { type: String, default: '' },
      versionLabel: { type: String, default: '' },
      timestamp:    { type: Date, default: Date.now },
    },
  ],
};

// ─── DIFF_FIELDS ──────────────────────────────────────────────────────────────
// The scalar lesson fields we track diffs for.
const DIFF_FIELDS = [
  'title',
  'summary',
  'estimatedMinutes',
  'status',
  'metadata.hook',
  'metadata.forwardPull',
  'metadata.orientation',
];

// ─── computeDiff ──────────────────────────────────────────────────────────────
// Compares currentDoc against updates ($set payload).
// Returns sparse { field: { from, to } } — null when nothing changed.
//
export function computeDiff(currentDoc, updates) {
  const diff = {};

  for (const field of DIFF_FIELDS) {
    const parts    = field.split('.');
    const isNested = parts.length > 1;

    let currentVal;
    if (isNested) {
      currentVal = currentDoc[parts[0]]?.[parts[1]] ?? null;
    } else {
      currentVal = currentDoc[field] ?? null;
    }

    let updatedVal;
    if (isNested) {
      if (field in updates) {
        updatedVal = updates[field];
      } else if (parts[0] in updates && typeof updates[parts[0]] === 'object') {
        updatedVal = updates[parts[0]][parts[1]] ?? null;
      } else {
        continue;
      }
    } else {
      if (!(field in updates)) continue;
      updatedVal = updates[field] ?? null;
    }

    const cur = Array.isArray(currentVal) ? JSON.stringify(currentVal) : currentVal;
    const upd = Array.isArray(updatedVal) ? JSON.stringify(updatedVal) : updatedVal;

    if (cur !== upd) {
      diff[field] = {
        from: Array.isArray(currentVal) ? [...currentVal] : currentVal,
        to:   Array.isArray(updatedVal) ? [...updatedVal] : updatedVal,
      };
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}

// ─── applyVersionBump ─────────────────────────────────────────────────────────
// Returns { updates, diff }.
// Caller writes diff to LessonHistory collection.
// baxkward copmatible : can be used for other content types with same versioning fields + rules.
export function applyVersionBump(
  updates,
  currentDoc,
  contributorId,
  action = 'edited',
  note = '',
  versionLabel = '',
  skipRedraft = false
) {
  const newVersion = (currentDoc.version || 1) + 1;

  updates.version   = newVersion;
  updates.updatedBy = contributorId;

  if (currentDoc.status === 'approved' && !skipRedraft) { // guard reom redrafting
    updates.status = 'draft';
  }

  const entry = {
    version:      newVersion,
    action,
    by:           contributorId,
    note,
    versionLabel: versionLabel || '',
    timestamp:    new Date(),
  };

  const existing    = currentDoc.changelog || [];
  updates.changelog = [...existing.slice(-4), entry];

  const diff = action === 'edited' ? computeDiff(currentDoc, updates) : null;

  return { updates, diff };
}

// ─── initialChangelog ─────────────────────────────────────────────────────────
export function initialChangelog(contributorId, note = '') {
  return [
    {
      version:      1,
      action:       'created',
      by:           contributorId,
      note,
      versionLabel: '',
      timestamp:    new Date(),
    },
  ];
}