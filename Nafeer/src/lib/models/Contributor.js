import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { SUBJECT_IDS } from '@/shared/curriculum';

const ContributorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false, // Never returned in queries by default
    },
    subject: {
      type: String,
      required: true,
      enum: SUBJECT_IDS,
    },
    background: {
      type: String,
      required: true,
    },
    motivation: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    role: {
      type: String,
      enum: ['contributor', 'admin'],
      default: 'contributor',
    },
  },
  { timestamps: true }
);

// Instance method: check password
ContributorSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Static method: set password
ContributorSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 12);
};

export const Contributor =
  mongoose.models.Contributor ||
  mongoose.model('Contributor', ContributorSchema);