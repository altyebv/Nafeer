import mongoose from 'mongoose';

// ─── SubjectGuide ─────────────────────────────────────────────────────────────
// One per subject, written by its lead (docs/team-leads.md L2):
//   handbook  — the subject's standards and style, read by every member at
//               /editor/guide
//   checklist — what a reviewer confirms before approving a lesson; shown in
//               the review panel (components/review/LessonReview.jsx)

export const MAX_HANDBOOK_LENGTH = 20000;
export const MAX_CHECKLIST_ITEMS = 15;
export const MAX_CHECKLIST_ITEM_LENGTH = 200;

const SubjectGuideSchema = new mongoose.Schema(
  {
    subjectId: { type: String, required: true, unique: true },
    handbook:  { type: String, default: '', maxlength: MAX_HANDBOOK_LENGTH },
    checklist: { type: [String], default: [] },
    updatedById:   { type: String, default: '' },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true }
);

export const SubjectGuide =
  mongoose.models.SubjectGuide || mongoose.model('SubjectGuide', SubjectGuideSchema);
