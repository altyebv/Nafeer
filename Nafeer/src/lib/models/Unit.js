import mongoose from 'mongoose';
import { versioningFields } from './versioning';

// ─── Unit ─────────────────────────────────────────────────────────────────────
// Belongs to a Subject. Has a stable contentId used by Android.

const UnitSchema = new mongoose.Schema(
  {
    // Stable ID — e.g. 'MATH_SCIENCE_U6' — NEVER changes, referenced by Android.
    // Derived from: `${subjectId}_U${unit.order}` in buildSubjectScaffold.
    contentId: {
      type:     String,
      required: true,
      unique:   true,
    },

    subjectId: {
      type:     String,
      required: true,
      index:    true,
    },

    title:       { type: String, required: true },

    // Global sort order within the subject — also the stable suffix of contentId.
    // MUST be unique per subject. Never reuse.
    order:       { type: Number, required: true },

    description: { type: String, default: null },

    // ── Multi-book support ─────────────────────────────────────────────────
    // When set, units sharing the same bookId are grouped under a named
    // book divider in the Android app and admin CoverageSection.
    bookId: {
      type:    String,
      default: null,
      index:   true,
    },
    bookTitle: {
      type:    String,
      default: null,
    },

    // Display-only position within the book — resets to 1 for each book.
    // e.g. ARABIC_BOOK_NAHW units show as "الوحدة 1، 2، 3" even though
    // their global `order` values are 4, 5, 6.
    // Never used in IDs or sort queries — sort always uses `order`.
    bookOrder: {
      type:    Number,
      default: null,
    },

    ...versioningFields,
  },
  { timestamps: true }
);

UnitSchema.index({ subjectId: 1, order: 1 });
UnitSchema.index({ subjectId: 1, bookId: 1, bookOrder: 1 });

export const Unit =
  mongoose.models.Unit || mongoose.model('Unit', UnitSchema);
