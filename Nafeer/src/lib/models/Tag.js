import mongoose from 'mongoose';
import { versioningFields } from './versioning';

// ─── Tag ──────────────────────────────────────────────────────────────────────
// Flat label attached to concepts. Concepts carry tagIds[].
// Tags scope to a subject — no cross-subject tags.

const TagSchema = new mongoose.Schema(
  {
    contentId: {
      type: String,
      required: true,
      unique: true,
    },

    subjectId: {
      type: String,
      required: true,
      index: true,
    },

    nameAr: { type: String, required: true },
    nameEn: { type: String, default: null },

    ...versioningFields,
  },
  { timestamps: true }
);

export const Tag =
  mongoose.models.Tag || mongoose.model('Tag', TagSchema);
