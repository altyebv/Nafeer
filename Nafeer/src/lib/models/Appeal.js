import mongoose from 'mongoose';

// ─── Appeal ───────────────────────────────────────────────────────────────────
// A member contesting a lead's decision about them (docs/team-leads.md L5,
// lib/appeals.js): a lesson returned with comments, an intervention in their
// lesson, or a pause. The owner resolves it.

const AppealSchema = new mongoose.Schema(
  {
    subjectId:   { type: String, required: true, index: true },
    byId:        { type: String, required: true, index: true },
    byName:      { type: String, default: '' },
    kind:        { type: String, enum: ['return', 'intervention', 'pause'], required: true },
    targetId:    { type: String, default: '' },     // lesson contentId; the member for a pause
    targetLabel: { type: String, default: '' },
    againstName: { type: String, default: '' },     // the lead whose decision it is
    text:        { type: String, required: true, maxlength: 1000 },

    status:         { type: String, enum: ['open', 'upheld', 'dismissed'], default: 'open', index: true },
    resolution:     { type: String, default: '', maxlength: 1000 },
    resolvedByName: { type: String, default: '' },
    resolvedAt:     { type: Date, default: null },
  },
  { timestamps: true }
);

export const Appeal = mongoose.models.Appeal || mongoose.model('Appeal', AppealSchema);
