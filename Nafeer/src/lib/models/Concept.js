import mongoose from 'mongoose';
import { versioningFields } from './versioning';

// ─── Concept ──────────────────────────────────────────────────────────────────
// A discrete knowledge atom. Heavily cross-referenced:
// sections link to conceptIds, blocks can have a conceptRef,
// feedItems are anchored to a conceptId, questions reference conceptIds.
// Full versioning — concepts are core content, need review before going live.

const CONCEPT_TYPES = [
  'DEFINITION', 'FORMULA', 'DATE', 'PERSON', 'LAW',
  'FACT', 'PROCESS', 'COMPARISON', 'PLACE', 'CAUSE_EFFECT',
];

const ConceptSchema = new mongoose.Schema(
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

    type: {
      type: String,
      enum: CONCEPT_TYPES,
      required: true,
    },

    titleAr:         { type: String, required: true },
    titleEn:         { type: String, default: null },
    definition:      { type: String, default: '' },
    shortDefinition: { type: String, default: null },
    formula:         { type: String, default: null },
    imageUrl:        { type: String, default: null },
    difficulty:      { type: Number, default: 1, min: 1, max: 5 },
    extraData:       { type: mongoose.Schema.Types.Mixed, default: null },

    // Tag IDs (contentIds of Tag documents)
    tagIds: [{ type: String }],

    ...versioningFields,
  },
  { timestamps: true }
);

ConceptSchema.index({ subjectId: 1, type: 1 });
ConceptSchema.index({ subjectId: 1, status: 1 });

export const Concept =
  mongoose.models.Concept || mongoose.model('Concept', ConceptSchema);
