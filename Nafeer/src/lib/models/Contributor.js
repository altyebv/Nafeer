import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { SUBJECT_IDS } from '@/shared/curriculum';

// ─── Username validation ──────────────────────────────────────────────────────
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
    name:   { type: String, required: true, trim: true },
    gender: { type: String, enum: ['male', 'female', ''], default: '' },
    email:  { type: String, required: true, unique: true, lowercase: true, trim: true },

    username: {
      type: String, unique: true, sparse: true, trim: true,
      validate: {
        validator: (v) => USERNAME_RE.test(v),
        message: 'اسم المستخدم يجب أن يكون 3-20 حرفاً ويحتوي على أحرف أو أرقام أو _ . -',
      },
    },

    subject: { type: String, enum: [...SUBJECT_IDS, ''], default: '' },

    // ── Application / demographic fields ─────────────────────────────────────
    background:         { type: String, default: '', trim: true },
    fieldOfStudy:       { type: String, default: '', trim: true },
    subjectsOfInterest: { type: [String], default: [] },

    // Demographics — collected at join stage
    age:  { type: String, default: '' },  // stored as range string e.g. "18-22"
    town: { type: String, default: '', trim: true },

    // Readiness — device + connectivity access
    hasPcOrTablet:    { type: Boolean, default: null },
    hasStableInternet:{ type: Boolean, default: null },

    // AI familiarity
    usesAiTools: { type: Boolean, default: null },
    aiToolsList: { type: [String], default: [] }, // e.g. ['chatgpt', 'gemini', 'notebooklm']

    // ── Auth ──────────────────────────────────────────────────────────────────
    passwordHash: { type: String, select: false },
    avatarUrl:    { type: String, default: null },
    avatarPath:   { type: String, select: false, default: null },
    bio:          { type: String, default: '', trim: true, maxlength: 280 },

    // ── Role assignment ───────────────────────────────────────────────────────
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContributorRole', default: null },

    // ── Interview ─────────────────────────────────────────────────────────────
    interviewToken:     { type: String, select: false, default: null },
    interviewExpiresAt: { type: Date,   default: null },

    // Legacy fixed answers
    interviewAnswers: {
      motivation:        { type: String, default: '' },
      educationCritique: { type: String, default: '' },
      teachingMoment:    { type: String, default: '' },
      weeklyCommitment:  { type: String, default: '' },
      microTask:         { type: String, default: '' },
      submittedAt:       { type: Date,   default: null },
    },

    // Dynamic answers (role-based)
    dynamicAnswers: {
      type: [
        new mongoose.Schema(
          {
            questionId: { type: mongoose.Schema.Types.ObjectId, default: null },
            question:   { type: String, default: '' },
            answer:     { type: String, default: '' },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    dynamicAnswersSubmittedAt: { type: Date,   default: null },
    dynamicMicroTask:          { type: String, default: '' },

    // ── Onboarding ────────────────────────────────────────────────────────────
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