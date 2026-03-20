import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { SUBJECT_IDS } from '@/shared/curriculum';

// ─── Username validation ──────────────────────────────────────────────────────
// Allows: Arabic letters (\u0600-\u06FF), English letters, digits, underscores, dots, hyphens
// Length: 3–20 characters
const USERNAME_RE = /^[\w\u0600-\u06FF._-]{3,20}$/;

// ─── Stats subdocument ────────────────────────────────────────────────────────
const StatsSchema = new mongoose.Schema(
  {
    lessonsCreated:   { type: Number, default: 0 },
    questionsAdded:   { type: Number, default: 0 },
    feedItemsCreated: { type: Number, default: 0 },
    blocksAdded:      { type: Number, default: 0 },
    reviewsSubmitted: { type: Number, default: 0 },
    publishedLessons: { type: Number, default: 0 },
    totalTimeMs:      { type: Number, default: 0 },
    lastActiveAt:     { type: Date,   default: null },
  },
  { _id: false }
);

// ─── Contributor schema ───────────────────────────────────────────────────────

const ContributorSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    gender:   { type: String, enum: ['male', 'female'], required: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },

    // sparse: true so existing docs with null username don't clash on unique index
    username: {
      type: String, unique: true, sparse: true, trim: true,
      validate: {
        validator: (v) => USERNAME_RE.test(v),
        message: 'اسم المستخدم يجب أن يكون 3-20 حرفاً ويحتوي على أحرف أو أرقام أو _ . -',
      },
    },

    subject:      { type: String, required: true, enum: SUBJECT_IDS },
    passwordHash: { type: String, select: false },

    avatarUrl:    { type: String, default: null },
    avatarPath:   { type: String, select: false, default: null },
    bio:          { type: String, default: '', trim: true, maxlength: 280 },

    onboarded:           { type: Boolean, default: false },
    onboardingToken:     { type: String,  select: false, default: null },
    onboardingExpiresAt: { type: Date,    default: null },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    role:   { type: String, enum: ['contributor', 'admin'], default: 'contributor' },

    lastSignedInAt: { type: Date, default: null },
    stats: { type: StatsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

ContributorSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

ContributorSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 12);
};

export const Contributor =
  mongoose.models.Contributor ||
  mongoose.model('Contributor', ContributorSchema);
