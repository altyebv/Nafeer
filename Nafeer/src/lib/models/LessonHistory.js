import mongoose from 'mongoose';

// ─── LessonHistory ────────────────────────────────────────────────────────────
// Separate collection for the full audit trail of a lesson.
// One document per lesson/section/block change. Lean by design — no full snapshots.
//
// Why separate:
//   - History never loads with the lesson in normal editor flow
//   - Uncapped (no 10-entry limit)
//   - Diff is sparse — only fields that actually changed are stored
//
// History is loaded only for a lesson and ordered newest-first.

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
    },

    version: {
      type:     Number,
      required: true,
    },

    action: {
      type: String,
      // 'intervened' — a lead opened or closed an intervention (note = reason).
      enum: ['created', 'edited', 'deleted', 'reviewed', 'approved', 'archived', 'intervened'],
      required: true,
    },

    entityType: {
      type: String,
      enum: ['lesson', 'section', 'block'],
      default: 'lesson',
    },

    entityContentId: { type: String, default: null },
    entityLabel:     { type: String, default: '' },

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

    // Sparse before/after fields for the changed lesson, section, or block.
    diff: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },

    timestamp: { type: Date, default: Date.now },
  },
  {
    // No timestamps: true — we use our own timestamp field
    // No versionKey — these are immutable append-only records
    versionKey: false,
  }
);

// Existing databases should drop the superseded single-field and version indexes.
LessonHistorySchema.index({ lessonContentId: 1, timestamp: -1 });

export const LessonHistory =
  mongoose.models.LessonHistory ||
  mongoose.model('LessonHistory', LessonHistorySchema);