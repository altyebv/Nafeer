import mongoose from 'mongoose';
import { versioningFields } from './versioning';

// ─── Piece ────────────────────────────────────────────────────────────────────
// A poem (or some of its أبيات) or a Quran passage the student learns by heart.
// VERSE blocks that show it name it by `pieceId` in their metadata; the app
// schedules the student's recitals on it (Basheer docs/features/memorization.md,
// docs/contract.md §3).
//
// `lines`: one entry per بيت ("صدر | عجز") or per آية, copied from the book.
// The lesson that teaches it is not stored: the export takes the first lesson
// whose verse shows it (lib/appExport.js pieceLessons).

export const PIECE_KINDS = ['POETRY', 'QURAN'];

const PieceSchema = new mongoose.Schema(
  {
    contentId: { type: String, required: true, unique: true },
    subjectId: { type: String, required: true, index: true },

    kind:     { type: String, enum: PIECE_KINDS, required: true },
    title:    { type: String, required: true },
    lines:    { type: [String], default: [] },
    poet:     { type: String, default: null },
    surah:    { type: String, default: null },
    ayahFrom: { type: Number, default: null },
    ayahTo:   { type: Number, default: null },
    order:    { type: Number, default: 0 },

    ...versioningFields,
  },
  { timestamps: true }
);

export const Piece =
  mongoose.models.Piece || mongoose.model('Piece', PieceSchema);
