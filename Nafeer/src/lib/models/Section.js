import mongoose from 'mongoose';
import { versioningFields } from './Versioning';
import { SUBJECT_IDS } from '@/shared/curriculum';

// ─── Section ──────────────────────────────────────────────────────────────────
// A named subdivision inside a lesson. Has learningType which drives
// Basheer's UX (UNDERSTANDING → lab mode, MEMORIZATION → feed mode).
// Blocks are stored as separate documents, linked by sectionContentId.

const LEARNING_TYPES = ['UNDERSTANDING', 'MEMORIZATION', 'HYBRID'];

const SectionSchema = new mongoose.Schema(
  {
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

    lessonContentId: {
      type: String,
      required: true,
      index: true,
    },

    title:        { type: String, required: true },
    order:        { type: Number, required: true },
    learningType: {
      type: String,
      enum: LEARNING_TYPES,
      default: 'UNDERSTANDING',
    },

    // Concept IDs linked to this section
    conceptIds: [{ type: String }],

    ...versioningFields,
  },
  { timestamps: true }
);

SectionSchema.index({ lessonContentId: 1, order: 1 });

export const Section =
  mongoose.models.Section || mongoose.model('Section', SectionSchema);