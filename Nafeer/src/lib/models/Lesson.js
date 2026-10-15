import mongoose from 'mongoose';
import { versioningFields } from './versioning';

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

        // ── Review comments (lib/review.js) ──
        // Where the comment applies, so the editor can take the contributor
        // straight there. `label` is a snapshot ("القسم 2 · النموذج") that
        // still reads correctly if the section is later renamed or removed.
        anchor: {
          kind:  { type: String, enum: ['lesson', 'meta', 'section', 'block', 'question', 'feed'], default: 'lesson' },
          id:    { type: String, default: null },
          label: { type: String, default: '' },
        },
        // The review round the comment belongs to; 0 for ordinary notes.
        round:          { type: Number, default: 0 },
        resolvedAt:     { type: Date, default: null },
        resolvedByName: { type: String, default: '' },
      },
    ],

    // ── Review round trip (lib/review.js) ─────────────────────────────────
    // `status` keeps its four values; "returned" is a draft with
    // reviewState.returned set, so the export and the queue need no new state.
    reviewState: {
      returned:       { type: Boolean, default: false },
      round:          { type: Number,  default: 0 },
      returnedAt:     { type: Date,    default: null },
      returnedByName: { type: String,  default: '' },
      submittedAt:    { type: Date,    default: null },
    },

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
      type:    String,
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

    // ── Within-unit lesson grouping (optional) ────────────────────────────
    // Presentational only — no effect on progress, analytics, or quiz logic.
    // All lessons sharing the same groupId within a unit are rendered under
    // a shared groupTitle sub-header in the Android app.
    groupId: {
      type:    String,
      default: null,
      index:   true,         // indexed so we can query all lessons of a group
    },
    groupTitle: {
      type:    String,
      default: null,
    },
    // JSON blob — reserved for future group-level data (description, icon, color…)
    // Currently stores { description: string } when set by contributors.
    groupMetadata: {
      type:    String,
      default: null,
    },

    // Who last opened the lesson in the editor, so the next person can be
    // told someone may be working on it. Written by the lesson GET, without
    // touching updatedAt or the version; never exported to the app.
    openedBy: {
      id:   { type: String, default: null },
      name: { type: String, default: null },
    },
    openedAt: { type: Date, default: null },

    ...versioningFields,
  },
  { timestamps: true }
);

LessonSchema.index({ subjectId: 1, unitContentId: 1, order: 1 });
LessonSchema.index({ subjectId: 1, status: 1 });

export const Lesson =
  mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);
