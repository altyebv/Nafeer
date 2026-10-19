import mongoose from 'mongoose';

// ─── AuditEvent ───────────────────────────────────────────────────────────────
// Append-only record of what team leads do, and of the owner's actions on
// leads (docs/team-leads.md). Feeds the owner's leads overview and the daily
// digest. Written through lib/audit.js, never updated.
//
// Names are denormalised so the log still reads correctly after a lesson is
// renamed or a contributor leaves.

const AuditEventSchema = new mongoose.Schema(
  {
    // Contributor _id for a lead; the admin's id for the owner.
    actorId:   { type: String, required: true },
    actorName: { type: String, default: '' },
    actorKind: { type: String, enum: ['lead', 'admin'], required: true },

    action:    { type: String, required: true },
    subjectId: { type: String, default: '' },

    target: {
      kind:  { type: String, default: '' },
      id:    { type: String, default: '' },
      label: { type: String, default: '' },
    },

    // Required for actions that affect someone else (lib/audit.js).
    reason: { type: String, default: '' },
    // Small, action-specific details (old and new permissions, a category…).
    meta:   { type: mongoose.Schema.Types.Mixed, default: null },

    at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

AuditEventSchema.index({ subjectId: 1, at: -1 });
AuditEventSchema.index({ actorId: 1, at: -1 });

export const AuditEvent =
  mongoose.models.AuditEvent || mongoose.model('AuditEvent', AuditEventSchema);
