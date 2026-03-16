import mongoose from 'mongoose';
import { SUBJECT_IDS } from '@/shared/curriculum';

// ─── Media ────────────────────────────────────────────────────────────────────
// Represents a single file stored in Supabase Storage.
// Created on upload, destroyed on delete.
// `url` and `path` are immutable after creation (re-upload creates a new record).

const MEDIA_TYPES = ['IMAGE', 'GIF'];

const MediaSchema = new mongoose.Schema(
  {
    // Our own stable ID, also used as the storage path segment
    contentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Subject this media belongs to — drives contributor visibility scoping.
    // 'common' is a special virtual subject for shared assets (admin-only upload).
    subjectId: {
      type: String,
      required: true,
      validate: {
        validator: (v) => [...SUBJECT_IDS, 'common'].includes(v),
        message: (props) => `${props.value} is not a valid subjectId`,
      },
      index: true,
    },

    // Human-readable display name (original filename, sanitised)
    filename: {
      type: String,
      required: true,
      trim: true,
    },

    // Supabase storage path: "{subjectId}/{contentId}.{ext}"
    path: {
      type: String,
      required: true,
    },

    // Public CDN URL returned by Supabase
    url: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    // File size in bytes
    size: {
      type: Number,
      required: true,
    },

    // Block type this media maps to (IMAGE or GIF)
    type: {
      type: String,
      enum: MEDIA_TYPES,
      required: true,
    },

    // Arabic alt text for accessibility + Android screen readers
    alt: {
      type: String,
      default: '',
      trim: true,
    },

    // Contributor or admin who uploaded
    uploadedBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

MediaSchema.index({ subjectId: 1, type: 1, createdAt: -1 });

export const Media =
  mongoose.models.Media || mongoose.model('Media', MediaSchema);