import mongoose from 'mongoose';

// ─── Member subdocument ───────────────────────────────────────────────────────
const TeamMemberSchema = new mongoose.Schema(
  {
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contributor',
      required: true,
    },
    // Displayed role within the team — 'leader' is the subject supervisor
    teamRole: {
      type: String,
      enum: ['leader', 'member'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Team schema ──────────────────────────────────────────────────────────────
const TeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },

    // Optional — the primary subject this team supervises.
    // Empty string means the team is cross-subject or not yet assigned.
    subject: { type: String, default: '', trim: true },

    members: { type: [TeamMemberSchema], default: [] },
  },
  { timestamps: true }
);

// ─── Virtual: leaderId ────────────────────────────────────────────────────────
// Convenience getter — returns the contributorId of the first 'leader' member.
TeamSchema.virtual('leaderId').get(function () {
  return this.members.find((m) => m.teamRole === 'leader')?.contributorId ?? null;
});

export const Team =
  mongoose.models.Team || mongoose.model('Team', TeamSchema);