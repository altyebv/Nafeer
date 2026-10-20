import mongoose from 'mongoose';

// ─── Release ──────────────────────────────────────────────────────────────────
// A team lead's request to publish their subject to the app (docs/team-leads.md
// L5, lib/releases.js). It is held for a few hours so the owner can cancel it,
// then runs the same pipeline as the owner's publish (lib/publishSubject.js).
//
//   held → publishing → published | noop | failed
//   held → cancelled

const ReleaseSchema = new mongoose.Schema(
  {
    subjectId:         { type: String, required: true, index: true },
    status:            { type: String, enum: ['held', 'publishing', 'published', 'noop', 'failed', 'cancelled'], default: 'held', index: true },
    requestedById:     { type: String, required: true },
    requestedByName:   { type: String, default: '' },
    note:              { type: String, default: '', maxlength: 500 },
    goLiveAt:          { type: Date, required: true, index: true },

    // What the dry run said would change, when it was requested.
    preview: {
      changed: { type: mongoose.Schema.Types.Mixed, default: {} },
      deleted: { type: mongoose.Schema.Types.Mixed, default: {} },
      lessons: { type: mongoose.Schema.Types.Mixed, default: null },
      fromVersion: { type: String, default: null },
    },

    // Set when a sweep claims it (held → publishing). A release still
    // publishing long after this was cut off mid-run (lib/releases.js).
    publishingStartedAt: { type: Date, default: null },
    publishedAt:       { type: Date, default: null },
    contentVersion:    { type: String, default: null },
    error:             { type: String, default: '' },
    cancelledByName:   { type: String, default: '' },
    cancelReason:      { type: String, default: '' },
  },
  { timestamps: true }
);

ReleaseSchema.index({ subjectId: 1, createdAt: -1 });

export const Release =
  mongoose.models.Release || mongoose.model('Release', ReleaseSchema);
