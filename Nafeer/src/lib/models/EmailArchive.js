import mongoose from 'mongoose';

// What remains of email log rows after they are deleted: counts per month and
// template, nothing that identifies a recipient or a message.
const emailArchiveSchema = new mongoose.Schema(
  {
    month:     { type: String, required: true },  // 'YYYY-MM' (UTC)
    template:  { type: String, required: true },
    total:     { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },      // confirmed by the delivery webhook
    problems:  { type: Number, default: 0 },      // failed to send, bounced or reported
  },
  { collection: 'email_log_archive', timestamps: false }
);

emailArchiveSchema.index({ month: 1, template: 1 }, { unique: true });

export const EmailArchive =
  mongoose.models.EmailArchive || mongoose.model('EmailArchive', emailArchiveSchema);
