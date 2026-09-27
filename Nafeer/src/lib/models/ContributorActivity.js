import mongoose from 'mongoose';

// ─── ContributorActivity ───────────────────────────────────────────────────────
// Append-only log of contributor interactions — one document per event.
// Powers the activity heatmap and streak calculations. Not a source of truth for
// totals (Contributor.stats is, for cheap reads) — this is the source of truth
// for *when* effort happened.
//
// `type` mirrors the Contributor.stats field the event also incremented
// (see src/lib/trackStat.js), e.g. 'lessonsCreated', 'commentsPosted'.

const ContributorActivitySchema = new mongoose.Schema(
  {
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contributor',
      required: true,
      index: true,
    },
    type: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ContributorActivitySchema.index({ contributorId: 1, createdAt: -1 });

export const ContributorActivity =
  mongoose.models.ContributorActivity ||
  mongoose.model('ContributorActivity', ContributorActivitySchema);
