import mongoose from 'mongoose';
import { versioningFields } from './versioning';
import { SUBJECT_IDS } from '@/shared/curriculum';

// ─── Unit ─────────────────────────────────────────────────────────────────────
// Belongs to a Subject. Has a stable contentId used by Android.

const UnitSchema = new mongoose.Schema(
  {
    // Stable ID — e.g. 'PHYSICS_U1' — never changes, referenced by Android
    contentId: {
      type: String,
      required: true,
      unique: true,
    },

    subjectId: {
      type: String,
      required: true,
      enum: SUBJECT_IDS,
      index: true,
    },

    title:       { type: String, required: true },
    order:       { type: Number, required: true },
    description: { type: String, default: null },

    ...versioningFields,
  },
  { timestamps: true }
);

UnitSchema.index({ subjectId: 1, order: 1 });

export const Unit =
  mongoose.models.Unit || mongoose.model('Unit', UnitSchema);