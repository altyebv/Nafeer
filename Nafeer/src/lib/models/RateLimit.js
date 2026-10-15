import mongoose from 'mongoose';

// One row per (bucket, caller, window). The TTL index lets Mongo drop rows once
// their window has passed, so the collection never grows past the callers seen
// in the current windows.
const rateLimitSchema = new mongoose.Schema(
  {
    _id:       { type: String },           // `${bucket}:${hashedIp}:${windowIndex}`
    count:     { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'rate_limits', versionKey: false, timestamps: false }
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit =
  mongoose.models.RateLimit || mongoose.model('RateLimit', rateLimitSchema);
