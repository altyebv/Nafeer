import mongoose from 'mongoose';
import { versioningFields } from './versioning';
import { SUBJECT_IDS } from '@/shared/curriculum';

// ─── FeedItem ─────────────────────────────────────────────────────────────────
// A vertical-scroll knowledge card in Basheer's Knowledge Feed.
// Anchored to a concept (conceptContentId). Full versioning.

const FEED_ITEM_TYPES = [
  'DEFINITION', 'FORMULA', 'DATE', 'FACT',
  'RULE', 'TIP', 'MINI_QUIZ', 'FLASH_CARD',
];

const INTERACTION_TYPES = ['TAP_CONFIRM', 'SWIPE_TF', 'MCQ', 'MATCH'];

const FeedItemSchema = new mongoose.Schema(
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

    // Anchored to this concept
    conceptContentId: {
      type: String,
      required: true,
      index: true,
    },

    // Optional: denormalized lesson link (for coverage graph queries)
    lessonContentId: {
      type: String,
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: FEED_ITEM_TYPES,
      required: true,
    },

    contentAr:       { type: String, default: '' },
    contentEn:       { type: String, default: null },
    back:            { type: String, default: null },       // FLASH_CARD back face
    imageUrl:        { type: String, default: null },
    interactionType: { type: String, enum: INTERACTION_TYPES, default: null },
    correctAnswer:   { type: String, default: null },
    options:         { type: mongoose.Schema.Types.Mixed, default: null },
    explanation:     { type: String, default: null },

    // Optional link to a Question document (contentId)
    questionContentId: { type: String, default: null },

    priority: { type: Number, default: 1 },
    order:    { type: Number, default: 0 },

    ...versioningFields,
  },
  { timestamps: true }
);

FeedItemSchema.index({ subjectId: 1, conceptContentId: 1 });
FeedItemSchema.index({ subjectId: 1, lessonContentId: 1 });
FeedItemSchema.index({ subjectId: 1, status: 1 });

export const FeedItem =
  mongoose.models.FeedItem || mongoose.model('FeedItem', FeedItemSchema);