import mongoose from 'mongoose';
import { versioningFields } from './versioning';

// ─── Subject ──────────────────────────────────────────────────────────────────
// One document per subject in Atlas. Owned by one contributor.
// Units and lessons are stored as separate documents (not embedded).

const SubjectSchema = new mongoose.Schema(
  {
    // The stable string key — matches SUBJECTS_CATALOG[id]
    // Used by Android, never changes
    subjectId: {
      type: String,
      required: true,
      unique: true,
    },

    nameAr: { type: String, required: true },
    nameEn: { type: String, default: null },
    path: { type: String },        // 'SCIENCE' | 'LITERARY' | 'COMMON'
    isMajor: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    colorHex: { type: String, default: null },
    // Inside SubjectSchema, after colorHex:
    iconUrl: { type: String, default: null },

    // How this subject's formulas are typeset: 'ARABIC' | 'LATIN'.
    // null defers to the catalog (getMathNotation in shared/curriculum.js),
    // so only subjects outside the catalog need to set it.
    mathNotation: { type: String, enum: ['ARABIC', 'LATIN', null], default: null },

    // The contributor assigned to this subject
    contributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contributor',
      required: true,
    },

    ...versioningFields,
  },
  { timestamps: true }
);

export const Subject =
  mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
