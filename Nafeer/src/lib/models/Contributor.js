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
    examsCreated:     { type: Number, default: 0 },
    publishedLessons: { type: Number, default: 0 },

    // Peer quality-control notes left on lessons (src/lib/api/lessons.js addLessonNote).
    // 'flag' notes mark something needing attention — the closest thing this
    // platform has to a contributor-submitted review, so they're credited here.
    reviewsSubmitted: { type: Number, default: 0 },
    commentsPosted:   { type: Number, default: 0 },

    editsMade:        { type: Number, default: 0 },

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
    portfolioUrl:       { type: String, default: '', trim: true },

    // Demographics — collected at join stage
    age:  { type: String, default: '' },  // stored as range string e.g. "18-22"
    town: { type: String, default: '', trim: true },

    // Readiness — device + connectivity access
    hasPcOrTablet:    { type: Boolean, default: null },
    hasStableInternet:{ type: Boolean, default: null },

    // How they relate to the subject (uni | grad | teacher | student | other)
    // and roughly how many hours a week — asked on the join form since Oct 2026.
    subjectRelation: { type: String, default: '' },
    weeklyHours:     { type: String, default: '' },

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

    // ── Application status link ───────────────────────────────────────────────
    // /join/status?token=… — the applicant's one lasting link (lib/applicationLinks.js).
    statusToken: { type: String, select: false, index: true },

    // ── Interview ─────────────────────────────────────────────────────────────
    interviewToken:     { type: String, select: false, default: null },
    interviewExpiresAt: { type: Date,   default: null },
    // The questions as they were when the invite went out (lib/interview.js),
    // so a lead editing their subject's questions never changes an interview
    // already in someone's hands.
    interviewSnapshot:  { type: mongoose.Schema.Types.Mixed, default: null },

    // ── A lead's decision, waiting out its undo window (L3) ──────────────────
    // Applied by lib/applicants.js applyDueDecisions once `decideAt` passes.
    pendingDecision: {
      type: new mongoose.Schema(
        {
          action:   { type: String, enum: ['approve', 'reject'], required: true },
          reason:   { type: String, default: '' },
          subject:  { type: String, default: '' },   // approve: the subject they join
          byId:     { type: String, default: '' },
          byName:   { type: String, default: '' },
          at:       { type: Date,   default: Date.now },
          decideAt: { type: Date,   required: true },
        },
        { _id: false }
      ),
      default: null,
    },

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

    // ── Team lead (docs/team-leads.md) ────────────────────────────────────────
    // A lead of `subject`. Lives here, not on Team, so the guard's existing
    // read of this document is the whole permission check. The risky
    // permissions start off; the owner turns them on per lead (lib/leads.js).
    lead: {
      active:              { type: Boolean, default: false },
      // The subject they were appointed to. Moving the contributor to
      // another subject does not carry the lead over: the guard only honours
      // the lead while this still equals `subject`.
      subject:             { type: String,  default: '' },
      canReview:          { type: Boolean, default: true },
      canManageTeam:       { type: Boolean, default: true },
      canDecideApplicants: { type: Boolean, default: false },
      canEditInterview:    { type: Boolean, default: false },
      canIntervene:        { type: Boolean, default: false },
      canPublish:          { type: Boolean, default: false },
      since:               { type: Date,    default: null },
      appointedBy:         { type: String,  default: '' },
      // Away mode, set by the lead themself: their reviews fall to the
      // co-lead and the owner until this date (lib/leads.js isLeadAvailable).
      awayUntil:           { type: Date,    default: null },
    },

    // ── Paused by a lead (docs/team-leads.md L2) ─────────────────────────────
    // While paused the contributor can read but not write (guard.js `write`).
    // `until` null with `active` set means until a lead lifts it.
    paused: {
      active: { type: Boolean, default: false },
      until:  { type: Date,    default: null },
      reason: { type: String,  default: '', trim: true, maxlength: 500 },
      byId:   { type: String,  default: '' },
      byName: { type: String,  default: '' },
      at:     { type: Date,    default: null },
    },

    lastSignedInAt: { type: Date, default: null },
    stats: { type: StatsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Only applicants with a decision waiting carry the field; the sweep reads
// just those (lib/applicants.js applyDueDecisions).
ContributorSchema.index({ 'pendingDecision.decideAt': 1 }, { sparse: true });

ContributorSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

ContributorSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 12);
};

export const Contributor =
  mongoose.models.Contributor ||
  mongoose.model('Contributor', ContributorSchema);