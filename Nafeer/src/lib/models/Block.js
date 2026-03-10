import mongoose from 'mongoose';
import { versioningFields } from '../Versioning';
import { SUBJECT_IDS } from '@/shared/curriculum';

// ─── Block ────────────────────────────────────────────────────────────────────
// Atomic content unit inside a section. type matches Android BlockType enum.
// The content field holds the main payload — structure varies by type
// (plain string for TEXT/HEADING, stringified JSON for TABLE, etc.)

const BLOCK_TYPES = [
  'TEXT', 'HEADING', 'IMAGE', 'GIF', 'FORMULA',
  'HIGHLIGHT_BOX', 'EXAMPLE', 'TIP', 'LIST', 'TABLE', 'QUOTE', 'DIVIDER',
];

const BlockSchema = new mongoose.Schema(
  {
    contentId: {
      type: String,
      required: true,
      unique: true,
    },

    subjectId: {
      type: String,
      required: true,
      enum: SUBJECT_IDS,
      index: true,
    },

    sectionContentId: {
      type: String,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: BLOCK_TYPES,
      required: true,
    },

    content:    { type: String, default: '' },
    order:      { type: Number, required: true },
    conceptRef: { type: String, default: null },   // conceptId reference
    caption:    { type: String, default: null },
    metadata:   { type: mongoose.Schema.Types.Mixed, default: null },

    ...versioningFields,
  },
  { timestamps: true }
);

BlockSchema.index({ sectionContentId: 1, order: 1 });

export const Block =
  mongoose.models.Block || mongoose.model('Block', BlockSchema);