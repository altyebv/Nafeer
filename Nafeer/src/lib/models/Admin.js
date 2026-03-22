import mongoose from 'mongoose';
import bcrypt    from 'bcryptjs';

const AdminSchema = new mongoose.Schema(
  {
    username:     { type: String, required: true, unique: true, trim: true, lowercase: true },
    email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    displayName:  { type: String, default: '', trim: true },
    isActive:     { type: Boolean, default: true },
    lastSignedInAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AdminSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

AdminSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 12);
};

export const Admin =
  mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
