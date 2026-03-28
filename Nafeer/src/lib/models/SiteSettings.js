import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema(
  {
    // Singleton key — always 'global'
    key: { type: String, default: 'global', unique: true },

    // Landing page toggles
    showContributorsOnLanding: { type: Boolean, default: true },
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