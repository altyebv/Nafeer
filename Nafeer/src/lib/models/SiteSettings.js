import mongoose from 'mongoose';

// ── Daily visit bucket ─────────────────────────────────────────────────────────
const DailyVisitSchema = new mongoose.Schema(
  {
    date:  { type: String, required: true }, // 'YYYY-MM-DD'
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Main schema ────────────────────────────────────────────────────────────────
const SiteSettingsSchema = new mongoose.Schema(
  {
    // Singleton key — always 'global'
    key: { type: String, default: 'global', unique: true },

    // Landing page toggles
    showContributorsOnLanding: { type: Boolean, default: true },

    // Analytics — cumulative
    visitCount:   { type: Number, default: 0 },
    supportCount: { type: Number, default: 0 },

    // Analytics — daily buckets (last 90 days kept)
    visitsByDay: { type: [DailyVisitSchema], default: [] },
  },
  { timestamps: true }
);

// Helper to get (or create) the single settings document
SiteSettingsSchema.statics.getGlobal = async function () {
  let settings = await this.findOne({ key: 'global' });
  if (!settings) settings = await this.create({ key: 'global' });
  return settings;
};

export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model('SiteSettings', SiteSettingsSchema);