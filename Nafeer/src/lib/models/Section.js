import mongoose from 'mongoose';
import { versioningFields } from './versioning';

// ─── Section ──────────────────────────────────────────────────────────────────
// A named subdivision inside a lesson. Has learningType which drives
// Basheer's UX (UNDERSTANDING → lab mode, MEMORIZATION → feed mode).
// Blocks are stored as separate documents, linked by sectionContentId.

const LEARNING_TYPES = ['UNDERSTANDING', 'MEMORIZATION', 'HYBRID'];
const SECTION_KINDS  = ['GENERAL', 'CONCEPT', 'MODEL', 'EXAMPLE'];

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

    // The role the section plays in the lesson. Basheer names it above the
    // section's title. Must match app SectionKind; GENERAL shows no label.
    kind: {
      type: String,
      enum: SECTION_KINDS,
      default: 'GENERAL',
    },

    // dividing lessons into parts (optioinal) — Sections with the same partIndex 
    // to the same part , Default 0 means single-part lesson.
    // Must match app SectionEntity.partIndex.
    partIndex: { type: Number, default: 0 },

    // Concept IDs linked to this section
    conceptIds: [{ type: String }],

    ...versioningFields,
  },
  { timestamps: true }
);

SectionSchema.index({ lessonContentId: 1, order: 1 });

export const Section =
  mongoose.models.Section || mongoose.model('Section', SectionSchema);
