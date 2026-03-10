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

  // Rolling audit trail — capped at 10 entries to respect Atlas free tier
  changelog: [
    {
      version: Number,
      action: {
        type: String,
        enum: ['created', 'edited', 'reviewed', 'approved', 'archived'],
      },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },
      note: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now },
    },
  ],
};

// ─── applyVersionBump ─────────────────────────────────────────────────────────
// Call this inside update helpers whenever a document is being mutated.
// Mutates the updates object in place and returns it.
//
// @param updates      - the $set payload being sent to Mongoose
// @param currentDoc   - the current document (to read version + status)
// @param contributorId - ObjectId of the editor
// @param action       - changelog action string
// @param note         - optional human note for the changelog entry
//
export function applyVersionBump(updates, currentDoc, contributorId, action = 'edited', note = '') {
  const newVersion = (currentDoc.version || 1) + 1;

  updates.version   = newVersion;
  updates.updatedBy = contributorId;

  // If approved content is edited, it goes back to draft (requires re-review)
  if (currentDoc.status === 'approved') {
    updates.status = 'draft';
  }

  const entry = {
    version:   newVersion,
    action,
    by:        contributorId,
    note,
    timestamp: new Date(),
  };

  // $push with $slice keeps the array capped at 10 — use in MongoDB update, not here
  // For pre-save hooks: keep last 9 + new entry
  const existing = currentDoc.changelog || [];
  updates.changelog = [...existing.slice(-9), entry];

  return updates;
}

// ─── initialChangelog ─────────────────────────────────────────────────────────
// Use when creating a new document.
export function initialChangelog(contributorId, note = '') {
  return [
    {
      version:   1,
      action:    'created',
      by:        contributorId,
      note,
      timestamp: new Date(),
    },
  ];
}