import mongoose from 'mongoose';
import { SUBJECT_IDS } from '@/shared/curriculum';

const MEDIA_TYPES = ['IMAGE', 'GIF'];

const MediaSchema = new mongoose.Schema(
  {
    contentId: { type: String, required: true, unique: true, index: true },
    subjectId: {
      type: String, required: true,
      validate: {
        validator: (v) => [...SUBJECT_IDS, 'common'].includes(v),
        message:   (props) => `${props.value} is not a valid subjectId`,
      },
      index: true,
    },
    filename:     { type: String, required: true, trim: true },
    path:         { type: String, required: true },
    url:          { type: String, required: true },
    mimeType:     { type: String, required: true },

    // Size after optimization (what's stored in Supabase)
    size:         { type: Number, required: true },
    // Size of the original upload before optimization (for analytics)
    originalSize: { type: Number, default: null },

    type:        { type: String, enum: MEDIA_TYPES, required: true },
    alt:         { type: String, default: '', trim: true },
    uploadedBy:  { type: String, required: true },
  },
  { timestamps: true }
);

MediaSchema.index({ subjectId: 1, type: 1, createdAt: -1 });

export const Media =
  mongoose.models.Media || mongoose.model('Media', MediaSchema);
