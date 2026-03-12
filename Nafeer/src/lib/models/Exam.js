import mongoose from 'mongoose';
import { versioningFields } from './versioning';
import { SUBJECT_IDS } from '@/shared/curriculum';

// ─── Exam ─────────────────────────────────────────────────────────────────────
// A collection of questions (a past exam paper or practice set).
// questionContentIds references Question.contentId values.

const EXAM_SOURCES = ['MINISTRY', 'SCHOOL', 'PRACTICE', 'CUSTOM'];
const EXAM_TYPES   = ['MONTHLY', 'SEMI_FINAL', 'FINAL'];

const ExamSchema = new mongoose.Schema(
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

    titleAr:     { type: String, required: true },
    titleEn:     { type: String, default: null },
    source:      { type: String, enum: EXAM_SOURCES, default: 'MINISTRY' },
    year:        { type: Number, default: null },
    schoolName:  { type: String, default: null },
    duration:    { type: Number, default: null },    // minutes
    totalPoints: { type: Number, default: null },
    description: { type: String, default: null },

    examType: {
      type: String,
      enum: EXAM_TYPES,
      default: null,
    },

    questionContentIds: [{ type: String }],
    sectionsJson:       { type: mongoose.Schema.Types.Mixed, default: null },

    ...versioningFields,
  },
  { timestamps: true }
);

ExamSchema.index({ subjectId: 1, year: -1 });

export const Exam =
  mongoose.models.Exam || mongoose.model('Exam', ExamSchema);