import mongoose from 'mongoose';

// ─── Interview question subdocument ───────────────────────────────────────────
const QuestionSchema = new mongoose.Schema(
  {
    text:          { type: String, required: true, trim: true },
    placeholder:   { type: String, default: '',    trim: true },
    minChars:      { type: Number, default: 80 },
    order:         { type: Number, default: 0  },
    // Optional: only surface this question when the applicant selected these subjects.
    // Empty array means the question applies to all applicants in this role.
    subjectFilter: { type: [String], default: [] },
  },
  { _id: true }
);

// ─── Micro task subdocument ───────────────────────────────────────────────────
const MicroTaskSchema = new mongoose.Schema(
  {
    prompt:   { type: String, default: '', trim: true },
    minChars: { type: Number, default: 80 },
  },
  { _id: false }
);

// ─── Subject-specific question entry ─────────────────────────────────────────
// Maps a subjectId to a tailored set of questions + micro-task.
// Used by contributor roles that need per-subject interview customisation
// (e.g. a subject-specialist applying for Physics gets physics-specific tasks).
const SubjectQuestionEntrySchema = new mongoose.Schema(
  {
    subjectId: { type: String, required: true, trim: true },
    questions: { type: [QuestionSchema], default: [] },
    microTask: { type: MicroTaskSchema,  default: () => ({ prompt: '', minChars: 80 }) },
  },
  { _id: false }
);

// ─── Contributor role schema ───────────────────────────────────────────────────
const ContributorRoleSchema = new mongoose.Schema(
  {
    // Display info
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Covers both legacy values (content/development/design) and current seed values
    category: {
      type:     String,
      required: true,
      enum:     ['learning', 'core', 'growth', 'operations', 'community', 'content', 'development', 'design'],
    },
    subcategory: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },

    // Portfolio / links prompt — rendered on the join form for roles that need it (devs, designers).
    // Leave empty to hide the field for this role entirely.
    portfolioPrompt: { type: String, default: '', trim: true },

    // Availability
    isActive: { type: Boolean, default: true },
    order:    { type: Number,  default: 0    },

    // Interview configuration
    // Generic questions / micro-task — used as fallback when no subject-specific entry matches.
    interviewQuestions: { type: [QuestionSchema],            default: [] },
    microTask:          { type: MicroTaskSchema,             default: () => ({ prompt: '', minChars: 80 }) },
    // Subject-specific overrides — keyed by subjectId.
    // When a contributor's primary subject of interest matches an entry here,
    // that entry's questions + micro-task replace the generic ones above.
    subjectQuestionMap: { type: [SubjectQuestionEntrySchema], default: [] },
  },
  { timestamps: true }
);

// Auto-generate slug from name if not provided
ContributorRoleSchema.pre('validate', function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]/g, '')
      .slice(0, 60);
  }
});

export const ContributorRole =
  mongoose.models.ContributorRole ||
  mongoose.model('ContributorRole', ContributorRoleSchema);