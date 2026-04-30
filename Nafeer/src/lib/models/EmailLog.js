import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema(
  {
    to:         { type: String, required: true, index: true },
    subject:    { type: String, required: true },
    template:   { type: String, required: true, index: true },
    status:     { type: String, enum: ['sent', 'failed'], required: true, index: true },
    error:      { type: String, default: null },
    providerId: { type: String, default: null },  // Resend message ID
    timestamp:  { type: Date,   default: Date.now, index: true },
  },
  {
    collection: 'email_logs',
    // No updatedAt needed — logs are append-only
    timestamps: false,
  }
);

export const EmailLog =
  mongoose.models.EmailLog || mongoose.model('EmailLog', emailLogSchema);