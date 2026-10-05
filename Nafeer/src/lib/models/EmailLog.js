import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema(
  {
    to:         { type: String, required: true, index: true },
    subject:    { type: String, required: true },
    template:   { type: String, required: true, index: true },
    status:     { type: String, enum: ['sent', 'failed'], required: true, index: true },
    error:      { type: String, default: null },
    providerId: { type: String, default: null, index: true },  // Resend message ID
    timestamp:  { type: Date,   default: Date.now, index: true },

    // What happened after the provider accepted the message — written by the
    // Resend webhook (/api/webhooks/resend), null until the first event lands.
    delivery: {
      type:    String,
      enum:    ['delivered', 'delayed', 'bounced', 'complained', 'failed', null],
      default: null,
    },
    deliveryDetail:    { type: String, default: null },
    deliveryUpdatedAt: { type: Date,   default: null },
  },
  {
    collection: 'email_logs',
    // No updatedAt needed — rows are written once, then only `delivery*` changes
    timestamps: false,
  }
);

export const EmailLog =
  mongoose.models.EmailLog || mongoose.model('EmailLog', emailLogSchema);
