import mongoose from 'mongoose';

// ─── LessonHistory ────────────────────────────────────────────────────────────
// Separate collection for the full audit trail of a lesson.
// One document per version bump. Lean by design — no full snapshots.
//
// Why separate:
//   - History never loads with the lesson in normal editor flow
//   - Uncapped (no 10-entry limit)
//   - Diff is sparse — only fields that actually changed are stored
//
// Indexed only on lessonContentId — all queries are "get all for this lesson".

const DiffFieldSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.Mixed, default: null },
    to:   { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const LessonHistorySchema = new mongoose.Schema(
  {
    lessonContentId: {
      type:     String,
      required: true,
      index:    true,
    },

    version: {
      type:     Number,
      required: true,
    },

    action: {
      type: String,
      enum: ['created', 'edited', 'reviewed', 'approved', 'archived'],
      required: true,
    },

    // Optional human label attached at save time by the contributor
    // e.g. "مراجعة بعد الفيدباك" — the 2c versionLabel feature
    versionLabel: {
      type:    String,
      default: '',
      trim:    true,
      maxlength: 80,
    },

    // Denormalized — no populate needed at read time
    byId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    byName: { type: String, default: '' },

    note: { type: String, default: '' },

    // Sparse diff — only present on 'edited' events, only changed fields included.
    // Tracked fields: title, summary, estimatedMinutes, status,
    //                 metadata.hook, metadata.forwardPull, metadata.orientation
    // Absent on 'created', 'reviewed', 'approved', 'archived'.
    diff: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },

    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    // No timestamps: true — we use our own timestamp field
    // No versionKey — these are immutable append-only records
    versionKey: false,
  }
);

// Compound index so "latest N for a lesson" is fast
LessonHistorySchema.index({ lessonContentId: 1, version: -1 });

export const LessonHistory =
  mongoose.models.LessonHistory ||
  mongoose.model('LessonHistory', LessonHistorySchema);