import mongoose from 'mongoose';

// ─── PublishedCopy ────────────────────────────────────────────────────────────
// An approved lesson as it was when someone started changing it. Releases ship
// this copy until the change is approved (lib/publishedCopy.js).
//
// The documents are stored as read, `updatedAt` included, so the delta engine
// sees no change in them.

const PublishedCopySchema = new mongoose.Schema(
  {
    lessonContentId: { type: String, required: true },
    subjectId:       { type: String, required: true, index: true },
    // The lesson version that was copied.
    approvedVersion: { type: Number, required: true },
    lesson:          { type: mongoose.Schema.Types.Mixed, required: true },
    sections:        { type: [mongoose.Schema.Types.Mixed], default: [] },
    blocks:          { type: [mongoose.Schema.Types.Mixed], default: [] },
    // Checkpoint questions only: they ship with their section.
    questions:       { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, minimize: false }
);

PublishedCopySchema.index({ lessonContentId: 1, approvedVersion: 1 }, { unique: true });

export const PublishedCopy =
  mongoose.models.PublishedCopy || mongoose.model('PublishedCopy', PublishedCopySchema);
