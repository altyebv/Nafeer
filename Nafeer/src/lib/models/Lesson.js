import mongoose from 'mongoose';
import { versioningFields } from './versioning';
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

    metadata: { type: mongoose.Schema.Types.Mixed, default: null },

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

    // ── Contributor notes / review feedback ───────────────────────────────
    // Stored as subdocuments so they travel with the lesson.
    // notesCount is a denormalized total for fast list-view indicators.
    notesCount: { type: Number, default: 0 },
    notes: [
      {
        // text of the note
        text:       { type: String, required: true, trim: true },
        // author fields are denormalized so display never needs a lookup
        authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor', default: null },
        authorName: { type: String, default: '' },
        authorRole: { type: String, enum: ['contributor', 'admin'], default: 'contributor' },
        // 'comment'        — general note from any contributor
        // 'review_feedback'— written by admin when approving/rejecting
        // 'flag'           — marks something that needs attention
        noteType:   { type: String, enum: ['comment', 'review_feedback', 'flag'], default: 'comment' },
        resolved:   { type: Boolean, default: false },
        createdAt:  { type: Date, default: Date.now },
      },
    ],

    // ── Lesson Variations ─────────────────────────────────────────────────
    // A variation is a lesson that is linked to another lesson (its parent).
    // The parent field is a contentId string (not an ObjectId ref) so it stays
    // stable and never needs populate — same pattern as unitContentId / sectionContentId.
    //
    // variation types:
    //   'alternative'  — different author or pedagogical approach
    //   'prerequisite' — foundation content to study before the parent
    //   'extension'    — deeper / more advanced content after the parent
    //   'simplified'   — easier version for struggling students
    parentLesson: {
      type:    String,       // contentId of parent lesson, null = root lesson
      default: null,
      index:   true,
    },
    variationType: {
      type:    String,
      enum:    ['alternative', 'prerequisite', 'extension', 'simplified', null],
      default: null,
    },
    variationNote: {
      type:    String,
      default: null,
      maxlength: 200,
    },

    ...versioningFields,
  },
  { timestamps: true }
);

LessonSchema.index({ subjectId: 1, unitContentId: 1, order: 1 });
LessonSchema.index({ subjectId: 1, status: 1 });

export const Lesson =
  mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);