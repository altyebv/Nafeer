import mongoose from 'mongoose';

// ─── Interview question subdocument ───────────────────────────────────────────
const QuestionSchema = new mongoose.Schema(
  {
    text:        { type: String, required: true, trim: true },
    placeholder: { type: String, default: '',    trim: true },
    minChars:    { type: Number, default: 80 },
    order:       { type: Number, default: 0  },
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

// ─── Contributor role schema ───────────────────────────────────────────────────
const ContributorRoleSchema = new mongoose.Schema(
  {
    // Display info
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    category:    { type: String, required: true, enum: ['content', 'development', 'design'] },
    subcategory: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },

    // Availability
    isActive: { type: Boolean, default: true },
    order:    { type: Number,  default: 0    },

    // Interview configuration
    interviewQuestions: { type: [QuestionSchema], default: [] },
    microTask:          { type: MicroTaskSchema,  default: () => ({ prompt: '', minChars: 80 }) },
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
