import mongoose from 'mongoose';
import { versioningFields } from './Versioning';
import { SUBJECT_IDS } from '@/shared/curriculum';

// ─── Question ─────────────────────────────────────────────────────────────────
// An exam/quiz question in Basheer's Question Bank.
// Cross-referenced by lessonContentId, unitContentId, and conceptIds.
// Full versioning.

const QUESTION_TYPES = [
  'TRUE_FALSE', 'MCQ', 'FILL_BLANK', 'MATCH',
  'SHORT_ANSWER', 'EXPLAIN', 'LIST', 'TABLE',
  'FIGURE', 'COMPARE', 'ORDER',
];

const QUESTION_SOURCES = [
  'MINISTRY_FINAL', 'MINISTRY_SEMIFINAL', 'SCHOOL_EXAM',
  'REVISION_SHEET', 'TEACHER_CONTRIB', 'ORIGINAL',
];

const COGNITIVE_LEVELS = ['RECALL', 'UNDERSTAND', 'APPLY', 'ANALYZE'];

const QuestionSchema = new mongoose.Schema(
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

    type: {
      type: String,
      enum: QUESTION_TYPES,
      required: true,
      default: 'MCQ',
    },

    textAr:           { type: String, required: true },
    textEn:           { type: String, default: null },
    correctAnswer:    { type: String, required: true },
    options:          { type: mongoose.Schema.Types.Mixed, default: null },
    explanation:      { type: String, default: null },
    imageUrl:         { type: String, default: null },
    tableData:        { type: mongoose.Schema.Types.Mixed, default: null },
    difficulty:       { type: Number, default: 1, min: 1, max: 5 },
    points:           { type: Number, default: 1 },
    estimatedSeconds: { type: Number, default: 60 },

    cognitiveLevel: {
      type: String,
      enum: COGNITIVE_LEVELS,
      default: 'RECALL',
    },

    source: {
      type: String,
      enum: QUESTION_SOURCES,
      default: 'ORIGINAL',
    },

    sourceExamContentId: { type: String, default: null },
    sourceDetails:       { type: String, default: null },
    sourceYear:          { type: Number, default: null },
    feedEligible:        { type: Boolean, default: false },

    // Location links (contentIds)
    unitContentId:   { type: String, default: null, index: true },
    lessonContentId: { type: String, default: null, index: true },
    conceptIds:      [{ type: String }],

    ...versioningFields,
  },
  { timestamps: true }
);

QuestionSchema.index({ subjectId: 1, type: 1 });
QuestionSchema.index({ subjectId: 1, lessonContentId: 1 });
QuestionSchema.index({ subjectId: 1, status: 1 });
QuestionSchema.index({ subjectId: 1, feedEligible: 1 });

export const Question =
  mongoose.models.Question || mongoose.model('Question', QuestionSchema);