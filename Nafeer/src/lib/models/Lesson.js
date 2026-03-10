import mongoose from 'mongoose';
import { versioningFields } from './Versioning';
import { SUBJECT_IDS } from '@/shared/curriculum';

// ─── Lesson ───────────────────────────────────────────────────────────────────
// Core content unit. Full versioning — lessons go through draft → review → approved.
// Sections and blocks are stored as separate documents, linked by lessonContentId.

const LessonSchema = new mongoose.Schema(
  {
    // Stable ID — e.g. 'PHYSICS_U1_L2' — never changes, referenced by Android
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

    unitContentId: {
      type: String,
      required: true,
      index: true,
    },

    title:            { type: String, required: true },
    order:            { type: Number, required: true },
    estimatedMinutes: { type: Number, default: 15 },
    summary:          { type: String, default: null },

    ...versioningFields,
  },
  { timestamps: true }
);

LessonSchema.index({ subjectId: 1, unitContentId: 1, order: 1 });
LessonSchema.index({ subjectId: 1, status: 1 });

export const Lesson =
  mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);